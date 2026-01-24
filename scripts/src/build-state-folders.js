// scripts/src/build-state-folders.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ROOT assumptions:
 * - resources/statesFiles/<state>.json   (input)
 * - states/<state-slug>/...             (output)
 */
const ROOT = process.cwd();
const STATES_JSON_DIR = path.join(ROOT, "resources", "statesFiles");
const OUT_STATES_DIR = path.join(ROOT, "states");

function todayISODate() {
    // YYYY-MM-DD
    return new Date().toISOString().slice(0, 10);
}

function slugify(str) {
    return String(str || "")
        .trim()
        .toLowerCase()
        .normalize("NFD") // remove accents
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Updates ALL <lastmod>YYYY-MM-DD</lastmod> to provided date.
 * Keeps the rest of the XML intact.
 */
function updateLastmod(xmlString, nextDate) {
    if (!xmlString) return xmlString;

    // Replace any <lastmod>...</lastmod> with the same nextDate
    // (Works even if there are multiple lastmod entries)
    return xmlString.replace(
        /<lastmod>\s*\d{4}-\d{2}-\d{2}\s*<\/lastmod>/g,
        `<lastmod>${nextDate}</lastmod>`
    );
}

function detectStateSpecialFolder(stateName, stateSlug) {
    // Special rules:
    // - Louisiana => "parishes"
    // - Puerto Rico => "cities"
    // - Default => "counties"
    const s = (stateName || "").toLowerCase();
    if (stateSlug === "louisiana" || s === "louisiana") return "parishes";
    if (
        stateSlug === "puerto-rico" ||
        s === "puerto rico" ||
        s === "puerto-rico" ||
        stateSlug === "pr"
    )
        return "cities";
    return "counties";
}

async function listStateJsonFiles() {
    try {
        const files = await fs.readdir(STATES_JSON_DIR);
        return files
            .filter((f) => f.toLowerCase().endsWith(".json"))
            .sort((a, b) => a.localeCompare(b));
    } catch (e) {
        throw new Error(
            `No pude leer la carpeta statesFiles: ${STATES_JSON_DIR}\n` +
            `Crea la carpeta y pon tus JSONs ahí.\n` +
            `Error: ${e?.message || e}`
        );
    }
}

async function chooseStateFileInteractively(files) {
    const rl = readline.createInterface({ input, output });

    console.log("\n📦 States JSON disponibles en resources/statesFiles:\n");
    files.forEach((f, i) => console.log(`  ${i + 1}) ${f}`));
    console.log("");

    const ans = await rl.question(
        "Escribe el número del estado a generar (o el nombre exacto del archivo .json): "
    );

    rl.close();

    const trimmed = ans.trim();
    const asNum = Number(trimmed);

    if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= files.length) {
        return files[asNum - 1];
    }

    // allow user to type full filename
    const typed = trimmed.endsWith(".json") ? trimmed : `${trimmed}.json`;
    const match = files.find((f) => f.toLowerCase() === typed.toLowerCase());
    if (!match) {
        throw new Error(
            `Selección inválida. No encontré: "${trimmed}".\n` +
            `Asegúrate de que el archivo exista dentro de ${STATES_JSON_DIR}`
        );
    }
    return match;
}

async function readStateJson(absPath) {
    const raw = await fs.readFile(absPath, "utf8");
    return JSON.parse(raw);
}

function buildStateSitemapIndex({ entries, lastmod }) {
    // entries: array of { loc: string }
    // Keep it simple + standard sitemapindex
    const lines = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);

    for (const e of entries) {
        if (!e?.loc) continue;
        lines.push(`  <sitemap>`);
        lines.push(`    <loc>${e.loc}</loc>`);
        lines.push(`    <lastmod>${lastmod}</lastmod>`);
        lines.push(`  </sitemap>`);
    }

    lines.push(`</sitemapindex>`);
    lines.push(""); // newline at end
    return lines.join("\n");
}

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function writeFileEnsuringDir(filePath, content) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf8");
}

