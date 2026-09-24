const https = require("https");
const pdfParse = require("pdf-parse");

// Priamy odkaz na denné menu 4M Restaurant
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
            soup: menu.soup || null,
            menu1: menu.menu1 || null,
            menu2: menu.menu2 || null,
            menu3: menu.menu3 || null,
            menu4: menu.menu4 || null,
            menu5: menu.menu5 || null,
            menu6: menu.menu6 || null
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

    console.log("✅ Dáta boli úspešne uložené do Supabase.");
}

async function main() {
    console.log("📥 Sťahujem priamy obsah z:", MENU_URL);
    const buffer = await downloadBuffer(MENU_URL);

    // Skúsime to prečítať ako PDF, ak by to bol binárny súbor
    try {
        const pdfData = await pdfParse(buffer);
        console.log("📖 Prečítaný PDF text (dĺžka:", pdfData.text.length, "znakov)");
        console.log(pdfData.text.substring(0, 400));
    } catch (e) {
        console.log("⚠️ Nie je to PDF, obsah začína ako HTML:", buffer.toString().substring(0, 200));
    }

    const parsedMenu = {
        pondelok: { soup: "Polievka 4M", menu1: "Menu 1", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        utorok: { soup: "Polievka 4M", menu1: "Menu 1", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        streda: { soup: "Polievka 4M", menu1: "Menu 1", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        stvrtok: { soup: "Polievka 4M", menu1: "Menu 1", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        piatok: { soup: "Polievka 4M", menu1: "Menu 1", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" }
    };

    const monday = getMonday(new Date());
    await saveMenuToSupabase(parsedMenu, monday);
}

main().catch(error => {
    console.error("❌ Chyba:", error);
    process.exit(1);
});
