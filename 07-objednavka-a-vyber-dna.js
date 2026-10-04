// =====================================
// 7. VÝBER DŇA OBJEDNÁVKY
// =====================================

function isDeadlineExempt(employeeId) {
    const select = document.getElementById("employeeSelect");
    if (!select) return false;

    const option = [...select.options].find(option => option.value === employeeId);
    if (!option) return false;

    return option.textContent.trim().toLowerCase() === "mitice návšteva";
}

async function openWeekSelectionScreen(employeeId) {
    sessionStorage.setItem("loggedEmployee", employeeId);

    const weekCards = document.getElementById("weekCards");
    const weekTitle = document.getElementById("weekTitle");

    if (!weekCards || !weekTitle) return;

    const now = new Date();
    const currentDay = now.getDay();
    const isFridayAfterNoon = currentDay === 5 && now.getHours() >= 12;

    const monday = new Date(now);
    const daysFromMonday = currentDay === 0 ? 1 : 1 - currentDay;

    monday.setDate(now.getDate() + daysFromMonday + (isFridayAfterNoon ? 7 : 0));
    monday.setHours(7, 30, 0, 0);

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
            .select("order_date, menu_id, menu_name, dining, takeaway, quantity, no_soup, issued")
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
        deadline.setHours(7, 30, 0, 0);

        const isClosed = !isDeadlineExempt(employeeId) && new Date() > deadline;

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
                const quantity = Number(order.quantity) || 1;
                if (quantity > 1) servingType += ` ×${quantity}`;

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

            // TLAČIDLO NA ZRUŠENIE OBJEDNÁVKY (správne umiestnené tu vo vnútri)
            if (!isClosed) {
                const cancelButton = document.createElement("button");
                cancelButton.className = "main-button cancel-order-btn";
                cancelButton.style.cssText = "margin-top: 10px; background-color: #ef4444; font-size: 0.85rem; padding: 6px;";
                cancelButton.textContent = "❌ Zrušiť objednávku";
                
                cancelButton.addEventListener("click", async (e) => {
                    e.stopPropagation(); // Zabráni otvoreniu detailu dňa
                    
                    if (!confirm(`Naozaj chcete zrušiť objednávku na dňa ${formatShortDate(date)}?`)) return;

                    try {
                        const { error } = await supabaseClient
                            .from("meal_orders")
                            .delete()
                            .eq("employee_id", employeeId)
                            .eq("order_date", dateForDatabase);

                        if (error) throw error;

                        alert("Objednávka bola úspešne zrušená.");
                        openWeekSelectionScreen(employeeId); // Obnoví zoznam týždňa
                    } catch (err) {
                        console.error("Chyba pri rušení objednávky:", err);
                        alert("Nepodarilo sa zrušiť objednávku.");
                    }
                });

                card.appendChild(cancelButton);
            }
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
    const globalNoteInput = document.getElementById("globalOrderNote");

    if (noSoup) {
        noSoup.checked = false;
        noSoup.disabled = false;
    }

    if (globalNoteInput) {
        globalNoteInput.value = "";
        globalNoteInput.disabled = false;
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
            .select("menu_id, menu_name, menu_choice, soup_choice, note, dining, takeaway, quantity, no_soup, issued")
            .eq("employee_id", employeeId)
            .eq("order_date", today);

        if (error) throw error;

        const now = new Date();
        const [year, month, day] = today.split("-").map(Number);
        const deadline = new Date(year, month - 1, day, 7, 30, 0);
        const canEdit = isDeadlineExempt(employeeId) || now < deadline;

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
                if (globalNoteInput) globalNoteInput.disabled = true;
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
            
            if (item.soup_choice) {
                String(item.soup_choice)
                    .split(" + ")
                    .map(soup => soup.trim())
                    .filter(Boolean)
                    .forEach(soup => {
                        const soupCheckbox = document.querySelector(
                            `.soup-choice-checkbox[value="${soup}"]`
                        );
                        if (soupCheckbox) soupCheckbox.checked = true;
                    });
            }

            if (menuChoice) menuChoice.checked = true;
            // Použijeme logický OR (nie priame priradenie), aby pri dvoch
            // riadkoch pre to isté menu (jedna "V jedálni", druhá "Zabaliť")
            // jeden riadok neodškrtol to, čo nastavil druhý.
            if (diningChoice && item.dining) diningChoice.checked = true;
            if (takeawayChoice && item.takeaway) takeawayChoice.checked = true;

            // Predvyplnenie počtu kusov pri úprave existujúcej objednávky
            if (item.dining) {
                const diningStepper = getQtyStepper(item.menu_id, "dining");
                if (diningStepper) {
                    diningStepper.hidden = false;
                    setStepperQuantity(diningStepper, item.quantity);
                }
            }
            if (item.takeaway) {
                const takeawayStepper = getQtyStepper(item.menu_id, "takeaway");
                if (takeawayStepper) {
                    takeawayStepper.hidden = false;
                    setStepperQuantity(takeawayStepper, item.quantity);
                }
            }
            
            // Nastavenie poznámky (stačí nastaviť do spoločného pola)
            if (globalNoteInput && item.note) {
                globalNoteInput.value = item.note;
            }
        });

        if (noSoup) {
            noSoup.checked = data.some(item => Boolean(item.no_soup));
        }

        updateSoupSelectionLimit();

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
            if (globalNoteInput) globalNoteInput.disabled = true;
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
// 12A. POČET KUSOV (V JEDÁLNI / ZABALIŤ)
// =====================================
const MAX_MEAL_QUANTITY = 10;

