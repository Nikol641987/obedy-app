console.log("🚀 SPUSTAM IMPORT PRIAMO Z URL DENNÉHO MENU");
const puppeteer = require("puppeteer");

const PAGE_URL = "https://superobed.sk/podnik/4m-restaurant/denne-menu-34?h=3be11773ba";
const SUPABASE_URL = "https://krzouuhouzzlvsygmalb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    throw new Error("Chýba SUPABASE_KEY v GitHub Actions secrets.");
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

    console.log("✅ Menu bolo úspešne uložené do Supabase.");
}

async function main() {
    console.log("🌐 Načítavam čistú stránku denného menu cez Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.goto(PAGE_URL, { waitUntil: "networkidle2" });

    const pageText = await page.evaluate(() => document.body.innerText);
    await browser.close();

    console.log("========================================");
    console.log("TEXT Z DENNÉHO MENU:");
    console.log("========================================");
    console.log(pageText);
    console.log("========================================");

    // Tu zatial necháme pripravenú štruktúru, zatiaľ čo mi pošlete výpis textu z konzoly,
    // aby sme presne videli, ako sú tam jedlá napísané pod sebou.
    const parsedMenu = {
        pondelok: { soup: "Test polievka", menu1: "Test menu 1", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        utorok: { soup: "", menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        streda: { soup: "", menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        stvrtok: { soup: "", menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" },
        piatok: { soup: "", menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" }
    };

    const monday = getMonday(new Date());
    await saveMenuToSupabase(parsedMenu, monday);
}

main().catch(error => {
    console.error("❌ Chyba:", error);
    process.exit(1);
});
