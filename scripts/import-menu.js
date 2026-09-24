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

// Inteligentné parsovanie reálneho textu z PDF pre 4M Restaurant
function parseRealMenu(text) {
    const daysMap = {
        "PONDELOK": "pondelok",
        "UTOROK": "utorok",
        "STREDA": "streda",
        "ŠTVRTOK": "stvrtok",
        "PIATOK": "piatok"
    };

    const parsed = {};
    Object.values(daysMap).forEach(day => {
        parsed[day] = { soup: null, menu1: null, menu2: null, menu3: null, menu4: null, menu5: null, menu6: null };
    });

    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let currentDay = null;

    lines.forEach(line => {
        const upperLine = line.toUpperCase();
        
        // Zistenie dňa v týždni
        for (const [key, val] of Object.entries(daysMap)) {
            if (upperLine.startsWith(key)) {
                currentDay = val;
                // Ak je polievka hneď na riadku s dňom (napr. "PONDELOK: Gulášová")
                const parts = line.split(":");
                if (parts.length > 1 && parts[1].trim()) {
                    parsed[currentDay].soup = parts[1].trim();
                }
                return;
            }
        }

        if (!currentDay) return;

        // Ak riadok začína ako polievka (ak nie je na riadku s dňom)
        if (!parsed[currentDay].soup && (upperLine.includes("POLIEVKA") || !upperLine.startsWith("MENU"))) {
            // Ak to nie je iné menu, berieme to ako pokračovanie polievky
            if (!upperLine.startsWith("MENU 1") && !upperLine.startsWith("MENU 2") && !upperLine.startsWith("MENU 3") && !upperLine.startsWith("MENU 4")) {
                parsed[currentDay].soup = parsed[currentDay].soup ? parsed[currentDay].soup + ", " + line : line;
                return;
            }
        }

        // Parsovanie Menu 1 až 4
        if (upperLine.startsWith("MENU 1:")) {
            parsed[currentDay].menu1 = line.replace(/^MENU\s*1:\s*/i, "").trim();
        } else if (upperLine.startsWith("MENU 2:")) {
            parsed[currentDay].menu2 = line.replace(/^MENU\s*2:\s*/i, "").trim();
        } else if (upperLine.startsWith("MENU 3:")) {
            parsed[currentDay].menu3 = line.replace(/^MENU\s*3:\s*/i, "").trim();
        } else if (upperLine.startsWith("MENU 4:")) {
            parsed[currentDay].menu4 = line.replace(/^MENU\s*4:\s*/i, "").trim();
        } else {
            // Ak je to dlhší text, ktorý patrí k predošlému menu (zalamovanie riadkov v PDF)
            if (currentDay) {
                if (parsed[currentDay].menu4 && !parsed[currentDay].menu4.endsWith("€") && !line.startsWith("MENU")) {
                    parsed[currentDay].menu4 += " " + line;
                } else if (parsed[currentDay].menu3 && !parsed[currentDay].menu3.endsWith("€") && !line.startsWith("MENU")) {
                    parsed[currentDay].menu3 += " " + line;
                } else if (parsed[currentDay].menu2 && !parsed[currentDay].menu2.endsWith("€") && !line.startsWith("MENU")) {
                    parsed[currentDay].menu2 += " " + line;
                } else if (parsed[currentDay].menu1 && !parsed[currentDay].menu1.endsWith("€") && !line.startsWith("MENU")) {
                    parsed[currentDay].menu1 += " " + line;
                }
            }
        }
    });

    console.log("📊 Výsledok parsovania:", JSON.stringify(parsed, null, 2));
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
            soup: menu.soup || "Polievka",
            menu1: menu.menu1 || "Neuvedené",
            menu2: menu.menu2 || null,
            menu3: menu.menu3 || null,
            menu4: menu.menu4 || null,
            menu5: null,
            menu6: null
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

    console.log("✅ Reálne menu bolo úspešne rozparsované a uložené do Supabase!");
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
