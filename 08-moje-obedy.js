// =====================================
// 14. MOJE OBEDY
// =====================================

let allMyOrders = []; // Globálna premenná na uloženie všetkých stiahnutých obedov

function openMyOrdersScreen(employeeId) {
    showScreen("myOrdersScreen");
    loadMyOrders(employeeId);
}

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
            // Vynulujeme aj počítadlo a filter ak nič nie je
            document.getElementById("orderCountNumber").textContent = "0";
            const monthFilter = document.getElementById("monthFilter");
            if (monthFilter) monthFilter.innerHTML = `<option value="">Žiadne mesiace</option>`;
            return;
        }

        // Uloženie dát do globálnej premennej
        allMyOrders = data;

        // Naplnenie výberu mesiacov a spustenie filtrovania/vykreslenia
        setupMonthFilterOptions(allMyOrders);
        renderFilteredOrders();

    } catch (error) {
        console.error("Chyba pri načítaní objednávok:", error);
        container.innerHTML = "<p>Objednávky sa nepodarilo načítať.</p>";
    }
}

// Funkcia na vytvorenie možností mesiacov v selecte
function setupMonthFilterOptions(orders) {
    const monthFilter = document.getElementById("monthFilter");
    if (!monthFilter) return;

    const monthsSet = new Set();
    orders.forEach(order => {
        if (order.order_date) {
            const yearMonth = order.order_date.substring(0, 7); // "YYYY-MM"
            monthsSet.add(yearMonth);
        }
    });

    const sortedMonths = Array.from(monthsSet).sort().reverse();
    monthFilter.innerHTML = "";
    
    sortedMonths.forEach(ym => {
        const [year, month] = ym.split("-");
        const dateObj = new Date(year, month - 1, 1);
        const monthName = dateObj.toLocaleString('sk-SK', { month: 'long', year: 'numeric' });
        const formattedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        const option = document.createElement("option");
        option.value = ym;
        option.textContent = formattedName;
        monthFilter.appendChild(option);
    });

    // Pridáme poslucháč na zmenu mesiaca (odstránime starý, ak existoval, aby sa neduplikovali udalosti)
    monthFilter.onchange = renderFilteredOrders;
}

// Funkcia na vykreslenie obedov podľa zvoleného mesiaca a aktualizáciu počítadla
function renderFilteredOrders() {
    const monthFilter = document.getElementById("monthFilter");
    const container = document.getElementById("myOrdersContainer");
    const countNumber = document.getElementById("orderCountNumber");
    
    if (!monthFilter || !container) return;

    const selectedYM = monthFilter.value;
    
    // Filtrovanie obedov podľa vybraného mesiaca (YYYY-MM)
    const filtered = allMyOrders.filter(order => order.order_date && order.order_date.startsWith(selectedYM));

    // Aktualizácia počítadla obedov
    if (countNumber) {
        countNumber.textContent = filtered.length;
    }

    if (filtered.length === 0) {
        container.innerHTML = "<p>V tomto mesiaci nemáš žiadne objednávky.</p>";
        return;
    }

    const groupedByDate = {};

    filtered.forEach(item => {
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

                let displayMealName = item.menu_name || "";

                if (item.menu_choice && displayMealName.toLowerCase().includes(" alebo ")) {
                    const parts = displayMealName.split(",");
                    const rest = parts.slice(1).join(",");
                    displayMealName = item.menu_choice + (rest ? `, ${rest.trim()}` : "");
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
}
