// =====================================
// OBEDY TMV
// Kompletný script.js
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    await loadEmployees();

    setupNavigation();
    setupLogin();
    setupOrderButton();

});


// =====================================
// PREPÍNANIE OBRAZOVIEK
// =====================================

function showScreen(screenId) {

    document
        .querySelectorAll(".app-screen")
        .forEach(screen => {
            screen.hidden = true;
        });

    const selectedScreen =
        document.getElementById(screenId);

    if (selectedScreen) {
        selectedScreen.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =====================================
// NAVIGÁCIA
// =====================================

function setupNavigation() {

    const openOrderButton =
        document.getElementById("openOrderButton");

    const openWeeklyMenuButton =
        document.getElementById(
            "openWeeklyMenuButton"
        );

    const openIssueButton =
        document.getElementById("openIssueButton");

    const openMyOrdersButton =
        document.getElementById(
            "openMyOrdersButton"
        );

    const openProfileButton =
        document.getElementById(
            "openProfileButton"
        );


    openOrderButton?.addEventListener(
        "click",
        () => {

            const employeeId =
                getCurrentEmployeeId();

            if (employeeId) {

                openOrderScreen(employeeId);

            } else {

                localStorage.setItem(
                    "requestedScreen",
                    "orderScreen"
                );

                showScreen("loginScreen");

            }

        }
    );


    openWeeklyMenuButton?.addEventListener(
        "click",
        () => {

            showScreen("weeklyMenuScreen");

        }
    );


    openIssueButton?.addEventListener(
        "click",
        () => {

            showScreen("issueScreen");

        }
    );


    openMyOrdersButton?.addEventListener(
        "click",
        () => {

            const employeeId =
                getCurrentEmployeeId();

            if (employeeId) {

                openMyOrdersScreen(employeeId);

            } else {

                localStorage.setItem(
                    "requestedScreen",
                    "myOrdersScreen"
                );

                showScreen("loginScreen");

            }

        }
    );


    openProfileButton?.addEventListener(
        "click",
        () => {

            const employeeId =
                localStorage.getItem(
                    "loggedEmployee"
                );

            if (employeeId) {

                showScreen("profileScreen");

            } else {

                localStorage.setItem(
                    "requestedScreen",
                    "profileScreen"
                );

                showScreen("loginScreen");

            }

        }
    );


    document
        .querySelectorAll("[data-back-home]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showScreen("homeScreen");

                }
            );

        });


    document
        .getElementById("logoutButton")
        ?.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "loggedEmployee"
                );

                localStorage.removeItem(
                    "requestedScreen"
                );

                const rememberMe =
                    document.getElementById(
                        "rememberMe"
                    );

                const pinInput =
                    document.getElementById(
                        "pinInput"
                    );

                const pinConfirm =
                    document.getElementById(
                        "pinConfirm"
                    );

                if (rememberMe) {
                    rememberMe.checked = false;
                }

                if (pinInput) {
                    pinInput.value = "";
                }

                if (pinConfirm) {
                    pinConfirm.value = "";
                }

                showScreen("homeScreen");

            }
        );

}


// =====================================
// AKTUÁLNY ZAMESTNANEC
// =====================================

function getCurrentEmployeeId() {

    return (
        localStorage.getItem(
            "loggedEmployee"
        )
        || document.getElementById(
            "employeeSelect"
        )?.value
        || ""
    );

}


// =====================================
// NAČÍTANIE ZAMESTNANCOV
// =====================================

