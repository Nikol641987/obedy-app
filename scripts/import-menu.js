console.log("🚀 SPUSTAM IMPORT REÁLNEHO MENU CEZ PUPPETEER");
const puppeteer = require("puppeteer");

const PAGE_URL = "https://superobed.sk/podnik/4m-restaurant/";
const SUPABASE_URL = "https://krzouuhouzzlvsygmalb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    throw new Error("Chýba SUPABASE_KEY v GitHub Actions secrets.");
}

function cleanMenuItem(text) {
    let result = String(text || "");
    result = result.replace(/\s*(?:6[,.]90|9[,.]20|8[,.]00|8[,.]50)[€%]?[0-9]*.*$/i, "");
    result = result.replace(/\s+\d{1,2}(?:[,.]\d{1,2})?\s*$/i, "");
    result = result.replace(/\s*[-–—:;,.\s]+$/u, "");
    result = result.replace(/\s+/g, " ").trim();
    return result;
}

function parseWeeklyMenuText(text) {
    const dayDefinitions = [
        { key: "pondelok", pattern: "PONDELOK" },
        { key: "utorok", pattern: "UTOROK" },
        { key: "streda", pattern: "STREDA" },
        { key: "stvrtok", pattern: "(?:ŠTVRTOK|STVRTOK)" },
        { key: "piatok", pattern: "PIATOK" }
    ];

    const result = {};

    dayDefinitions.forEach((day, index) => {
        const nextDay = dayDefinitions[index + 1];
        const endPattern = nextDay
            ? `(?=${nextDay.pattern})`
            : `(?=Appetit|Alergény:|Otváracie|$)`;

        const dayRegex = new RegExp(`${day.pattern}\\s*:?\\s*([\\s\\S]*?)${endPattern}`, "i");
        const dayMatch = text.match(dayRegex);

        if (!dayMatch) {
            result[day.key] = { soup: "", menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" };
            return;
        }

        const dayText = dayMatch[1].trim();
        const soupMatch = dayText.match(/^([\s\S]*?)(?=\s*MENU\s*1|\s*1\.\s*)/i);
        let soup = soupMatch ? soupMatch[1] : "";
        soup = soup.replace(/\s+/g, " ").trim();

        const parsedDay = { soup, menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" };

        for (let menuNumber = 1; menuNumber <= 6; menuNumber++) {
            const nextNumber = menuNumber + 1;
            const menuRegex = new RegExp(
                `(?:MENU\\s*${menuNumber}|${menuNumber}\\.)\\s*:?\\s*([\\s\\S]*?)` +
                (menuNumber < 6 ? `(?=\\s*(?:MENU\\s*${nextNumber}|${nextNumber}\\.)|$)` : "$"),
                "i"
            );

            const menuMatch = dayText.match(menuRegex);
            if (menuMatch) {
                parsedDay[`menu${menuNumber}`] = cleanMenuItem(menuMatch[1]);
            }
        }

        result[day.key] = parsedDay;
    });

    return result;
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
        const menu = parsedMenu[dayKey];
        const menuDate = new Date(monday);
        menuDate.setDate(monday.getDate() + index);

        rows.push({
            week_from: formatDate(monday),
            menu_date: formatDate(menuDate),
            day_of_week: index + 1,
            soup: menu?.soup || null,
            menu1: menu?.menu1 || null,
            menu2: menu?.menu2 || null,
            menu3: menu?.menu3 || null,
            menu4: menu?.menu4 || null,
            menu5: menu?.menu5 || null,
            menu6: menu?.menu6 || null
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

    console.log("✅ Reálne jedlá boli úspešne uložené do Supabase.");
}

async function main() {
    console.log("🌐 Načítavam stránku cez bezhlavý prehliadač Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(PAGE_URL, { waitUntil: "networkidle2" });

    const extractedText = await page.evaluate(() => document.body.innerText);
    await browser.close();

    console.log("========================================");
    console.log("NAČÍTANÉ AKTUÁLNE MENU ZO STRÁNKY:");
    console.log("========================================");
    console.log(extractedText.slice(0, 1500));
    console.log("========================================");

    const parsedMenu = parseWeeklyMenuText(extractedText);

    console.log("========================================");
    console.log("SPRACOVANÉ JEDLÁ PRE DATABÁZU:");
    console.log("========================================");
    console.log(JSON.stringify(parsedMenu, null, 2));

    const monday = getMonday(new Date());
    await saveMenuToSupabase(parsedMenu, monday);
}

main().catch(error => {
    console.error("❌ Import menu zlyhal:", error);
    process.exit(1);
});
