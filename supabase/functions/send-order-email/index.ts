import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getCurrentTimeBratislava() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Bratislava",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "short"
    });
    
    const parts = formatter.formatToParts(now);
    const values: Record<string, string> = {};
    parts.forEach(p => { values[p.type] = p.value; });

    return {
        year: parseInt(values.year, 10),
        month: parseInt(values.month, 10),
        day: parseInt(values.day, 10),
        weekday: values.weekday,
        hour: parseInt(values.hour, 10),
        minute: parseInt(values.minute, 10)
    };
}

function getTodayBratislava() {
    const timeInfo = getCurrentTimeBratislava();
    const m = String(timeInfo.month).padStart(2, '0');
    const d = String(timeInfo.day).padStart(2, '0');
    return `${timeInfo.year}-${m}-${d}`;
}

function getEasterMonday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const L = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * L) / 451);
    const month = Math.floor((h + L - 7 * m + 114) / 31);
    const day = ((h + L - 7 * m + 114) % 31) + 1;
    
    const easterSunday = new Date(year, month - 1, day);
    const easterMonday = new Date(easterSunday);
    easterMonday.setDate(easterSunday.getDate() + 1);
    return easterMonday;
}

function isWorkdayAndNotHoliday() {
    const timeInfo = getCurrentTimeBratislava();
    if (['Sat', 'Sun'].includes(timeInfo.weekday)) return false;

    const fixedHolidays = [
        "1-1", "1-6", "5-1", "5-8", "7-5", "8-29", 
        "9-1", "9-15", "11-1", "11-17", "12-24", "12-25", "12-26"
    ];

    if (fixedHolidays.includes(`${timeInfo.month}-${timeInfo.day}`)) return false;

    const easterMonday = getEasterMonday(timeInfo.year);
    const goodFriday = new Date(easterMonday);
    goodFriday.setDate(easterMonday.getDate() - 3);

    const isGoodFriday = timeInfo.month === (goodFriday.getMonth() + 1) && timeInfo.day === goodFriday.getDate();
    const isEasterMonday = timeInfo.month === (easterMonday.getMonth() + 1) && timeInfo.day === easterMonday.getDate();

    if (isGoodFriday || isEasterMonday) return false;

    return true;
}

