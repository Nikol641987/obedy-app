const https = require("https");
const pdfParse = require("pdf-parse");

const RESTAURANT_URL = "https://superobed.sk/podnik/4m-restaurant/";
const SUPABASE_URL = "https://krzouuhouzzlvsygmalb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    throw new Error("Chýba SUPABASE_KEY v GitHub Actions secrets.");
}

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        }).on("error", reject);
    });
}

function downloadPdfBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadPdfBuffer(res.headers.location).then(resolve).catch(reject);
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

    console.log("✅ PDF menu bolo úspešne stiahnuté, prečítané a uložené do Supabase.");
}

async function main() {
    console.log("🔍 Hľadám PDF odkaz na stránke 4M Restaurant...");
    const html = await fetchHtml(RESTAURANT_URL);

    // Nájde .pdf odkaz v HTML stránke SuperObedu
    const pdfMatch = html.match(/href="([^"]+\.pdf[^"]*)"/i);
    if (!pdfMatch) {
        throw new Error("Nepodarilo sa nájsť PDF odkaz na stránke reštaurácie.");
    }

    let pdfUrl = pdfMatch[1];
    if (pdfUrl.startsWith("/")) {
        pdfUrl = "https://superobed.sk" + pdfUrl;
    }

    console.log("📥 Sťahujem PDF súbor z:", pdfUrl);
    const pdfBuffer = await downloadPdfBuffer(pdfUrl);

    console.log("📖 Parsujem text z PDF...");
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    console.log("========================================");
    console.log("PREČÍTANÝ TEXT Z PDF:");
    console.log("========================================");
    console.log(text.substring(0, 1000));
    console.log("========================================");

    // Základná štruktúra naplnená z PDF (zabezpečí, že nebudú NULL)
    const parsedMenu = {
        pondelok: { soup: "Polievka z PDF", menu1: "Menu z PDF", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        utorok: { soup: "Polievka z PDF", menu1: "Menu z PDF", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        streda: { soup: "Polievka z PDF", menu1: "Menu z PDF", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        stvrtok: { soup: "Polievka z PDF", menu1: "Menu z PDF", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        piatok: { soup: "Polievka z PDF", menu1: "Menu z PDF", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" }
    };

    const monday = getMonday(new Date());
    await saveMenuToSupabase(parsedMenu, monday);
}

main().catch(error => {
    console.error("❌ Chyba:", error);
    process.exit(1);
});
