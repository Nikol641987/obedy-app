console.log("🚀 SPUSTAM NOVU VERZIU SKRIPTU 2026!");
const https = require("https");
const fs = require("fs");
const { execFileSync } = require("child_process");

const PAGE_URL = "https://superobed.sk/podnik/4m-restaurant/";
const SUPABASE_URL = "https://krzouuhouzzlvsygmalb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    throw new Error("Chýba SUPABASE_KEY v GitHub Actions secrets.");
}

// =====================================
// POMOCNÉ SŤAHOVANIE SÚBOROV (HTML, PDF)
// =====================================
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(
            url,
            { headers: { "User-Agent": "Mozilla/5.0 TMV-Obedy-Menu-Checker/1.0" } },
            response => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    const redirectUrl = new URL(response.headers.location, url).href;
                    return fetchUrl(redirectUrl).then(resolve).catch(reject);
                }

                if (response.statusCode !== 200) {
                    return reject(new Error(`Server vrátil stav ${response.statusCode}.`));
                }

                const contentType = response.headers["content-type"] || "";
                const chunks = [];

                response.on("data", chunk => chunks.push(chunk));
                response.on("end", () => {
                    resolve({
                        buffer: Buffer.concat(chunks),
                        contentType
                    });
                });
            }
        ).on("error", reject);
    });
}

// =====================================
// STIAHNUTIE SÚBORU MENU Z PAGE_URL
// =====================================
async function getMenuFile() {
    console.log("🔍 Sťahujem HTML stránku reštaurácie...");
    const pageData = await fetchUrl(PAGE_URL);
    const htmlText = pageData.buffer.toString("utf8");

    // 1. Ak existuje priamy PDF súbor s menu, stiahne ho
    const pdfMatch = htmlText.match(/href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/i);
    if (pdfMatch && pdfMatch[1]) {
        const targetUrl = new URL(pdfMatch[1], PAGE_URL).href;
        console.log("📄 Nájdené PDF menu:", targetUrl);
        return await fetchUrl(targetUrl);
    }

    // 2. Ak PDF nie je, ignorujeme galérie a spracujeme priamo HTML text
    console.log("ℹ️ Žiadne PDF nenájdené. Spracovávam priamo textový obsah HTML stránky...");
    return pageData;
}

// =====================================
// VYČISTENIE MENU
// =====================================
function cleanMenuItem(text) {
    let result = String(text || "");

    result = result.replace(/\s*(?:6[,.]90|9[,.]20)[€%]?[0-9]*.*$/i, "");
    result = result.replace(/\s+\d{1,2}(?:[,.]\d{1,2})?\s*$/i, "");
    result = result.replace(/[.,]?\d{1,2}(?:[.,]\d{1,2})?[.,]?(?:6[,.]90|9[,.]20)[0-9€%]*$/i, "");
    result = result.replace(/\s+\d{1,3}\s*$/i, "");
    result = result.replace(/([)])\s*\d{1,2}\s*$/i, "$1");
    result = result.replace(/\s*[-–—:;,.\s]+$/u, "");
    result = result.replace(/\s+/g, " ").trim();
    result = result.replace(/([a-zá-ž)])(?:1,3|1,7|3,7|1,3,7|13,7|137)\s*$/i, "$1");

    return result;
}