async function getExactSoupForToday(supabase: any, orderDate: string) {
    const { data, error } = await supabase
        .from("weekly_menu")
        .select("soup, menu_date")
        .eq("menu_date", orderDate)
        .maybeSingle();

    if (error) return `[CHYBA DB: ${error.message}]`;
    if (!data) return `[NENÁJDENÉ pre '${orderDate}']`;
    return data.soup || "[Polievka je prázdna]";
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    let orderDate = getTodayBratislava();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = (supabaseUrl && serviceRoleKey) ? createClient(supabaseUrl, serviceRoleKey) : null;

    try {
        let payload: any = {};
        try {
            payload = await req.json();
        } catch {
            payload = {};
        }

        const { email, test } = payload;

        if (!supabase) throw new Error("Chýba Supabase serverové nastavenie.");

        const { data: settingsData, error: settingsError } = await supabase
            .from("order_email_settings")
            .select("restaurant_email, enabled, send_time")
            .eq("enabled", true)
            .limit(1)
            .maybeSingle();

        if (settingsError || !settingsData) {
            throw new Error("Nepodarilo sa načítať nastavenia z tabuľky order_email_settings.");
        }

        if (!test) {
            if (!isWorkdayAndNotHoliday()) {
                return new Response(JSON.stringify({ skipped: true, reason: "Holiday, weekend or not a workday" }), { 
                    status: 200, 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }

            const configuredTime = settingsData.send_time || "07:30"; 
            const [targetHourStr, targetMinuteStr] = configuredTime.split(":");
            const targetHour = parseInt(targetHourStr, 10);
            const targetMinute = parseInt(targetMinuteStr, 10);

            const currentTime = getCurrentTimeBratislava();

            if (currentTime.hour !== targetHour || currentTime.minute !== targetMinute) {
                return new Response(JSON.stringify({ 
                    skipped: true, 
                    reason: `Current time does not match configured time (${configuredTime})` 
                }), { 
                    status: 200, 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
        }

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) throw new Error("RESEND_API_KEY nie je nastavený.");

        const soupName = await getExactSoupForToday(supabase, orderDate);

        const { data: orders, error: ordersError } = await supabase
            .from("meal_orders")
            .select("employee_id, menu_id, menu_name, menu_choice, soup_choice, note, dining, takeaway, no_soup, quantity")
            .eq("order_date", orderDate);

        if (ordersError) throw ordersError;

        const allOrders = orders || [];
        const diningMap: Record<string, any> = {};
        const takeawayMap: Record<string, any> = {};
        const soupChoiceMap: Record<string, number> = {};
        const soupCountedEmployees = new Set<string>();
        let diningOrders = 0, takeawayOrders = 0, noSoupOrders = 0;

        // Rozloží uložený reťazec typu "Polievka A x2 + Polievka B x1" na
        // jednotlivé polievky s počtom kusov (staršie dáta bez "xN" berie ako 1 ks).
        function parseSoupChoiceString(value: string): { name: string; qty: number }[] {
            return String(value || "")
                .split(" + ")
                .map(part => part.trim())
                .filter(Boolean)
                .map(part => {
                    const match = part.match(/^(.*)\sx(\d+)$/);
                    if (match) {
                        return { name: match[1].trim(), qty: Number(match[2]) || 1 };
                    }
                    return { name: part, qty: 1 };
                });
        }

        allOrders.forEach(order => {
            const menuId = Number(order.menu_id);
            const menuName = order.menu_name || "";
            const menuChoice = order.menu_choice || "";
            const note = (order.note || "").trim();
            const key = `${menuId}_${menuChoice}_${note}`;
            // Počet kusov objednaných v tomto riadku (predvolene 1, ak chýba).
            const quantity = Number(order.quantity) || 1;

            if (order.takeaway) {
                takeawayOrders += quantity;
                if (!takeawayMap[key]) {
                    takeawayMap[key] = { menu_id: menuId, menu_name: menuName, menu_choice: menuChoice, note: note, count: 0 };
                }
                takeawayMap[key].count += quantity;
            } else {
                diningOrders += quantity;
                if (!diningMap[key]) {
                    diningMap[key] = { menu_id: menuId, menu_name: menuName, menu_choice: menuChoice, note: note, count: 0 };
                }
                diningMap[key].count += quantity;
            }

            if (order.no_soup) noSoupOrders += quantity;

            // Polievka je rovnaká pre celú dennú objednávku zamestnanca (je
            // uložená na každom jeho riadku rovnako), preto ju spočítame
            // len raz na zamestnanca, nie za každý riadok zvlášť.
            if (order.soup_choice && !soupCountedEmployees.has(order.employee_id)) {
                soupCountedEmployees.add(order.employee_id);
                parseSoupChoiceString(order.soup_choice).forEach(({ name, qty }) => {
                    soupChoiceMap[name] = (soupChoiceMap[name] || 0) + qty;
                });
            }
        });

        const totalPortions = diningOrders + takeawayOrders;

        const diningSummary = Object.values(diningMap).sort((a: any, b: any) => {
            if (a.menu_id !== b.menu_id) return a.menu_id - b.menu_id;
            return String(a.menu_choice || "").localeCompare(String(b.menu_choice || ""), "sk");
        });

        const takeawaySummary = Object.values(takeawayMap).sort((a: any, b: any) => {
            if (a.menu_id !== b.menu_id) return a.menu_id - b.menu_id;
            return String(a.menu_choice || "").localeCompare(String(b.menu_choice || ""), "sk");
        });

        const formattedDate = new Date(orderDate + "T12:00:00").toLocaleDateString("sk-SK", { 
            timeZone: "Europe/Bratislava", weekday: "long", day: "numeric", month: "numeric", year: "numeric" 
        });

        const diningRows = diningSummary.length > 0 ? diningSummary.map((item: any) => {
            const menuLabel = item.menu_id === 6 ? "⭐ Menu 6" : `Menu ${item.menu_id}`;
            const displayName = item.menu_choice ? item.menu_name.replace(/^[^,]+/, item.menu_choice) : item.menu_name;
            const noteHtml = item.note ? `<div style="font-size: 0.9rem; color: #b91c1c; font-weight: bold; margin-top: 4px;">⚠️ Poznámka: ${item.note}</div>` : "";

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #dddddd;">
                        <strong>${menuLabel}</strong><br>${displayName}
                        ${noteHtml}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #dddddd; text-align: right; font-weight: bold; vertical-align: top;">${item.count} ks</td>
                </tr>`;
        }).join("") : `<tr><td colspan="2" style="padding: 10px; color: #666; font-style: italic;">Žiadne objednávky v jedálni</td></tr>`;

        const takeawayRows = takeawaySummary.length > 0 ? takeawaySummary.map((item: any) => {
            const menuLabel = item.menu_id === 6 ? "⭐ Menu 6" : `Menu ${item.menu_id}`;
            const displayName = item.menu_choice ? item.menu_name.replace(/^[^,]+/, item.menu_choice) : item.menu_name;
            const noteHtml = item.note ? `<div style="font-size: 0.9rem; color: #b91c1c; font-weight: bold; margin-top: 4px;">⚠️ Poznámka: ${item.note}</div>` : "";

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #dddddd;">
                        <strong>${menuLabel}</strong><br>${displayName}
                        ${noteHtml}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #dddddd; text-align: right; font-weight: bold; vertical-align: top;">${item.count} ks</td>
                </tr>`;
        }).join("") : `<tr><td colspan="2" style="padding: 10px; color: #666; font-style: italic;">Žiadne objednávky na zabalenie</td></tr>`;

        let soupHtml = `<p><strong>Polievka:</strong> ${soupName}</p>`;
        if (Object.keys(soupChoiceMap).length > 0) {
            const soupListText = Object.entries(soupChoiceMap)
                .map(([soup, count]) => `• ${soup}: <strong>${count} ks</strong>`)
                .join("<br>");
            soupHtml = `<p><strong>Výber polievok:</strong><br>${soupListText}</p>`;
        }

        const rawEmail = settingsData.restaurant_email || "";
        const recipients = rawEmail.split(",").map((e: string) => e.trim()).filter(Boolean);

        if (recipients.length === 0) {
            throw new Error("V tabuľke order_email_settings nie je nastavená žiadna platná e-mailová adresa reštaurácie.");
        }

        // 1. Najskôr uložíme záznam do databázy a získame jeho ID
        const { data: insertedRecord, error: insertError } = await supabase
            .from("order_email_history")
            .insert({
                order_date: orderDate,
                restaurant_email: recipients.join(", "),
                total_orders: totalPortions,
                dining_orders: diningOrders,
                takeaway_orders: takeawayOrders,
                order_summary: { soup: soupName, total: totalPortions },
                status: test ? "test_sent" : "sent",
                error_message: null
            })
            .select("id")
            .single();

        if (insertError) throw insertError;
        const recordId = insertedRecord.id;

        // 2. Vytvoríme unikátny odkaz s ID
        const confirmUrl = `${supabaseUrl}/functions/v1/confirm-order?date=${orderDate}&id=${recordId}`;

        // 3. Vygenerujeme HTML šablónu pre e-mail
        const html = `
            <h2>Objednávka obedov Trenčianske minerálne vody</h2>
            <p><strong>Dátum:</strong> ${formattedDate}</p>
            ${soupHtml}
            <p><strong>Počet Menu:</strong> ${totalPortions} ks</p>

            <h3 style="margin-top: 20px; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">🍽️ V jedálni (pripraviť do varníc)</h3>
            <table style="border-collapse: collapse; width: 100%; max-width: 700px; margin-top: 10px;">${diningRows}</table>

            <h3 style="margin-top: 30px; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">📦 Zabaliť do krabičky</h3>
            <table style="border-collapse: collapse; width: 100%; max-width: 700px; margin-top: 10px;">${takeawayRows}</table>

            <div style="margin-top: 30px; padding-top: 15px; border-top: 2px dashed #94a3b8;">
                <p>🍽️ Celkom v jedálni (do varníc): <strong>${diningOrders} ks</strong></p>
                <p>📦 Celkom zabaliť: <strong>${takeawayOrders} ks</strong></p>
                <p>🥣 Celkom bez polievky: <strong>${noSoupOrders} ks</strong></p>
            </div>

            <!-- Tlačidlo pre reštauráciu -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${confirmUrl}" 
                   style="background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; font-size: 18px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ✅ Potvrdiť prijatie objednávok
                </a>
            </div>
        `;

        // 4. Odošleme e-mail cez Resend
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                from: "Obedy Trenčianske minerálne vody <noreply@miticka.sk>",
                to: recipients,
                subject: `Objednávka obedov Trenčianske minerálne vody – ${formattedDate}`,
                html
            })
        });

        const resendData = await resendResponse.json();
        if (!resendResponse.ok) throw new Error(resendData?.message || "E-mail sa nepodarilo odoslať.");

        return new Response(JSON.stringify({ success: true, sentTo: recipients, id: resendData.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
