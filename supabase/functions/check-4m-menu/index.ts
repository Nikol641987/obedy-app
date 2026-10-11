import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import pdf from "npm:pdf-parse@1.1.1";

const PAGE_URL = "https://superobed.sk/podnik/4m-restaurant/";
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getExpectedMonday(now = new Date()): Date {
    const date = new Date(now);
    const day = date.getDay();
    const daysToMonday = day >= 5 ? 8 - day : 1 - day;
    date.setUTCDate(date.getUTCDate() + daysToMonday);
    date.setUTCHours(12, 0, 0, 0);
    return date;
}

function getMenuMonday(text: string, now = new Date()): Date {
    const match = text.match(
        /(\d{1,2})\.\s*(\d{1,2})\.\s*[-–]\s*(\d{1,2})\.\s*(\d{1,2})\./
    );

    if (!match) {
        throw new Error("V menu sa nenašiel dátum týždňa.");
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const candidates = [-1, 0, 1].map(offset =>
        new Date(Date.UTC(now.getUTCFullYear() + offset, month - 1, day, 12))
    );

    const closest = candidates.reduce((result, candidate) =>
        Math.abs(candidate.getTime() - now.getTime())
            < Math.abs(result.getTime() - now.getTime())
            ? candidate
            : result
    );

    const weekDay = closest.getUTCDay();
    closest.setUTCDate(
        closest.getUTCDate() + (weekDay === 0 ? -6 : 1 - weekDay)
    );
    return closest;
}

function cleanItem(value: string | null | undefined): string {
    if (!value) return "";

    let result = value
        .replace(/\s*\(\s*\d+(?:\s*,\s*\d+)*\s*\)/g, "")
        .replace(/\s*\d+(?:[.,]\d{1,2})?\s*€/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    const open = (result.match(/\(/g) || []).length;
    const close = (result.match(/\)/g) || []).length;
    if (open > close) result += ")".repeat(open - close);
    return result;
}

function parseMenu(text: string) {
    const days = {
        PONDELOK: "pondelok",
        UTOROK: "utorok",
        STREDA: "streda",
        ŠTVRTOK: "stvrtok",
        PIATOK: "piatok"
    } as const;
    const result: Record<string, Record<string, string | null>> = {};

    Object.values(days).forEach(day => {
        result[day] = {
            soup: "",
            menu1: null,
            menu2: null,
            menu3: null,
            menu4: null,
            menu5: null,
            menu6: null
        };
    });

    let currentDay: string | null = null;
    let readingSoup = false;
    const lines = text
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        const upper = line.toLocaleUpperCase("sk-SK");
        const dayName = Object.keys(days).find(day =>
            upper.startsWith(day)
        );

        if (dayName) {
            currentDay = days[dayName as keyof typeof days];
            readingSoup = true;
            const soup = line.split(":").slice(1).join(":").trim();
            if (soup) result[currentDay].soup += `${soup} `;
            continue;
        }

        if (!currentDay) continue;
        if (/^MENU\s*[1-6]\s*:/i.test(line)) {
            readingSoup = false;
            const match = line.match(/^MENU\s*([1-6])\s*:\s*(.*)$/i);
            if (match) result[currentDay][`menu${match[1]}`] = match[2];
            continue;
        }

        if (readingSoup) {
            result[currentDay].soup += `${line} `;
        } else {
            const menuKeys = ["menu4", "menu3", "menu2", "menu1"];
            const key = menuKeys.find(menuKey =>
                result[currentDay][menuKey] &&
                !String(result[currentDay][menuKey]).endsWith("€")
            );
            if (key) result[currentDay][key] += ` ${line}`;
        }
    }

    for (const day of Object.values(days)) {
        for (const key of Object.keys(result[day])) {
            result[day][key] = cleanItem(result[day][key]);
        }
    }

    return result;
}

function toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 32768) {
        binary += String.fromCharCode(
            ...bytes.subarray(index, index + 32768)
        );
    }
    return btoa(binary);
}