async function main() {
    const lastmod = todayISODate();

    const files = await listStateJsonFiles();
    if (!files.length) {
        console.log(
            `No hay JSONs en: ${STATES_JSON_DIR}\n` +
            `Coloca ahí tus archivos (ej: alabama.json, alaska.json, etc.)`
        );
        process.exit(1);
    }

    const selected = await chooseStateFileInteractively(files);
    const absJson = path.join(STATES_JSON_DIR, selected);

    const stateJson = await readStateJson(absJson);

    // Your JSON shape (based on alabama.json you uploaded):
    // { stateName, counties: [ { countyName, countyDomain, countySitemap, embeddedSitemap, ... } ] }
    const stateName = stateJson.stateName || selected.replace(/\.json$/i, "");
    const stateSlug = slugify(stateName);

    const divisions = stateJson.counties || [];
    if (!Array.isArray(divisions) || divisions.length === 0) {
        console.log(`❌ El JSON no trae "counties" o está vacío: ${absJson}`);
        process.exit(1);
    }

    const divisionFolder = detectStateSpecialFolder(stateName, stateSlug);

    const stateOutDir = path.join(OUT_STATES_DIR, stateSlug);
    const divisionRootDir = path.join(stateOutDir, divisionFolder);

    console.log("\n==================================================");
    console.log("✅ BUILD STATE FOLDERS");
    console.log(`State: ${stateName}`);
    console.log(`State slug: ${stateSlug}`);
    console.log(`Input JSON: ${absJson}`);
    console.log(`Output dir: ${stateOutDir}`);
    console.log(`Folder type: ${divisionFolder}`);
    console.log(`Lastmod: ${lastmod}`);
    console.log(`Total divisions: ${divisions.length}`);
    console.log("==================================================\n");

    // 1) Create/update each division sitemap.xml
    let ok = 0;
    let failed = 0;

    for (let i = 0; i < divisions.length; i++) {
        const d = divisions[i];

        // For normal states: division is county
        // For Louisiana: division is parish (still stored in counties[] in your JSON most likely)
        // For Puerto Rico: you want division folders to be "cities" (we treat countyName as cityName)
        const divisionName = d.countyName || `division-${i + 1}`;
        const divisionSlug = slugify(divisionName);

        const folderPath = path.join(divisionRootDir, divisionSlug);
        const sitemapPath = path.join(folderPath, "sitemap.xml");

        try {
            if (!d.embeddedSitemap) {
                throw new Error(
                    `No existe embeddedSitemap para "${divisionName}". (countyName: ${d.countyName})`
                );
            }

            const updated = updateLastmod(d.embeddedSitemap, lastmod);

            await writeFileEnsuringDir(sitemapPath, updated);

            ok++;
            if ((i + 1) % 10 === 0 || i === divisions.length - 1) {
                console.log(`🧩 Progress: ${i + 1}/${divisions.length}`);
            }
        } catch (e) {
            failed++;
            console.error(`❌ FAILED "${divisionName}":`, e?.message || e);
        }
    }

    // 2) Create/update state-level sitemap.xml
    // Build entries from countySitemap property
    const entries = divisions
        .map((d) => ({ loc: d.countySitemap }))
        .filter((x) => x.loc);

    const stateSitemapXml = buildStateSitemapIndex({ entries, lastmod });
    const stateSitemapPath = path.join(stateOutDir, "sitemap.xml");
    await writeFileEnsuringDir(stateSitemapPath, stateSitemapXml);

    console.log("\n--------------------------------------------------");
    console.log(`✅ DONE: ${stateName}`);
    console.log(`Divisions OK: ${ok}`);
    console.log(`Divisions Failed: ${failed}`);
    console.log(`State sitemap: ${stateSitemapPath}`);
    console.log(`Divisions root: ${divisionRootDir}`);
    console.log("--------------------------------------------------\n");
}

main().catch((e) => {
    console.error("❌ Fatal:", e?.message || e);
    process.exit(1);
});
