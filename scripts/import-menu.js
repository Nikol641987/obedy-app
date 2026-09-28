const https = require("https");
const pdfParse = require("pdf-parse");

// Táto adresa sa na serveri presmeruje na aktuálne PDF (denne-menu-XX?h=...),
// takže "koncovku" netreba hľadať ručne.
const MENU_URL = "https://superobed.sk/podnik/4m-restaurant/denne-menu";
const SUPABASE_URL = "https://krzouuhouzzlvsygmalb.supabase.co";
const SUPABASE_KEY = (process.env.SUPABASE_KEY || "").replace(/\s+/g, "");

if (!SUPABASE_KEY) {
    throw new Error("Chýba SUPABASE_KEY v GitHub Actions secrets.");
}

// ---------- Sťahovanie ----------

function request(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        if (redirects > 5) return reject(new Error("Príliš veľa presmerovaní."));

        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                res.resume();
                // location môže byť relatívna, preto new URL(..., url)
                const next = new URL(res.headers.location, url).href;
                return request(next, redirects + 1).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode} pri ${url}`));
            }
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}

const isPdf = buf => buf.subarray(0, 4).toString() === "%PDF";

async function fetchMenuPdf() {
    console.log("📥 Sťahujem menu z:", MENU_URL);
    const buffer = await request(MENU_URL);
    if (isPdf(buffer)) return buffer;

    // Záloha: ak by sme dostali HTML stránku, skúsime v nej nájsť odkaz na denne-menu-XX
    const html = buffer.toString("utf8");
    const match = html.match(/["'](\/podnik\/4m-restaurant\/denne-menu-[^"']+)["']/);
    if (!match) throw new Error("Odpoveď nie je PDF a v HTML som nenašiel odkaz na menu.");

    const fallbackUrl = "https://superobed.sk" + match[1].replace(/&amp;/g, "&");
    console.log("🔗 Záložný odkaz:", fallbackUrl);
    const pdf = await request(fallbackUrl);
    if (!isPdf(pdf)) throw new Error("Ani záložný odkaz nevrátil PDF.");
    return pdf;
}

// ---------- Dátumy ----------

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

// Ktorý pondelok očakávame: Pi/So/Ne -> budúci týždeň, Po–Št -> tento týždeň
function getExpectedMonday(now) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    const day = d.getDay(); // 0 = nedeľa ... 6 = sobota
    const addDays = day === 5 ? 3 : day === 6 ? 2 : day === 0 ? 1 : 1 - day;
    d.setDate(d.getDate() + addDays);
    return d;
}

// Z hlavičky PDF ("28.09.-02.10.") zistí, pre ktorý týždeň menu platí
function getMenuMonday(text, now = new Date()) {
    const m = text.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*[-–]\s*(\d{1,2})\.\s*(\d{1,2})\./);
    if (!m) throw new Error("V PDF som nenašiel dátum týždňa (napr. 28.09.-02.10.).");

    const day = Number(m[1]);
    const month = Number(m[2]);

    // Rok nie je v PDF – vyberieme ten, pri ktorom je dátum najbližšie k dnešku
    let best = null;
    for (const year of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
        const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
        if (!best || Math.abs(candidate - now) < Math.abs(best - now)) best = candidate;
    }
    return getMonday(best);
}

// ---------- Parsovanie ----------

// Odstráni alergény "(1,3,7)" a cenu "6.90€" (gramáž ako "(160gr)" ostáva)
function cleanItem(text) {
    if (!text) return text;

    let t = text
        .replace(/\s*\(\s*\d+(?:\s*,\s*\d+)*\s*\)/g, "")   // alergény
        .replace(/\s*\d+(?:[.,]\d{1,2})?\s*€/g, "")         // cena
        .replace(/\s+,/g, ",")
        .replace(/\s{2,}/g, " ")
        .trim();

    // V PDF býva nezatvorená zátvorka (napr. pri POKE) – doplníme ju
    const open = (t.match(/\(/g) || []).length;
    const close = (t.match(/\)/g) || []).length;
    if (open > close) t += ")".repeat(open - close);

    return t;
}

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
        parsed[day] = { soup: [], menu1: null, menu2: null, menu3: null, menu4: null, menu5: null, menu6: null };
    });

    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let currentDay = null;
    let capturingSoup = false;

    lines.forEach(line => {
        const upperLine = line.toUpperCase();

        let foundDay = false;
        for (const [key, val] of Object.entries(daysMap)) {
            if (upperLine.startsWith(key)) {
                currentDay = val;
                foundDay = true;
                capturingSoup = true;

                const parts = line.split(":");
                if (parts.length > 1 && parts[1].trim()) {
                    parsed[currentDay].soup.push(parts[1].trim());
                }
                break;
            }
        }
        if (foundDay) return;

        if (!currentDay) return;

        if (upperLine.startsWith("MENU")) {
            capturingSoup = false;
        }

        if (capturingSoup && !upperLine.startsWith("MENU")) {
            parsed[currentDay].soup.push(line);
            return;
        }

        if (upperLine.startsWith("MENU 1:")) {
            parsed[currentDay].menu1 = line.replace(/^MENU\s*1:\s*/i, "").trim();
        } else if (upperLine.startsWith("MENU 2:")) {
            parsed[currentDay].menu2 = line.replace(/^MENU\s*2:\s*/i, "").trim();
        } else if (upperLine.startsWith("MENU 3:")) {
            parsed[currentDay].menu3 = line.replace(/^MENU\s*3:\s*/i, "").trim();
        } else if (upperLine.startsWith("MENU 4:")) {
            parsed[currentDay].menu4 = line.replace(/^MENU\s*4:\s*/i, "").trim();
        } else {
            if (parsed[currentDay].menu4 && !parsed[currentDay].menu4.endsWith("€")) {
                parsed[currentDay].menu4 += " " + line;
            } else if (parsed[currentDay].menu3 && !parsed[currentDay].menu3.endsWith("€")) {
                parsed[currentDay].menu3 += " " + line;
            } else if (parsed[currentDay].menu2 && !parsed[currentDay].menu2.endsWith("€")) {
                parsed[currentDay].menu2 += " " + line;
            } else if (parsed[currentDay].menu1 && !parsed[currentDay].menu1.endsWith("€")) {
                parsed[currentDay].menu1 += " " + line;
            }
        }
    });

    Object.keys(parsed).forEach(day => {
        parsed[day].soup = cleanItem(parsed[day].soup.join(", "));
        ["menu1", "menu2", "menu3", "menu4"].forEach(key => {
            parsed[day][key] = cleanItem(parsed[day][key]);
        });
    });

    console.log("📊 Výsledok parsovania:", JSON.stringify(parsed, null, 2));
    return parsed;
}

// ---------- Supabase ----------

function supabaseHeaders(extra = {}) {
    const headers = { "apikey": SUPABASE_KEY, ...extra };
    // Nové kľúče (sb_secret_...) nie sú JWT a posielajú sa iba v hlavičke apikey.
    // Starý service_role kľúč (JWT, začína "eyJ") posielame aj ako Bearer.
    if (SUPABASE_KEY.startsWith("eyJ")) {
        headers["Authorization"] = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
}

// Je už menu na daný týždeň (všetkých 5 dní) v databáze?
async function isAlreadyLoaded(weekFrom) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/weekly_menu?week_from=eq.${weekFrom}&select=id`,
            { headers: supabaseHeaders() }
        );
        if (!response.ok) return false;
        const rows = await response.json();
        return Array.isArray(rows) && rows.length >= 5;
    } catch {
        return false;
    }
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

    const headers = supabaseHeaders({
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    });

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/weekly_menu?on_conflict=week_from,day_of_week`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(rows)
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase uloženie zlyhalo: ${response.status} ${errorText}`);
    }

    console.log("✅ Menu na týždeň od", formatDate(monday), "bolo uložené do Supabase!");
}