async function loadEmployees() {

    const select =
        document.getElementById(
            "employeeSelect"
        );

    if (!select) return;


    try {

        const response =
            await fetch("employees.json");

        if (!response.ok) {

            throw new Error(
                "Nepodarilo sa načítať employees.json."
            );

        }


        const employees =
            await response.json();


        employees.sort((a, b) => {

            const employeeA =
                `${a.surname} ${a.name}`;

            const employeeB =
                `${b.surname} ${b.name}`;

            return employeeA.localeCompare(
                employeeB,
                "sk"
            );

        });


        select.innerHTML = "";


        const firstOption =
            document.createElement("option");

        firstOption.value = "";

        firstOption.textContent =
            "-- Vyberte zamestnanca --";

        select.appendChild(firstOption);


        employees.forEach(employee => {

            if (!employee.active) return;


            const option =
                document.createElement("option");


            option.value =
                employee.personalNumber
                && employee.personalNumber !== "None"

                    ? String(
                        employee.personalNumber
                    )

                    : `${employee.surname}_${employee.name}`;


            option.textContent =
                `${employee.surname} ${employee.name}`;


            option.dataset.name =
                employee.name || "";

            option.dataset.surname =
                employee.surname || "";

            option.dataset.chip =
                employee.chip || "";

            option.dataset.hasChip =
                employee.hasChip
                    ? "true"
                    : "false";


            select.appendChild(option);

        });


        const loggedEmployee =
            localStorage.getItem(
                "loggedEmployee"
            );

        const lastEmployee =
            localStorage.getItem(
                "lastEmployee"
            );


        if (
            loggedEmployee
            && hasEmployeeOption(
                select,
                loggedEmployee
            )
        ) {

            select.value =
                loggedEmployee;

            const rememberMe =
                document.getElementById(
                    "rememberMe"
                );

            if (rememberMe) {
                rememberMe.checked = true;
            }

        } else if (
            lastEmployee
            && hasEmployeeOption(
                select,
                lastEmployee
            )
        ) {

            select.value =
                lastEmployee;

        }


        select.addEventListener(
            "change",
            () => {

                if (select.value) {

                    localStorage.setItem(
                        "lastEmployee",
                        select.value
                    );

                }

            }
        );


    } catch (error) {

        console.error(error);

        select.innerHTML =
            "<option>Chyba pri načítaní zamestnancov</option>";

    }

}


function hasEmployeeOption(
    select,
    employeeId
) {

    return [...select.options].some(
        option =>
            option.value === employeeId
    );

}


// =====================================
// PRIHLÁSENIE A VLASTNÝ PIN
// =====================================

function setupLogin() {

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    const select =
        document.getElementById(
            "employeeSelect"
        );

    const pinInput =
        document.getElementById(
            "pinInput"
        );

    const pinConfirm =
        document.getElementById(
            "pinConfirm"
        );

    const pinConfirmWrapper =
        document.getElementById(
            "pinConfirmWrapper"
        );

    const rememberMe =
        document.getElementById(
            "rememberMe"
        );


    if (
        !loginButton
        || !select
        || !pinInput
        || !pinConfirm
        || !pinConfirmWrapper
        || !rememberMe
    ) {

        return;

    }


    function updatePinMode() {

        const employeeId =
            select.value;

        pinInput.value = "";
        pinConfirm.value = "";

        clearLoginMessage();


        if (!employeeId) {

            pinConfirmWrapper.hidden = true;

            loginButton.textContent =
                "Prihlásiť";

            return;

        }


        const savedPin =
            localStorage.getItem(
                `pin_${employeeId}`
            );


        if (savedPin) {

            pinConfirmWrapper.hidden = true;

            loginButton.textContent =
                "Prihlásiť";

        } else {

            pinConfirmWrapper.hidden = false;

            loginButton.textContent =
                "Vytvoriť PIN";

        }

    }


    select.addEventListener(
        "change",
        updatePinMode
    );


    updatePinMode();


    loginButton.addEventListener(
        "click",
        () => {

            const employeeId =
                select.value;

            const pin =
                pinInput.value.trim();

            const confirmPin =
                pinConfirm.value.trim();


            if (!employeeId) {

                showLoginError(
                    "Vyberte zamestnanca."
                );

                return;

            }


            if (!/^\d{4}$/.test(pin)) {

                showLoginError(
                    "PIN musí obsahovať presne 4 čísla."
                );

                return;

            }


            const pinKey =
                `pin_${employeeId}`;

            const savedPin =
                localStorage.getItem(
                    pinKey
                );


            // PRVÉ PRIHLÁSENIE
            if (!savedPin) {

                pinConfirmWrapper.hidden =
                    false;


                if (
                    !/^\d{4}$/.test(
                        confirmPin
                    )
                ) {

                    showLoginError(
                        "Potvrďte svoj 4-miestny PIN."
                    );

                    return;

                }


                if (pin !== confirmPin) {

                    showLoginError(
                        "PIN-y sa nezhodujú."
                    );

                    return;

                }


                localStorage.setItem(
                    pinKey,
                    pin
                );

            } else {

                // ĎALŠIE PRIHLÁSENIE
                if (pin !== savedPin) {

                    showLoginError(
                        "Nesprávny PIN."
                    );

                    return;

                }

            }


            localStorage.setItem(
                "lastEmployee",
                employeeId
            );


            if (rememberMe.checked) {

                localStorage.setItem(
                    "loggedEmployee",
                    employeeId
                );

            } else {

                localStorage.removeItem(
                    "loggedEmployee"
                );

            }


            pinInput.value = "";
            pinConfirm.value = "";

            clearLoginMessage();


            const requestedScreen =
                localStorage.getItem(
                    "requestedScreen"
                )
                || "orderScreen";


            localStorage.removeItem(
                "requestedScreen"
            );


            if (
                requestedScreen ===
                "orderScreen"
            ) {

                openOrderScreen(
                    employeeId
                );

            } else if (
                requestedScreen ===
                "myOrdersScreen"
            ) {

                openMyOrdersScreen(
                    employeeId
                );

            } else {

                showScreen(
                    requestedScreen
                );

            }

        }
    );

}


