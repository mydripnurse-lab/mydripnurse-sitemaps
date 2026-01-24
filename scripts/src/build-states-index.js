// scripts/src/build-states-index.js
import fs from "fs/promises";
import path from "path";

const STATES_FILES_DIR = path.join(process.cwd(), "resources", "statesFiles");
const OUT_DIR = path.join(process.cwd(), "public", "ui");
const OUT_FILE = path.join(OUT_DIR, "states-index.json");

// Si lo vas a servir desde Netlify, pon el BASE URL público de tu repo/host.
// Ej: https://sitemaps.mydripnurse.com
const BASE_URL = process.env.SITEMAPS_BASE_URL || "https://sitemaps.mydripnurse.com";

function slugifyFolderName(input) {
    // IMPORTANTE: no “omitas” letras con tildes -> las convertimos a su base (á->a, ü->u)
    // y removemos caracteres no válidos para rutas.
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // diacríticos
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s-]/g, "") // fuera símbolos
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

async function main() {
    await fs.mkdir(OUT_DIR, { recursive: true });

    const files = await fs.readdir(STATES_FILES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const states = [];
    for (const file of jsonFiles) {
        const full = path.join(STATES_FILES_DIR, file);
        const raw = await fs.readFile(full, "utf8");
        const parsed = JSON.parse(raw);

        const stateName = parsed.stateName || file.replace(".json", "");
        const stateSlug = slugifyFolderName(stateName);

        states.push({
            stateName,
            stateSlug,
            // IMPORTANTE: apunta a tu JSON público
            // Ajusta si tu ruta pública es distinta:
            // ej: /resources/statesFiles/alabama.json
            stateJsonUrl: `${BASE_URL}/resources/statesFiles/${file}`,
        });
    }

    states.sort((a, b) => a.stateName.localeCompare(b.stateName));

    const out = {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        states,
    };

    await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2), "utf8");
    console.log("✅ Generated:", OUT_FILE);
    console.log("States:", states.length);
}

main().catch((e) => {
    console.error("❌ build-states-index failed:", e);
    process.exit(1);
});