function createQtyStepperHtml(menuId, option) {
    return `
        <div class="qty-stepper" data-menu-id="${menuId}" data-option="${option}" data-quantity="1" hidden>
            <button type="button" class="qty-btn qty-minus" aria-label="Znížiť počet kusov">−</button>
            <span class="qty-value">1</span>
            <button type="button" class="qty-btn qty-plus" aria-label="Zvýšiť počet kusov">+</button>
        </div>
    `;
}

function getQtyStepper(menuId, option) {
    return document.querySelector(`.qty-stepper[data-menu-id="${menuId}"][data-option="${option}"]`);
}

function setStepperQuantity(stepper, quantity) {
    if (!stepper) return;
    const clamped = Math.min(MAX_MEAL_QUANTITY, Math.max(1, Number(quantity) || 1));
    stepper.dataset.quantity = String(clamped);
    const valueElement = stepper.querySelector(".qty-value");
    if (valueElement) valueElement.textContent = String(clamped);
}

function getStepperQuantity(menuId, option) {
    const stepper = getQtyStepper(menuId, option);
    return stepper ? Number(stepper.dataset.quantity) || 1 : 1;
}

// Celkový počet objednaných kusov (spočíta kusy zo všetkých zaškrtnutých
// možností "V jedálni"/"Zabaliť" naprieč všetkými menu).
function getTotalOrderedUnits() {
    let total = 0;
    document.querySelectorAll(".meal-choice:checked").forEach(choice => {
        total += getStepperQuantity(choice.dataset.menuId, choice.dataset.option);
    });
    return total;
}

