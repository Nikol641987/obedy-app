// =====================================
// 7. VÝBER DŇA OBJEDNÁVKY
// =====================================

async function openWeekSelectionScreen(employeeId) {
    sessionStorage.setItem("loggedEmployee", employeeId);

    const weekCards = document.getElementById("weekCards");
    const weekTitle = document.getElementById("weekTitle");

    if (!weekCards || !weekTitle) return;

    const now = new Date();
    const currentDay = now.getDay();
    const isFridayAfterNoon = currentDay === 5 && now.getHours() >= 12;

    const monday = new Date(now);
    const daysFromMonday = currentDay === 0 ? -6 : 1 - currentDay;

    monday.setDate(now.getDate() + daysFromMonday + (isFridayAfterNoon ? 7 : 0));
    monday.setHours(7, 30, 0, 0); // Opravené: 07 -> 7

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const mondayForDatabase = formatDateForDatabase(monday);
    const fridayForDatabase = formatDateForDatabase(friday);

    weekTitle.textContent = `Týždeň ${formatShortDate(monday)} – ${formatShortDate(friday)}`;
    weekCards.innerHTML = `<div class="week-loading">Načítavam objednávky...</div>`;

    showScreen("weekSelectionScreen");

    let weeklyOrders = [];
    let weeklyMenus = [];

    try {
        const { data, error } = await supabaseClient
            .from("weekly_menu")
            .select("menu_date, soup")
            .gte("menu_date", mondayForDatabase)
            .lte("menu_date", fridayForDatabase);

        if (error) throw error;
        weeklyMenus = data || [];
    } catch (error) {
        console.error("Chyba pri načítaní polievok:", error);
    }

    try {
        const { data, error } = await supabaseClient
            .from("meal_orders")
            .select("order_date, menu_id, menu_name, dining, takeaway, no_soup, issued")
            .eq("employee_id", employeeId)
            .gte("order_date", mondayForDatabase)
            .lte("order_date", fridayForDatabase)
            .order("order_date", { ascending: true });

        if (error) throw error;
        weeklyOrders = data || [];
    } catch (error) {
        console.error("Chyba pri načítaní týždenných objednávok:", error);
        weekCards.innerHTML = `<div class="message error">Objednávky sa nepodarilo načítať.</div>`;
        return;
    }

    const ordersByDate = {};
    const soupsByDate = {};

    weeklyMenus.forEach(menu => {
        soupsByDate[menu.menu_date] = menu.soup || "";
    });

    weeklyOrders.forEach(order => {
        if (!ordersByDate[order.order_date]) {
            ordersByDate[order.order_date] = [];
        }
        ordersByDate[order.order_date].push(order);
    });

    const weekdays = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];
    weekCards.innerHTML = "";

    weekdays.forEach((weekday, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);

        const dateForDatabase = formatDateForDatabase(date);
        const dayOrders = ordersByDate[dateForDatabase] || [];
        const daySoup = soupsByDate[dateForDatabase] || "";

        const deadline = new Date(date);
        deadline.setHours(7, 30, 0, 0); // Opravené: 07 -> 7

        const isClosed = new Date() > deadline;

        const card = document.createElement("div");
        card.className = "week-card";
        card.dataset.date = dateForDatabase;

        const heading = document.createElement("h3");
        heading.textContent = weekday;

        const dateElement = document.createElement("div");
        dateElement.className = "date";
        dateElement.textContent = formatShortDate(date);

        card.appendChild(heading);
        card.appendChild(dateElement);

        if (daySoup) {
            const soupElement = document.createElement("div");
            soupElement.className = "week-order-soup";
            soupElement.textContent = `🥣 ${daySoup}`;
            card.appendChild(soupElement);
        }

        if (dayOrders.length === 0) {
            const status = document.createElement("div");
            status.className = isClosed ? "status closed" : "status not-ordered";
            status.textContent = isClosed ? "🔒 Uzavreté" : "⚪ Neobjednané";
            card.appendChild(status);
        } else {
            const orderDetails = document.createElement("div");
            orderDetails.className = "week-order-details";

            dayOrders.forEach(order => {
                const meal = document.createElement("div");
                meal.className = "week-order-meal";
                const menuName = order.menu_name || `Menu ${order.menu_id}`;
                let servingType = order.takeaway ? " 📦 Zabaliť" : (order.dining ? " 🍽️ V jedálni" : "");

                meal.innerHTML = `
                    <div class="week-serving-type">${servingType.trim()}</div>
                    <div class="week-menu-name">${menuName}</div>
                `;
                orderDetails.appendChild(meal);
            });

            if (dayOrders.some(order => Boolean(order.no_soup))) {
                const soup = document.createElement("div");
                soup.className = "week-order-soup";
                soup.textContent = "🥣 Bez polievky";
                orderDetails.appendChild(soup);
            }

            const status = document.createElement("div");
            status.className = isClosed ? "status closed" : "status ordered";
            status.textContent = isClosed ? "🔒 Objednávka uzavretá" : "🟢 Objednané";

            card.appendChild(orderDetails);
            card.appendChild(status);
        }

        card.addEventListener("click", () => {
            selectedOrderDate = dateForDatabase;
            openOrderScreen(employeeId);
        });

        weekCards.appendChild(card);
    });
}