function clearLoginMessage() {

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    if (!loginMessage) return;

    loginMessage.textContent = "";
    loginMessage.className =
        "message";

}


function showLoginError(message) {

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    if (!loginMessage) return;

    loginMessage.textContent =
        message;

    loginMessage.className =
        "message error-message";

}


// =====================================
// OBJEDNÁVKA OBEDA
// =====================================

async function openOrderScreen(
    employeeId
) {

    const select =
        document.getElementById(
            "employeeSelect"
        );

    if (
        select
        && hasEmployeeOption(
            select,
            employeeId
        )
    ) {

        select.value =
            employeeId;

    }

    setWelcomeEmployee(
        employeeId
    );

    setCurrentDate();

    showScreen("orderScreen");

    await loadMenus();
    
    await checkTodayOrder(employeeId);

}
async function checkTodayOrder(employeeId) {

    const today =
        getTodayDate();

    const orderMessage =
        document.getElementById("orderMessage");

    const confirmOrderButton =
        document.getElementById("confirmOrderButton");

    const noSoup =
        document.getElementById("noSoup");


    // Najprv vyčistíme všetky voľby
    document
        .querySelectorAll(".meal-choice")
        .forEach(choice => {

            choice.checked = false;
            choice.disabled = false;

        });


    if (noSoup) {

        noSoup.checked = false;
        noSoup.disabled = false;

    }


    if (confirmOrderButton) {

        confirmOrderButton.disabled = false;
        confirmOrderButton.textContent =
            "Potvrdiť objednávku";

    }


    try {

        const { data, error } =
            await supabaseClient
                .from("meal_orders")
                .select(
                    "menu_id, menu_name, dining, takeaway, no_soup, issued"
                )
                .eq(
                    "employee_id",
                    employeeId
                )
                .eq(
                    "order_date",
                    today
                );


        if (error) {
            throw error;
        }


        // Zamestnanec dnes ešte nemá objednávku
        if (!data || data.length === 0) {

            if (orderMessage) {

                orderMessage.textContent =
                    "Dnes ešte nemáš objednaný obed.";

                orderMessage.className =
                    "message";

            }

            return;

        }


        // Predvyplnenie už existujúcej objednávky
        data.forEach(item => {

            const diningChoice =
                document.querySelector(
                    `.meal-choice[data-menu-id="${item.menu_id}"][data-option="dining"]`
                );

            const takeawayChoice =
                document.querySelector(
                    `.meal-choice[data-menu-id="${item.menu_id}"][data-option="takeaway"]`
                );


            if (diningChoice) {

                diningChoice.checked =
                    Boolean(item.dining);

            }


            if (takeawayChoice) {

                takeawayChoice.checked =
                    Boolean(item.takeaway);

            }

        });


        if (noSoup) {

            noSoup.checked =
                data.some(item =>
                    Boolean(item.no_soup)
                );

        }


        if (orderMessage) {

            orderMessage.textContent =
                "Toto je tvoja dnešná objednávka. Môžeš ju upraviť.";

            orderMessage.className =
                "message success-message";

        }


        if (confirmOrderButton) {

            confirmOrderButton.textContent =
                "Uložiť zmeny";
confirmOrderButton.dataset.edit = "true";
            
        }


    } catch (error) {

        console.error(
            "Chyba pri kontrole dnešnej objednávky:",
            error
        );


        if (orderMessage) {

            orderMessage.textContent =
                "Dnešnú objednávku sa nepodarilo načítať.";

            orderMessage.className =
                "message error-message";

        }

    }

}
// =====================================
// POZDRAV ZAMESTNANCA
// =====================================

function setWelcomeEmployee(
    employeeId
) {

    const select =
        document.getElementById(
            "employeeSelect"
        );

    const welcomeName =
        document.getElementById(
            "welcomeName"
        );

    if (
        !select
        || !welcomeName
    ) {

        return;

    }


    const option =
        [...select.options].find(
            item =>
                item.value === employeeId
        );


    const firstName =
        option?.dataset?.name || "";


    welcomeName.textContent =
        firstName

            ? `Ahoj, ${firstName}!`

            : "Ahoj!";

}