async function fetchMenuFile() {
    const pageResponse = await fetch(PAGE_URL, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 TMV-Obedy-Menu-Checker/1.0" }
    });
    if (!pageResponse.ok) {
        throw new Error(`SuperObed vrátil stav ${pageResponse.status}.`);
    }

    const html = await pageResponse.text();
    const matches = [
        ...html.matchAll(/href=["']([^"']+\.(?:pdf|png|jpg|jpeg)(?:\?[^"']*)?)["']/gi),
        ...html.matchAll(/src=["']([^"']+\.(?:pdf|png|jpg|jpeg)(?:\?[^"']*)?)["']/gi)
    ];
    const candidateUrls = [
        new URL("denne-menu", PAGE_URL).href,
        ...matches
            .map(match => new URL(match[1], PAGE_URL).href)
            .filter(url => !/(logo|icon|favicon|assets\/images\/logo|gallery)/i.test(url))
    ];

    if (!candidateUrls.length) {
        throw new Error("Na stránke sa nenašiel súbor s menu.");
    }

    for (const fileUrl of candidateUrls) {
        const fileResponse = await fetch(fileUrl, {
            redirect: "follow",
            headers: { "User-Agent": "Mozilla/5.0 TMV-Obedy-Menu-Checker/1.0" }
        });
        if (!fileResponse.ok) continue;

        const contentType = fileResponse.headers.get("content-type") || "";
        const isPdf = contentType.includes("pdf");
        const isImage = contentType.startsWith("image/");
        if (!isPdf && !isImage) continue;

        return {
            buffer: await fileResponse.arrayBuffer(),
            contentType,
            finalUrl: fileResponse.url,
            isPdf
        };
    }

    throw new Error("Na stránke sa nenašiel použiteľný PDF ani obrázok menu.");
}

async function saveMenu(text: string, monday: Date): Promise<void> {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const dayKeys = ["pondelok", "utorok", "streda", "stvrtok", "piatok"];
    const rows = dayKeys.map((day, index) => {
        const date = new Date(monday);
        date.setUTCDate(date.getUTCDate() + index);
        const menu = parseMenu(text)[day];
        return {
            week_from: formatDate(monday),
            menu_date: formatDate(date),
            day_of_week: index + 1,
            soup: menu.soup || null,
            menu1: menu.menu1 || null,
            menu2: menu.menu2 || null,
            menu3: menu.menu3 || null,
            menu4: menu.menu4 || null,
            menu5: menu.menu5 || null,
            menu6: menu.menu6 || null
        };
    });

    const { error } = await supabase
        .from("weekly_menu")
        .upsert(rows, { onConflict: "week_from,day_of_week" });
    if (error) throw error;
}

Deno.serve(async request => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const {
            buffer,
            contentType,
            finalUrl,
            isPdf
        } = await fetchMenuFile();
        if (!isPdf) {
            return Response.json({
                success: true,
                menuAvailable: true,
                imported: false,
                contentType,
                finalUrl,
                fileBase64: toBase64(buffer)
            }, { headers: corsHeaders });
        }

        const parsedPdf = await pdf(new Uint8Array(buffer));
        const monday = getMenuMonday(parsedPdf.text);
        const expectedMonday = getExpectedMonday();

        if (formatDate(monday) !== formatDate(expectedMonday)) {
            return Response.json({
                success: true,
                menuAvailable: false,
                reason: `Na stránke je menu od ${formatDate(monday)}, čaká sa na ${formatDate(expectedMonday)}.`
            }, { headers: corsHeaders });
        }

        await saveMenu(parsedPdf.text, monday);

        return Response.json({
            success: true,
            menuAvailable: true,
            imported: true,
            weekFrom: formatDate(monday),
            contentType,
            finalUrl,
            fileBase64: toBase64(buffer)
        }, { headers: corsHeaders });
    } catch (error) {
        console.error("Automatický import menu zlyhal:", error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500, headers: corsHeaders });
    }
});