// =====================================
// 8. OTVORENIE OBJEDNÁVKY
// =====================================

async function openOrderScreen(employeeId) {
    const select = document.getElementById("employeeSelect");

    if (select && hasEmployeeOption(select, employeeId)) {
        select.value = employeeId;
    }

    setWelcomeEmployee(employeeId);
    setCurrentDate();
    showScreen("orderScreen");

    await loadMenus();
    await checkTodayOrder(employeeId);
}

// =====================================
// 9. KONTROLA DNEŠNEJ OBJEDNÁVKY
// =====================================

async function checkTodayOrder(employeeId) {
    const today = getOrderDate();
    const orderMessage = document.getElementById("orderMessage");
    const confirmOrderButton = document.getElementById("confirmOrderButton");
    const noSoup = document.getElementById("noSoup");
    const orderIntroText = document.getElementById("orderIntroText");

    if (noSoup) {
        noSoup.checked = false;
        noSoup.disabled = false;
    }

    if (confirmOrderButton) {
        confirmOrderButton.disabled = false;
        confirmOrderButton.textContent = "Potvrdiť objednávku";
        delete confirmOrderButton.dataset.edit;
    }

    if (orderMessage) {
        orderMessage.textContent = "";
        orderMessage.className = "message";
    }

    try {
        const { data, error } = await supabaseClient
            .from("meal_orders")
            .select("menu_id, menu_name, menu_choice, dining, takeaway, no_soup, issued")
            .eq("employee_id", employeeId)
            .eq("order_date", today);

        if (error) throw error;

        const now = new Date();
        const [year, month, day] = today.split("-").map(Number);
        const deadline = new Date(year, month - 1, day, 7, 30, 0); // Bezpečný dátum bez UTC posunu
        const canEdit = now < deadline;

        if (!data || data.length === 0) {
            if (orderIntroText) {
                orderIntroText.textContent = canEdit
                    ? "🍽️ Na tento deň ešte nemáš objednaný obed. Objednať si ho môžeš do 7:30."
                    : "🔒 Na tento deň nemáš objednaný obed. Objednávky sú už uzavreté.";
                orderIntroText.style.color = canEdit ? "#d97706" : "#b42318";
                orderIntroText.style.fontWeight = "700";
                orderIntroText.style.fontSize = "1.05rem";
            }

            if (!canEdit) {
                document.querySelectorAll(".meal-choice").forEach(choice => choice.disabled = true);
                if (noSoup) noSoup.disabled = true;
                if (confirmOrderButton) {
                    confirmOrderButton.disabled = true;
                    confirmOrderButton.textContent = "Objednávky sú uzavreté";
                }
            }
            return;
        }

        if (orderIntroText) {
            orderIntroText.textContent = canEdit
                ? "✅ Obed je úspešne objednaný. Do 7:30 môžeš objednávku ešte upraviť."
                : "🔒 Objednávka je uzavretá. Tento obed už nie je možné upraviť.";
            orderIntroText.style.color = canEdit ? "#16803c" : "#2563eb";
            orderIntroText.style.fontWeight = "700";
            orderIntroText.style.fontSize = "1.05rem";
        }

        data.forEach(item => {
            const diningChoice = document.querySelector(`.meal-choice[data-menu-id="${item.menu_id}"][data-option="dining"]`);
            const takeawayChoice = document.querySelector(`.meal-choice[data-menu-id="${item.menu_id}"][data-option="takeaway"]`);
            const menuChoice = document.querySelector(`.menu-choice[data-menu-id="${item.menu_id}"][value="${item.menu_choice}"]`);

            if (menuChoice) menuChoice.checked = true;
            if (diningChoice) diningChoice.checked = Boolean(item.dining);
            if (takeawayChoice) takeawayChoice.checked = Boolean(item.takeaway);
        });

        if (noSoup) {
            noSoup.checked = data.some(item => Boolean(item.no_soup));
        }

        if (confirmOrderButton) {
            if (canEdit) {
                confirmOrderButton.disabled = false;
                confirmOrderButton.textContent = "Uložiť zmeny";
                confirmOrderButton.dataset.edit = "true";
            } else {
                confirmOrderButton.disabled = true;
                confirmOrderButton.textContent = "Objednávky sú uzavreté";
            }
        }

        if (!canEdit) {
            document.querySelectorAll(".meal-choice").forEach(choice => choice.disabled = true);
            if (noSoup) noSoup.disabled = true;
        }

    } catch (error) {
        console.error("Chyba pri kontrole dnešnej objednávky:", error);
        if (orderIntroText) {
            orderIntroText.textContent = "Dnešnú objednávku sa nepodarilo načítať.";
            orderIntroText.style.color = "#b42318";
            orderIntroText.style.fontWeight = "700";
        }
    }
}