// =====================================
// DÁTUM
// =====================================

function setCurrentDate() {

    const currentDate =
        document.getElementById(
            "currentDate"
        );

    if (!currentDate) return;


    const today =
        new Date();


    currentDate.textContent =
        today.toLocaleDateString(
            "sk-SK",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


// =====================================
// NAČÍTANIE MENU
// =====================================

async function loadMenus() {

    const container =
        document.getElementById(
            "menuContainer"
        );

    if (!container) return;


    container.innerHTML =
        "<p>Načítavam menu...</p>";


    try {

        const response =
            await fetch("menus.json");

        if (!response.ok) {

            throw new Error(
                "Nepodarilo sa načítať menus.json."
            );

        }


        const menus =
            await response.json();


        container.innerHTML = "";


        menus.forEach(menu => {

            if (!menu.active) return;


            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "menu-card";


            card.innerHTML = `
                <div class="menu-card-header">
                    <span class="menu-number">
                        Menu ${escapeHtml(menu.id)}
                    </span>
                </div>

                <h3>
                    ${escapeHtml(menu.name)}
                </h3>

                <div class="menu-options">

                    <label class="menu-option">

                        <input
                            type="checkbox"
                            class="meal-choice"
                            data-menu-id="${escapeHtml(menu.id)}"
                            data-option="dining"
                        >

                        <span>
                            V jedálni
                        </span>

                    </label>

                    <label class="menu-option">

                        <input
                            type="checkbox"
                            class="meal-choice"
                            data-menu-id="${escapeHtml(menu.id)}"
                            data-option="takeaway"
                        >

                        <span>
                            Zabaliť
                        </span>

                    </label>

                </div>
            `;


            container.appendChild(
                card
            );

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Chyba pri načítaní menu.</p>";

    }

}


// =====================================
// ULOŽENIE OBJEDNÁVKY DO SUPABASE
// =====================================

function setupOrderButton() {

    const confirmOrderButton =
        document.getElementById(
            "confirmOrderButton"
        );

    if (!confirmOrderButton) return;


    confirmOrderButton.addEventListener(
        "click",
        async () => {

            const selectedChoices =
                document.querySelectorAll(
                    ".meal-choice:checked"
                );

            const orderMessage =
                document.getElementById(
                    "orderMessage"
                );


            if (
                selectedChoices.length === 0
            ) {

                orderMessage.textContent =
                    "Vyberte aspoň jeden obed.";

                orderMessage.className =
                    "message error-message";

                return;

            }


            const employeeSelect =
                document.getElementById(
                    "employeeSelect"
                );

            const employeeId =
                getCurrentEmployeeId();


            if (!employeeId) {

                orderMessage.textContent =
                    "Najprv sa prihláste.";

                orderMessage.className =
                    "message error-message";

                return;

            }


            const selectedEmployee =
                [...employeeSelect.options]
                    .find(
                        option =>
                            option.value ===
                            employeeId
                    );


            const employeeName =
                selectedEmployee

                    ? selectedEmployee
                        .textContent
                        .trim()

                    : employeeId;


            const noSoup =
                document
                    .getElementById(
                        "noSoup"
                    )
                    ?.checked
                || false;


            const orderDate =
                getTodayDate();


            const groupedMenus = {};


            selectedChoices.forEach(
                choice => {

                    const menuId =
                        choice.dataset.menuId;

                    const option =
                        choice.dataset.option;

                    const menuCard =
                        choice.closest(
                            ".menu-card"
                        );

                    const menuName =
                        menuCard
                            ?.querySelector("h3")
                            ?.textContent
                            ?.trim()

                        || `Menu ${menuId}`;


                    if (
                        !groupedMenus[
                            menuId
                        ]
                    ) {

                        groupedMenus[
                            menuId
                        ] = {

                            employee_id:
                                employeeId,

                            employee_name:
                                employeeName,

                            order_date:
                                orderDate,

                            menu_id:
                                String(menuId),

                            menu_name:
                                menuName,

                            dining:
                                false,

                            takeaway:
                                false,

                            no_soup:
                                noSoup,

                            issued:
                                false

                        };

                    }


                    if (
                        option ===
                        "dining"
                    ) {

                        groupedMenus[
                            menuId
                        ].dining = true;

                    }


                    if (
                        option ===
                        "takeaway"
                    ) {

                        groupedMenus[
                            menuId
                        ].takeaway = true;

                    }

                }
            );


            const rows =
                Object.values(
                    groupedMenus
                );

console.log("OBJEDNÁVKA NA ULOŽENIE:", rows);
            
            confirmOrderButton.disabled =
                true;

            confirmOrderButton.textContent =
                "Ukladám objednávku...";

            orderMessage.textContent = "";

            orderMessage.className =
                "message";


            try {

                const {
                    error: deleteError
                } =

                    await supabaseClient
                        .from("meal_orders")
                        .delete()
                        .eq(
                            "employee_id",
                            employeeId
                        )
                        .eq(
                            "order_date",
                            orderDate
                        );


                if (deleteError) {

                    throw deleteError;

                }


                const {
                    error: insertError
                } =

                    await supabaseClient
                       .from("meal_orders")
                        .insert(rows);


                if (insertError) {

                    throw insertError;

                }


                orderMessage.textContent =
                    "Objednávka bola úspešne uložená.";

                orderMessage.className =
                    "message success-message";


                await loadMyOrders(
                    employeeId
                );
                
setTimeout(() => {

    showScreen("homeScreen");

}, 1200);

           } catch (error) {

    console.error(
        "Chyba pri ukladaní objednávky:",
        error
    );

    const errorText =
        error?.message
        || error?.details
        || JSON.stringify(error);

    orderMessage.textContent =
        `Chyba: ${errorText}`;

    orderMessage.className =
        "message error-message";

            } finally {

                confirmOrderButton.disabled =
                    false;

                confirmOrderButton.textContent =
                    "Potvrdiť objednávku";

            }

        }
    );

}


// =====================================
// MOJE OBEDY
// =====================================

function openMyOrdersScreen(
    employeeId
) {

    showScreen(
        "myOrdersScreen"
    );

    loadMyOrders(
        employeeId
    );

}


async function loadMyOrders(
    employeeId
) {

    const container =
        document.getElementById(
            "myOrdersContainer"
        );

    if (
        !container
        || !employeeId
    ) {

        return;

    }


    container.innerHTML =
        "<p>Načítavam objednávky...</p>";


    try {

        const {
            data,
            error
        } =

            await supabaseClient
                .from("meal_orders")
                .select(
                    `
                    id,
                    order_date,
                    menu_id,
                    menu_name,
                    dining,
                    takeaway,
                    no_soup,
                    issued
                    `
                )
                .eq(
                    "employee_id",
                    employeeId
                )
                .order(
                    "order_date",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        if (
            !data
            || data.length === 0
        ) {

            container.innerHTML =
                "<p>Zatiaľ nemáš žiadne objednávky.</p>";

            return;

        }


        const groupedByDate = {};


        data.forEach(item => {

            if (
                !groupedByDate[
                    item.order_date
                ]
            ) {

                groupedByDate[
                    item.order_date
                ] = [];

            }


            groupedByDate[
                item.order_date
            ].push(item);

        });


        container.innerHTML = "";


        Object
            .entries(groupedByDate)
            .forEach(
                ([date, items]) => {

                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "menu-card";


                    const formattedDate =
                        formatOrderDate(
                            date
                        );


                    const itemsHtml =
                        items
                            .map(item => {

                                const methods =
                                    [];


                                if (
                                    item.dining
                                ) {

                                    methods.push(
                                        "V jedálni"
                                    );

                                }


                                if (
                                    item.takeaway
                                ) {

                                    methods.push(
                                        "Zabaliť"
                                    );

                                }


                                const soupText =
                                    item.no_soup

                                        ? " · bez polievky"

                                        : "";


                                const issuedText =
                                    item.issued

                                        ? " · vydané"

                                        : "";


                                return `
                                    <div class="my-order-item">

                                        <strong>
                                            ${escapeHtml(item.menu_name)}
                                        </strong>

                                        <div>
                                            ${escapeHtml(methods.join(" + "))}
                                            ${escapeHtml(soupText)}
                                            ${escapeHtml(issuedText)}
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


                    container.appendChild(
                        card
                    );

                }
            );


    } catch (error) {

        console.error(
            "Chyba pri načítaní objednávok:",
            error
        );

        container.innerHTML =
            "<p>Objednávky sa nepodarilo načítať.</p>";

    }

}


// =====================================
// DÁTUM PRE DATABÁZU
// =====================================

function getTodayDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatOrderDate(date) {

    return new Date(
        `${date}T12:00:00`
    ).toLocaleDateString(
        "sk-SK",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// =====================================
// BEZPEČNÉ ZOBRAZENIE TEXTU
// =====================================

function escapeHtml(text) {

    const element =
        document.createElement("div");

    element.textContent =
        String(text ?? "");

    return element.innerHTML;

}
