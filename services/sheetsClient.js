// services/sheetsClient.js
import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";

function norm(str) {
    return String(str || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function isFilled(v) {
    return v !== null && v !== undefined && String(v).trim() !== "";
}

function colToLetter(colIndex0) {
    // 0 -> A, 25 -> Z, 26 -> AA ...
    let n = colIndex0 + 1;
    let s = "";
    while (n > 0) {
        const r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

async function getSheetsClient() {
    const keyFile =
        process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        "./google-cloud.json";

    const absKeyFile = path.isAbsolute(keyFile)
        ? keyFile
        : path.join(process.cwd(), keyFile);

    // Validación temprana para error claro
    await fs.access(absKeyFile).catch(() => {
        throw new Error(
            `Google Cloud keyfile not found: ${absKeyFile}\n` +
            `Set GOOGLE_CLOUD_KEYFILE in .env or place google-cloud.json at repo root.`
        );
    });

    const auth = new google.auth.GoogleAuth({
        keyFile: absKeyFile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
}

/**
 * Lee TODA la data de la tab (A:Z) y crea un índice por Account Name.
 * - header row = primera fila
 * - rowNumber = 1-based (como Google Sheets)
 */
export async function loadSheetIndex({
    spreadsheetId,
    sheetName,
    range = "A:Z",
    accountNameHeader = "Account Name",
    locationIdHeader = "Location Id",
}) {
    if (!spreadsheetId) throw new Error("Missing spreadsheetId");
    if (!sheetName) throw new Error("Missing sheetName");

    const sheets = await getSheetsClient();
    const a1 = `${sheetName}!${range}`;

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: a1,
        valueRenderOption: "UNFORMATTED_VALUE",
    });

    const values = res?.data?.values || [];
    if (values.length === 0) {
        return {
            sheetName,
            range: a1,
            headers: [],
            headerMap: new Map(),
            rows: [],
            mapByAccountName: new Map(),
            accountNameCol: -1,
            locationIdCol: -1,
        };
    }

    const headers = values[0].map((h) => String(h || "").trim());
    const headerMap = new Map(headers.map((h, i) => [h, i]));

    const accountNameCol = headerMap.get(accountNameHeader);
    const locationIdCol = headerMap.get(locationIdHeader);

    if (accountNameCol === undefined) {
        throw new Error(
            `Sheet "${sheetName}" missing header "${accountNameHeader}". Found headers: ${headers.join(
                ", "
            )}`
        );
    }
    if (locationIdCol === undefined) {
        throw new Error(
            `Sheet "${sheetName}" missing header "${locationIdHeader}". Found headers: ${headers.join(
                ", "
            )}`
        );
    }

    // rows (sin header)
    const rows = values.slice(1);

    // Index: Account Name -> { rowNumber, locationId, row }
    const mapByAccountName = new Map();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || [];
        const rowNumber = i + 2; // +1 por header, +1 porque 1-based
        const accountName = row[accountNameCol];
        if (!isFilled(accountName)) continue;

        const key = norm(accountName);
        const locationId = row[locationIdCol];

        // Si hay duplicados en sheet, nos quedamos con el primero que tenga locationId,
        // o el primero que aparezca.
        const existing = mapByAccountName.get(key);
        if (!existing) {
            mapByAccountName.set(key, {
                rowNumber,
                accountName,
                locationId: isFilled(locationId) ? String(locationId).trim() : "",
                row,
            });
        } else {
            // Preferir el que ya tiene locationId
            if (!isFilled(existing.locationId) && isFilled(locationId)) {
                mapByAccountName.set(key, {
                    rowNumber,
                    accountName,
                    locationId: String(locationId).trim(),
                    row,
                });
            }
        }
    }

    return {
        sheetName,
        range: a1,
        headers,
        headerMap,
        rows,
        mapByAccountName,
        accountNameCol,
        locationIdCol,
    };
}

/**
 * Actualiza el Location Id en una fila existente (por rowNumber).
 */
export async function updateLocationIdInRow({
    spreadsheetId,
    sheetName,
    locationIdColIndex0,
    rowNumber,
    locationId,
}) {
    if (!spreadsheetId) throw new Error("Missing spreadsheetId");
    if (!sheetName) throw new Error("Missing sheetName");
    if (locationIdColIndex0 < 0) throw new Error("Invalid locationIdColIndex0");
    if (!rowNumber) throw new Error("Missing rowNumber");

    const sheets = await getSheetsClient();

    const colLetter = colToLetter(locationIdColIndex0);
    const rangeA1 = `${sheetName}!${colLetter}${rowNumber}`;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: rangeA1,
        valueInputOption: "RAW",
        requestBody: { values: [[locationId]] },
    });

    return { rangeA1, rowNumber, locationId };
}

/**
 * Append row al final.
 * valuesArray debe respetar el orden de headers (ideal).
 * Si solo quieres append básico, usa buildRowFromHeaders().
 */
export async function appendRow({
    spreadsheetId,
    sheetName,
    valuesArray,
}) {
    const sheets = await getSheetsClient();

    const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [valuesArray] },
    });

    // extraer rowNumber desde updatedRange (ej: "Counties!A120:Z120")
    const updatedRange = res?.data?.updates?.updatedRange || "";
    let rowNumber = null;
    const m = updatedRange.match(/![A-Z]+(\d+):/);
    if (m) rowNumber = Number(m[1]);

    return { updatedRange, rowNumber };
}

/**
 * Construye un row array alineado a headers.
 * dataMap keys deben ser headers exactos.
 */
export function buildRowFromHeaders(headers, dataMap) {
    return headers.map((h) => {
        const v = dataMap[h];
        return v === undefined || v === null ? "" : v;
    });
}

export { norm, isFilled };