// =====================================
// PARSOVANIE CELÉHO TÝŽDŇA
// =====================================
function parseWeeklyMenuText(text) {
    const normalizedText = String(text || "")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();

    const dayDefinitions = [
        { key: "pondelok", pattern: "Pondelok" },
        { key: "utorok", pattern: "Utorok" },
        { key: "streda", pattern: "Streda" },
        { key: "stvrtok", pattern: "(?:Š|S)tv(?:rt|r)ok" },
        { key: "piatok", pattern: "Piatok" }
    ];

    const result = {};

    dayDefinitions.forEach((day, index) => {
        const nextDay = dayDefinitions[index + 1];
        const endPattern = nextDay
            ? `(?=${nextDay.pattern}\\s*:)`
            : `(?=Appetit Obedové menu|Polievka samostatne|Alergény:|$)`;

        const dayRegex = new RegExp(`${day.pattern}\\s*:\\s*([\\s\\S]*?)${endPattern}`, "i");
        const dayMatch = normalizedText.match(dayRegex);

        if (!dayMatch) {
            result[day.key] = { soup: "", menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" };
            return;
        }

        const dayText = dayMatch[1].trim();

        // POLIEVKA
        const soupMatch = dayText.match(/^([\s\S]*?)(?=\s*1\.\s*\d+g?\s*\/)/i);
        let soup = soupMatch ? soupMatch[1] : "";

        soup = soup.replace(/\s+/g, " ").trim();
        soup = soup.replace(/^0[,.:]?331\b/i, "0,33l");
        soup = soup.replace(/\s+\d+(?:[.,:]\d+)*\s*(?=\d+\s*ks\s*chlieb)/gi, " ");
        soup = soup.replace(/\s*[,.:+]+\s*(?=\d+\s*ks\s*chlieb)/gi, " ");
        soup = soup.replace(/\s+\d+(?:\s*[,.:]\s*\d+)*\s*$/gi, "");
        soup = soup.replace(/\s+/g, " ").trim();

        const parsedDay = { soup, menu1: "", menu2: "", menu3: "", menu4: "", menu5: "", menu6: "" };

        // MENU 1–6
        for (let menuNumber = 1; menuNumber <= 6; menuNumber++) {
            const nextNumber = menuNumber + 1;
            const menuRegex = new RegExp(
                `${menuNumber}\\.\\s*\\d+g?\\s*\\/([\\s\\S]*?)` +
                (menuNumber < 6 ? `(?=\\s*${nextNumber}\\.\\s*\\d+g?\\s*\\/)` : "$"),
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

// =====================================
// DÁTUM
// =====================================
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

// =====================================
// SUPABASE – ULOŽENIE MENU
// =====================================
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

    console.log("✅ Menu bolo uložené do Supabase.");
}

// =====================================
// HLAVNÁ FUNKCIA (UPRAVENÁ PRE HTML TEKST)
// =====================================
// =====================================
// HLAVNÁ FUNKCIA (UPRAVENÁ PRE HTML TEXT)
// =====================================
async function main() {
    console.log("🔄 Kontrolujem aktuálne menu na SuperObed...");

    const fileData = await getMenuFile();
    console.log(`✅ Dáta získané: ${fileData.buffer.length} bytes (typ: ${fileData.contentType})`);

    let extractedText = "";

    if (fileData.contentType.includes("application/pdf")) {
        const pdfPath = "/tmp/menu.pdf";
        fs.writeFileSync(pdfPath, fileData.buffer);
        console.log("📄 PDF uložené. Konvertujem PDF na obrázok PNG pre Tesseract...");

        let imagePath = pdfPath;
        try {
            execFileSync("pdftoppm", ["-png", "-r", "300", "-singlefile", pdfPath, "/tmp/menu_page"]);
            imagePath = "/tmp/menu_page.png";
        } catch (e) {
            console.warn("⚠️ Konverzia pdftoppm zlyhala, skúšam spustiť Tesseract priamo...");
        }

        console.log("🔎 Spúšťam Tesseract OCR na PDF...");
        extractedText = execFileSync(
            "tesseract",
            [imagePath, "stdout", "-l", "slk"],
            { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
        );
    } else {
        // Spracovanie HTML textu – vyčistenie značiek a úprava riadkovania
        console.log("📄 Spracovávam HTML text stránky...");
        const rawHtml = fileData.buffer.toString("utf8");

        extractedText = rawHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<\/div>/gi, "\n")
            .replace(/<\/li>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n/g, "\n");
    }

    if (!extractedText.trim()) {
        throw new Error("Nepodarilo sa získať žiadny text menu.");
    }

    console.log("========================================");
    console.log("SPRACOVANÝ TEXT MENU");
    console.log("========================================");
    console.log(extractedText);
    console.log("========================================");

    console.log("🔎 Spracúvam menu...");
    const parsedMenu = parseWeeklyMenuText(extractedText);

    console.log("========================================");
    console.log("SPRACOVANÉ MENU");
    console.log("========================================");
    console.log(JSON.stringify(parsedMenu, null, 2));

    const monday = getMonday(new Date());
    console.log("📅 Týždeň od:", formatDate(monday));

    await saveMenuToSupabase(parsedMenu, monday);
    console.log("🎉 Import menu úspešne dokončený.");
}
