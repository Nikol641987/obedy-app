const https = require("https");
const pdfParse = require("pdf-parse");

const MENU_URL = "https://superobed.sk/podnik/4m-restaurant/denne-menu-34?h=3be11773ba";
const SUPABASE_URL = "https://krzouuhouzzlvsygmalb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    throw new Error("Chýba SUPABASE_KEY v GitHub Actions secrets.");
}

function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadBuffer(res.headers.location).then(resolve).catch(reject);
            }
            let chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}

function getMonday(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(12, 0, 0, 0);
    return result;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Jednoduchá funkcia na základe kľúčových slov v texte z PDF
function parseRealMenu(text) {
    console.log("--- ZAČIATOK SUROVÉHO TEXTU Z PDF ---");
    console.log(text.substring(0, 1000)); // Vypíše začiatok textu do logov pre kontrolu
    console.log("--- KONIEC UKÁŽKY TEXTU ---");

    // Predvolená štruktúra pre 5 pracovných dní
    const days = ["pondelok", "utorok", "streda", "stvrtok", "piatok"];
    const parsed = {};

    days.forEach(day => {
        parsed[day] = {
            soup: "Polievka z PDF",
            menu1: "Menu 1 z PDF",
            menu2: "Menu 2 z PDF",
            menu3: null,
            menu4: null,
            menu5: null,
            menu6: null
        };
    });

    // Sem neskôr doplníme detailné rozparsovanie podľa toho,
    // čo uvidíme v logoch z GitHub Actions.
    return parsed;
}

async function saveMenuToSupabase(parsedMenu, monday) {
    const dayKeys = ["pondelok", "utorok", "streda", "stvrtok", "piatok"];
    const rows = [];

    dayKeys.forEach((dayKey, index) => {
        const menu = parsedMenu[dayKey] || {};
        const menuDate = new Date(monday);
        menuDate.setDate(monday.getDate() + index);

        rows.push({
            week_from: formatDate(monday),
            menu_date: formatDate(menuDate),
            day_of_week: index + 1,
            soup: menu.soup,
            menu1: menu.menu1,
            menu2: menu.menu2,
            menu3: menu.menu3,
            menu4: menu.menu4,
            menu5: menu.menu5,
            menu6: menu.menu6
        });
    });

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/weekly_menu?on_conflict=week_from,day_of_week`,
        {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify(rows)
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase uloženie zlyhalo: ${response.status} ${errorText}`);
    }

    console.log("✅ Menu s parsovaním úspešne uložené do Supabase!");
}

async function main() {
    console.log("📥 Sťahujem dáta z priameho odkazu...");
    const buffer = await downloadBuffer(MENU_URL);

    const pdfData = await pdfParse(buffer);
    console.log("📖 PDF text úspešne prečítaný (dĺžka: " + pdfData.text.length + " znakov)");

    const parsedMenu = parseRealMenu(pdfData.text);
    const monday = getMonday(new Date());

    await saveMenuToSupabase(parsedMenu, monday);
}

main().catch(error => {
    console.error("❌ Chyba:", error);
    process.exit(1);
});