// =====================================
// 10. POZDRAV ZAMESTNANCA
// =====================================

function setWelcomeEmployee(employeeId) {
    const select = document.getElementById("employeeSelect");
    const welcomeName = document.getElementById("welcomeName");

    if (!select || !welcomeName) return;

    const option = [...select.options].find(item => item.value === employeeId);
    const firstName = option?.dataset?.name || "";

    welcomeName.textContent = firstName ? `Ahoj, ${firstName}!` : "Ahoj!";
}

// =====================================
// 11. DÁTUM
// =====================================

function setCurrentDate() {
    const currentDate = document.getElementById("currentDate");
    if (!currentDate) return;

    const orderDate = getOrderDate();
    const date = new Date(`${orderDate}T12:00:00`);

    currentDate.textContent = date.toLocaleDateString("sk-SK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// =====================================
// 12. NAČÍTANIE MENU
// =====================================
async function loadMenus() {
    const container = document.getElementById("menuContainer");
    if (!container) return;

    container.innerHTML = "<p>Načítavam menu...</p>";

    try {
        const orderDate = getOrderDate();
        const { data, error } = await supabaseClient
            .from("weekly_menu")
            .select("soup, menu1, menu2, menu3, menu4, menu5, menu6")
            .eq("menu_date", orderDate)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            container.innerHTML = "<p>Pre tento deň zatiaľ nie je uložené menu.</p>";
            return;
        }

        const menus = [
            data.menu1, data.menu2, data.menu3,
            data.menu4, data.menu5, data.menu6
        ]
            .map((name, index) => ({
                id: index + 1,
                name: String(name || "").trim()
            }))
            .filter(menu => menu.name);

        container.innerHTML = "";

        if (data.soup) {
            const soupCard = document.createElement("article");
            soupCard.className = "menu-card soup-card";
            soupCard.innerHTML = `
                <div class="menu-card-header">
                    <span class="menu-number">🥣 Polievka</span>
                </div>
                <h3>${escapeHtml(data.soup)}</h3>
            `;
            container.appendChild(soupCard);
        }

        const employeeId = getCurrentEmployeeId();
        const employeeSelect = document.getElementById("employeeSelect");
        const employeeOption = employeeSelect
            ? [...employeeSelect.options].find(option => option.value === employeeId)
            : null;

        const maxMenuNumber = Number(employeeOption?.dataset?.maxMenuNumber || 5);

        menus.forEach(menu => {
            if (Number(menu.id) > maxMenuNumber) return;

            const card = document.createElement("article");
            card.className = "menu-card";
            card.dataset.menuId = menu.id;

            const hasChoice = menu.name.toLowerCase().includes(" alebo ");

            card.innerHTML = `
                <div class="menu-card-header">
                    <span class="menu-number">
                        ${Number(menu.id) === 6 ? "⭐ Menu 6" : "Menu " + menu.id}
                    </span>
                </div>
                <h3>${escapeHtml(menu.name)}</h3>
                ${
                    hasChoice
                        ? `
                            <div class="menu-choice-box">
                                <strong>Vyberte si:</strong>
                                <label>
                                    <input type="radio" name="menu-choice-${menu.id}" value="Vyprážaný syr" class="menu-choice" data-menu-id="${menu.id}">
                                    Vyprážaný syr
                                </label>
                                <label>
                                    <input type="radio" name="menu-choice-${menu.id}" value="Grilovaný Camembert (brusnice)" class="menu-choice" data-menu-id="${menu.id}">
                                    Grilovaný Camembert (brusnice)
                                </label>
                            </div>
                        `
                        : ""
                }
                <div class="menu-options">
                    <label class="menu-option">
                        <input type="checkbox" class="meal-choice" data-menu-id="${menu.id}" data-option="dining">
                        <span>V jedálni</span>
                    </label>
                    <label class="menu-option">
                        <input type="checkbox" class="meal-choice" data-menu-id="${menu.id}" data-option="takeaway">
                        <span>Zabaliť</span>
                    </label>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Chyba pri načítaní menu:", error);
        container.innerHTML = "<p>Menu sa nepodarilo načítať.</p>";
    }
}
// =====================================
// 13. ULOŽENIE OBJEDNÁVKY
// =====================================

function setupOrderButton() {
    const confirmOrderButton = document.getElementById("confirmOrderButton");
    if (!confirmOrderButton) return;

    confirmOrderButton.addEventListener("click", async () => {
        const orderMessage = document.getElementById("orderMessage");
        const selectedChoices = document.querySelectorAll(".meal-choice:checked");

        if (selectedChoices.length === 0) {
            if (orderMessage) {
                orderMessage.textContent = "Vyberte aspoň jeden obed.";
                orderMessage.className = "message error-message";
            }
            return;
        }

        const employeeId = getCurrentEmployeeId();
        if (!employeeId) {
            if (orderMessage) {
                orderMessage.textContent = "Najprv sa prihláste.";
                orderMessage.className = "message error-message";
            }
            return;
        }

        const employeeSelect = document.getElementById("employeeSelect");
        const selectedEmployee = employeeSelect
            ? [...employeeSelect.options].find(option => option.value === employeeId)
            : null;

        // Opravené: Odstránená duplicita výrazu
        const maxMenuNumber = Number(selectedEmployee?.dataset?.maxMenuNumber || 5);
        const employeeName = selectedEmployee ? selectedEmployee.textContent.trim() : employeeId;
        const noSoup = document.getElementById("noSoup")?.checked || false;
        const orderDate = getOrderDate();

        const hasForbiddenMenu = [...selectedChoices].some(
            choice => Number(choice.dataset.menuId) > maxMenuNumber
        );

        if (hasForbiddenMenu) {
            if (orderMessage) {
                orderMessage.textContent = "Toto menu nemáte povolené objednať.";
                orderMessage.className = "message error-message";
            }
            return;
        }

        const menuCards = document.querySelectorAll(".menu-card");
        for (const menuCard of menuCards) {
            const selectedMeal = menuCard.querySelector(".meal-choice:checked");
            if (!selectedMeal) continue;

            const hasMenuChoice = menuCard.querySelector(".menu-choice");
            if (hasMenuChoice && !menuCard.querySelector(".menu-choice:checked")) {
                if (orderMessage) {
                    orderMessage.textContent = "🧀 Vyberte si, prosím, typ syra.";
                    orderMessage.className = "message error-message";
                }
                return;
            }
        }

        const groupedMenus = {};

        selectedChoices.forEach(choice => {
            const menuId = choice.dataset.menuId;
            const option = choice.dataset.option;
            const menuCard = choice.closest(".menu-card");

            const menuName = menuCard?.querySelector("h3")?.textContent?.trim() || `Menu ${menuId}`;
           const checkedRadio = menuCard ? menuCard.querySelector(`input[name="menu-choice-${menuId}"]:checked`) : null;
const menuChoice = checkedRadio ? checkedRadio.value : null;

            if (!groupedMenus[menuId]) {
                groupedMenus[menuId] = {
                    employee_id: employeeId,
                    employee_name: employeeName,
                    order_date: orderDate,
                    menu_id: String(menuId),
                    menu_name: menuName,
                    menu_choice: menuChoice,
                    dining: false,
                    takeaway: false,
                    no_soup: noSoup,
                    issued: false
                };
            }

            if (option === "dining") groupedMenus[menuId].dining = true;
            if (option === "takeaway") groupedMenus[menuId].takeaway = true;
        });

        const rows = Object.values(groupedMenus);

        confirmOrderButton.disabled = true;
        confirmOrderButton.textContent = "Ukladám objednávku...";

        if (orderMessage) {
            orderMessage.textContent = "";
            orderMessage.className = "message";
        }

        try {
            const { error: deleteError } = await supabaseClient
                .from("meal_orders")
                .delete()
                .eq("employee_id", employeeId)
                .eq("order_date", orderDate);

            if (deleteError) throw deleteError;

            const { error: insertError } = await supabaseClient
                .from("meal_orders")
                .insert(rows);

            if (insertError) throw insertError;

            const isEdit = confirmOrderButton.dataset.edit === "true";
            const orderSuccessModal = document.getElementById("orderSuccessModal");
            const orderSuccessText = document.getElementById("orderSuccessText");

            if (orderSuccessModal && orderSuccessText) {
                orderSuccessText.textContent = isEdit
                    ? "Objednávka bola úspešne upravená."
                    : "Objednávka bola úspešne uložená.";
                orderSuccessModal.hidden = false;
            }

            setTimeout(() => {
                if (orderSuccessModal) {
                    orderSuccessModal.hidden = true;
                }
                showScreen("homeScreen");
            }, 3000);

        } catch (error) {
            console.error("Chyba pri ukladaní objednávky:", error);
            const errorText = error?.message || error?.details || JSON.stringify(error);

            if (orderMessage) {
                orderMessage.textContent = `Chyba: ${errorText}`;
                orderMessage.className = "message error-message";
            }
        } finally {
            confirmOrderButton.disabled = false;
            confirmOrderButton.textContent = "Potvrdiť objednávku";
        }
    });
}