// ---------- Hlavný beh ----------

async function main() {
    const now = new Date();
    const expected = formatDate(getExpectedMonday(now));
    const force = process.env.FORCE === "true"; // ručné spustenie prepíše dáta

    // Menu na očakávaný týždeň už máme -> hotovo, nič ďalšie sa nesťahuje
    if (!force && await isAlreadyLoaded(expected)) {
        console.log(`✅ Menu na týždeň od ${expected} už je v databáze. Hotovo.`);
        return;
    }

    let buffer;
    try {
        buffer = await fetchMenuPdf();
    } catch (error) {
        console.log(`⏳ Menu sa zatiaľ nepodarilo stiahnuť (${error.message}). Skúsim to o hodinu.`);
        return;
    }

    const pdfData = await pdfParse(buffer);
    console.log("📖 PDF prečítané (dĺžka: " + pdfData.text.length + " znakov)");

    const menuMonday = getMenuMonday(pdfData.text, now);

    if (formatDate(menuMonday) !== expected) {
        console.log(
            `⏳ Na stránke je menu na týždeň od ${formatDate(menuMonday)}, ` +
            `čakám na týždeň od ${expected}. Skúsim to o hodinu.`
        );
        return;
    }

    const parsedMenu = parseRealMenu(pdfData.text);
    await saveMenuToSupabase(parsedMenu, menuMonday);
}

if (require.main === module) {
    main().catch(error => {
        console.error("❌ Chyba:", error);
        process.exit(1);
    });
}

module.exports = { main, getExpectedMonday, getMenuMonday, parseRealMenu, formatDate };
