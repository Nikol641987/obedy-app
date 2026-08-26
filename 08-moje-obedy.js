// 14. MOJE OBEDY
// =====================================

async function loadMyOrders(employeeId) {
    const container = document.getElementById("myOrdersContainer");

    if (!container || !employeeId) {
        return;
    }

    container.innerHTML = "<p>Načítavam objednávky...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("meal_orders")
            .select(`
                id,
                order_date,
                menu_id,
                menu_name,
                menu_choice,
                dining,
                takeaway,
                no_soup,
                issued
            `)
            .eq("employee_id", employeeId)
            .order("order_date", { ascending: false });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            container.innerHTML = "<p>Zatiaľ nemáš žiadne objednávky.</p>";
            return;
        }

        const groupedByDate = {};

        data.forEach(item => {
            if (!groupedByDate[item.order_date]) {
                groupedByDate[item.order_date] = [];
            }
            groupedByDate[item.order_date].push(item);
        });

        container.innerHTML = "";

        Object.entries(groupedByDate).forEach(([date, items]) => {
            const card = document.createElement("article");
            card.className = "menu-card";

            const formattedDate = formatOrderDate(date);

            const itemsHtml = items
                .map(item => {
                    const methods = [];

                    if (item.dining) {
                        methods.push("🍽️ V jedálni");
                    }

                    if (item.takeaway) {
                        methods.push("📦 Zabaliť");
                    }

                    const soupText = item.no_soup ? " · bez polievky" : "";
                    const statusHtml = item.issued
                        ? '<span class="my-order-status issued">Vydané</span>'
                        : '<span class="my-order-status waiting">Čaká</span>';

                    // Úprava názvu: ak existuje konkrétny výber syra a v názve je "alebo", nahradíme ho
                    let displayMealName = item.menu_name || "";

if (item.menu_choice && displayMealName.toLowerCase().includes(" alebo ")) {
    // Nahradí celý blok "Syr alebo Camembert (brusnice)" za vybranú možnosť
    displayMealName = displayMealName.replace(/^.*?vyprážaný syr alebo grilovaný camembert \(brusnice\)/i, item.menu_choice);
}

                    return `
                        <div class="my-order-item">
                            <div class="my-order-top-row">
                                <span class="my-order-method">
                                    ${escapeHtml(methods.join(" + "))}
                                    ${escapeHtml(soupText)}
                                </span>
                                ${statusHtml}
                            </div>
                            <div class="my-order-meal-name">
                                ${escapeHtml(displayMealName)}
                            </div>
                        </div>
                    `;
                })
                .join("");

            card.innerHTML = `
                <div class="menu-card-header">
                    <span class="menu-number">
                        ${escapeHtml(formattedDate)}
                    </span>
                </div>
                ${itemsHtml}
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Chyba pri načítaní objednávok:", error);
        container.innerHTML = "<p>Objednávky sa nepodarilo načítať.</p>";
    }
}