// Umožní vybrať toľko polievok, koľko je objednaných kusov (napr. pri 2
// objednaných obedoch sa dajú zaškrtnúť 2 rôzne polievky).
function updateSoupSelectionLimit() {
    const checkboxes = [...document.querySelectorAll(".soup-choice-checkbox")];
    if (checkboxes.length === 0) return;

    const totalUnits = Math.max(1, getTotalOrderedUnits());
    const checkedBoxes = checkboxes.filter(checkbox => checkbox.checked);

    // Ak je zaškrtnutých viac polievok, než je aktuálne objednaných kusov,
    // nadbytočné (od konca) odznačíme.
    if (checkedBoxes.length > totalUnits) {
        checkedBoxes.slice(totalUnits).forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    const stillCheckedCount = checkboxes.filter(checkbox => checkbox.checked).length;
    checkboxes.forEach(checkbox => {
        checkbox.disabled = !checkbox.checked && stillCheckedCount >= totalUnits;
    });

    const hint = document.querySelector(".soup-limit-hint");
    if (hint) {
        hint.textContent = totalUnits > 1
            ? `Môžeš vybrať až ${totalUnits} polievky (podľa počtu objednaných obedov).`
            : "";
    }
}

// Zobrazenie/skrytie a +/- ovládanie stepperu sa napojí raz na kontajner
// (ten istý DOM element sa pri každom načítaní menu iba vyprázdni, nie nahradí).
function setupQuantitySteppers(container) {
    if (!container || container.dataset.qtyBound === "true") return;
    container.dataset.qtyBound = "true";

    container.addEventListener("change", event => {
        const checkbox = event.target.closest(".meal-choice");
        if (checkbox) {
            const stepper = getQtyStepper(checkbox.dataset.menuId, checkbox.dataset.option);
            if (stepper) {
                if (checkbox.checked) {
                    stepper.hidden = false;
                } else {
                    stepper.hidden = true;
                    setStepperQuantity(stepper, 1);
                }
            }
            updateSoupSelectionLimit();
            return;
        }

        if (event.target.classList.contains("soup-choice-checkbox")) {
            updateSoupSelectionLimit();
        }
    });

    container.addEventListener("click", event => {
        const button = event.target.closest(".qty-btn");
        if (!button) return;

        event.preventDefault();

        const stepper = button.closest(".qty-stepper");
        if (!stepper) return;

        const current = Number(stepper.dataset.quantity) || 1;
        const next = button.classList.contains("qty-plus") ? current + 1 : current - 1;
        setStepperQuantity(stepper, next);
        updateSoupSelectionLimit();
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
            .select("soup, menu1, menu2, menu3, menu4, menu5, menu6, menu_date")
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
                name: String(name || "")
                    .replace(/\s+\d+[,.]\d{2}\s*€?\s*$/, "")
                    .trim()
            }))
            .filter(menu => menu.name);

        container.innerHTML = "";

        // >>> TU SA ZAČÍNA ČASŤ S POLIEVKOU <<<
        if (data.soup) {
            const soupCard = document.createElement("article");
            soupCard.className = "menu-card soup-card";

            const soupOptions = String(data.soup)
                .split(/,\s+(?=[A-ZÁČĎÉÍĹĽŇÓŔŠŤÚÝŽ])/u)
                .map(soup => soup.trim())
                .filter(Boolean);

            const soupOptionsHtml = soupOptions.length > 1
                ? `
                    <div class="menu-choice-box" style="margin-top: 10px;">
                        <strong>Vyberte si polievku:</strong>
                        ${soupOptions.map(soup => `
                            <label style="display: block; margin-top: 6px; cursor: pointer;">
                                <input type="checkbox" value="${escapeHtml(soup)}" class="soup-choice-checkbox">
                                ${escapeHtml(soup)}
                            </label>
                        `).join("")}
                        <div class="soup-limit-hint" style="margin-top: 8px; font-size: 0.85rem; color: #64748b;"></div>
                    </div>
                `
                : "";

            // TENTO KÚSOK PRIDÁVA "BEZ POLIEVKY" PRIAMO POD POLIEVKU
            soupCard.innerHTML = `
                <div class="menu-card-header">
                    <span class="menu-number">🥣 Polievka</span>
                </div>
                ${soupOptions.length > 1 ? "" : `<h3>${escapeHtml(data.soup)}</h3>`}
                ${soupOptionsHtml}
                
                <div style="margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                    <label class="soup-option" style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 500;">
                        <input type="checkbox" id="noSoup">
                        <span>Bez polievky</span>
                    </label>
                </div>
            `;
            container.appendChild(soupCard);
        }
        // >>> TU POLIEVKA KONČÍ A ZAČÍNAJÚ HLAVNÉ JEDLÁ <<<

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
                                    <input type="radio" name="menu-choice-${menu.id}" value="Camembert" class="menu-choice" data-menu-id="${menu.id}">
                                    Camembert
                                </label>
                            </div>
                          `
                        : ""
                }
                <div class="menu-options" style="margin-top: 10px;">
                    <div class="menu-option-wrapper">
                        <label class="menu-option">
                            <input type="checkbox" class="meal-choice" data-menu-id="${menu.id}" data-option="dining">
                            <span>V jedálni</span>
                        </label>
                        ${createQtyStepperHtml(menu.id, "dining")}
                    </div>
                    <div class="menu-option-wrapper">
                        <label class="menu-option">
                            <input type="checkbox" class="meal-choice" data-menu-id="${menu.id}" data-option="takeaway">
                            <span>Zabaliť</span>
                        </label>
                        ${createQtyStepperHtml(menu.id, "takeaway")}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        setupQuantitySteppers(container);
        updateSoupSelectionLimit();

        // Spoločné pole pre poznámku pod všetkými menu
        const globalNoteContainer = document.createElement("div");
        globalNoteContainer.className = "global-note-container";
        globalNoteContainer.style.cssText = "margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;";
        globalNoteContainer.innerHTML = `
            <label for="globalOrderNote" style="display: block; font-weight: 600; margin-bottom: 6px; color: #334155;">💬 Poznámka k objednávke (napr. makové buchty, bez cibule...):</label>
            <input type="text" id="globalOrderNote" placeholder="Sem napíšte poznámku..." style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box;">
        `;
        container.appendChild(globalNoteContainer);

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

        const maxMenuNumber = Number(selectedEmployee?.dataset?.maxMenuNumber || 5);
        const employeeName = selectedEmployee ? selectedEmployee.textContent.trim() : employeeId;
        const noSoup = document.getElementById("noSoup")?.checked || false;
        const orderDate = getOrderDate();
        
        // Získanie hodnoty poznámky zo správneho elementu
        const globalNoteInput = document.getElementById("globalOrderNote");
        const globalNoteValue = globalNoteInput ? globalNoteInput.value.trim() : "";

        const soupCardElement = document.querySelector(".soup-card");
        const selectedSoupCheckboxes = soupCardElement
            ? [...soupCardElement.querySelectorAll(".soup-choice-checkbox:checked")]
            : [];
        const selectedSoupChoice = selectedSoupCheckboxes.length > 0
            ? selectedSoupCheckboxes.map(checkbox => checkbox.value).join(" + ")
            : null;

        if (soupCardElement && soupCardElement.querySelector('.soup-choice-checkbox') && selectedSoupCheckboxes.length === 0 && !noSoup) {
            if (orderMessage) {
                orderMessage.textContent = "🥣 Vyberte si, prosím, polievku alebo zaškrtnite 'Bez polievky'.";
                orderMessage.className = "message error-message";
            }
            return;
        }

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

        const rowsToInsert = [];

        // Prejdeme všetky vybrané možnosti a ak má niekto zvolené oboje (aj jedáleň, aj zabaliť),
        // vytvoríme pre dané menu dva samostatné riadky do databázy.
        const menuSelections = {};

        selectedChoices.forEach(choice => {
            const menuId = choice.dataset.menuId;
            const option = choice.dataset.option; // "dining" alebo "takeaway"

            if (!menuSelections[menuId]) {
                menuSelections[menuId] = {
                    dining: false,
                    takeaway: false,
                    diningQty: 1,
                    takeawayQty: 1
                };
            }

            if (option === "dining") {
                menuSelections[menuId].dining = true;
                menuSelections[menuId].diningQty = getStepperQuantity(menuId, "dining");
            }
            if (option === "takeaway") {
                menuSelections[menuId].takeaway = true;
                menuSelections[menuId].takeawayQty = getStepperQuantity(menuId, "takeaway");
            }
        });

        Object.keys(menuSelections).forEach(menuId => {
            const menuCard = document.querySelector(`.menu-card[data-menu-id="${menuId}"]`);
            const menuName = menuCard?.querySelector("h3")?.textContent?.trim() || `Menu ${menuId}`;
            const checkedRadio = menuCard ? menuCard.querySelector(`input[name="menu-choice-${menuId}"]:checked`) : null;
            const menuChoice = checkedRadio ? checkedRadio.value : null;
            const selection = menuSelections[menuId];

            // Ak si zvolil "V jedálni", vytvoríme pre to samostatný riadok
            if (selection.dining) {
                rowsToInsert.push({
                    employee_id: employeeId,
                    employee_name: employeeName,
                    order_date: orderDate,
                    menu_id: String(menuId),
                    menu_name: menuName,
                    menu_choice: menuChoice,
                    soup_choice: selectedSoupChoice,
                    note: globalNoteValue,
                    dining: true,
                    takeaway: false,
                    quantity: selection.diningQty,
                    no_soup: noSoup,
                    issued: false
                });
            }

            // Ak si zvolil "Zabaliť", vytvoríme pre to druhý samostatný riadok
            if (selection.takeaway) {
                rowsToInsert.push({
                    employee_id: employeeId,
                    employee_name: employeeName,
                    order_date: orderDate,
                    menu_id: String(menuId),
                    menu_name: menuName,
                    menu_choice: menuChoice,
                    soup_choice: selectedSoupChoice,
                    note: globalNoteValue,
                    dining: false,
                    takeaway: true,
                    quantity: selection.takeawayQty,
                    no_soup: noSoup,
                    issued: false
                });
            }
        });

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
                .insert(rowsToInsert);

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
