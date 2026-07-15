// =====================================
// OBEDY TMV
// Navigácia, zamestnanci a prihlasovanie
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadEmployees();
    setupNavigation();
    setupLogin();
    setupOrderButton();

});


// =====================================
// PREPÍNANIE OBRAZOVIEK
// =====================================

function showScreen(screenId) {

    document.querySelectorAll(".app-screen").forEach(screen => {
        screen.hidden = true;
    });

    const selectedScreen = document.getElementById(screenId);

    if (selectedScreen) {
        selectedScreen.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function setupNavigation() {

    const openOrderButton =
        document.getElementById("openOrderButton");

    const openWeeklyMenuButton =
        document.getElementById("openWeeklyMenuButton");

    const openIssueButton =
        document.getElementById("openIssueButton");

    const openMyOrdersButton =
        document.getElementById("openMyOrdersButton");

    const openProfileButton =
        document.getElementById("openProfileButton");


    openOrderButton?.addEventListener("click", () => {

        const loggedEmployee =
            localStorage.getItem("loggedEmployee");

        if (loggedEmployee) {

            openOrderScreen(loggedEmployee);

        } else {

            localStorage.setItem(
                "requestedScreen",
                "orderScreen"
            );

            showScreen("loginScreen");

        }

    });


    openWeeklyMenuButton?.addEventListener("click", () => {
        showScreen("weeklyMenuScreen");
    });


    openIssueButton?.addEventListener("click", () => {
        showScreen("issueScreen");
    });


    openMyOrdersButton?.addEventListener("click", () => {

        const loggedEmployee =
            localStorage.getItem("loggedEmployee");

        if (loggedEmployee) {

            showScreen("myOrdersScreen");

        } else {

            localStorage.setItem(
                "requestedScreen",
                "myOrdersScreen"
            );

            showScreen("loginScreen");

        }

    });


    openProfileButton?.addEventListener("click", () => {

        const loggedEmployee =
            localStorage.getItem("loggedEmployee");

        if (loggedEmployee) {

            showScreen("profileScreen");

        } else {

            localStorage.setItem(
                "requestedScreen",
                "profileScreen"
            );

            showScreen("loginScreen");

        }

    });


    document
        .querySelectorAll("[data-back-home]")
        .forEach(button => {

            button.addEventListener("click", () => {
                showScreen("homeScreen");
            });

        });


    document
        .getElementById("logoutButton")
        ?.addEventListener("click", () => {

            localStorage.removeItem("loggedEmployee");
            localStorage.removeItem("requestedScreen");

            const rememberMe =
                document.getElementById("rememberMe");

            const pinInput =
                document.getElementById("pinInput");

            const pinConfirm =
                document.getElementById("pinConfirm");

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

        });

}


// =====================================
// NAČÍTANIE ZAMESTNANCOV
// =====================================

async function loadEmployees() {

    const select =
        document.getElementById("employeeSelect");

    if (!select) return;

    try {

        const response =
            await fetch("employees.json");

        if (!response.ok) {
            throw new Error(
                "Nepodarilo sa načítať employees.json"
            );
        }

        const employees =
            await response.json();


        employees.sort((a, b) => {

            const menoA =
                `${a.surname} ${a.name}`;

            const menoB =
                `${b.surname} ${b.name}`;

            return menoA.localeCompare(
                menoB,
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
                employee.personalNumber &&
                employee.personalNumber !== "None"
                    ? employee.personalNumber
                    : `${employee.surname}_${employee.name}`;


            option.textContent =
                `${employee.surname} ${employee.name}`;

            option.dataset.name =
                employee.name;

            option.dataset.surname =
                employee.surname;

            option.dataset.chip =
                employee.chip || "";

            option.dataset.hasChip =
                employee.hasChip ? "true" : "false";

            select.appendChild(option);

        });


        const loggedEmployee =
            localStorage.getItem("loggedEmployee");

        const lastEmployee =
            localStorage.getItem("lastEmployee");


        if (loggedEmployee) {

            select.value = loggedEmployee;

            const rememberMe =
                document.getElementById("rememberMe");

            if (rememberMe) {
                rememberMe.checked = true;
            }

        } else if (lastEmployee) {

            select.value = lastEmployee;

        }


        select.addEventListener("change", () => {

            if (select.value) {

                localStorage.setItem(
                    "lastEmployee",
                    select.value
                );

            }

        });


    } catch (error) {

        console.error(error);

        select.innerHTML =
            "<option>Chyba pri načítaní zamestnancov</option>";

    }

}


// =====================================
// PRIHLÁSENIE A VLASTNÝ PIN
// =====================================

function setupLogin() {

    const loginButton =
        document.getElementById("loginButton");

    const select =
        document.getElementById("employeeSelect");

    const pinInput =
        document.getElementById("pinInput");

    const pinConfirm =
        document.getElementById("pinConfirm");

    const pinConfirmWrapper =
        document.getElementById("pinConfirmWrapper");

    const rememberMe =
        document.getElementById("rememberMe");


    if (
        !loginButton ||
        !select ||
        !pinInput ||
        !pinConfirm ||
        !pinConfirmWrapper ||
        !rememberMe
    ) {
        return;
    }


    function updatePinMode() {

        const employeeId = select.value;

        pinInput.value = "";
        pinConfirm.value = "";

        const loginMessage =
            document.getElementById("loginMessage");

        if (loginMessage) {
            loginMessage.textContent = "";
            loginMessage.className = "message";
        }


        if (!employeeId) {

            pinConfirmWrapper.hidden = true;
            loginButton.textContent = "Prihlásiť";

            return;

        }


        const savedPin =
            localStorage.getItem(
                `pin_${employeeId}`
            );


        if (savedPin) {

            pinConfirmWrapper.hidden = true;
            loginButton.textContent = "Prihlásiť";

        } else {

            pinConfirmWrapper.hidden = false;
            loginButton.textContent = "Vytvoriť PIN";

        }

    }


    select.addEventListener(
        "change",
        updatePinMode
    );


    updatePinMode();


    loginButton.addEventListener("click", () => {

        const employeeId =
            select.value;

        const pin =
            pinInput.value.trim();

        const confirmPin =
            pinConfirm.value.trim();

        const savedPin =
            localStorage.getItem(
                `pin_${employeeId}`
            );


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


        // PRVÉ PRIHLÁSENIE
        // Zamestnanec si vytvorí vlastný PIN

        if (!savedPin) {

            pinConfirmWrapper.hidden = false;


            if (!/^\d{4}$/.test(confirmPin)) {

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
                `pin_${employeeId}`,
                pin
            );

        } else {

            // ĎALŠIE PRIHLÁSENIE
            // Kontrola uloženého PIN-u

            if (pin !== savedPin) {

                showLoginError(
                    "Nesprávny PIN."
                );

                return;

            }

        }


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


        localStorage.setItem(
            "lastEmployee",
            employeeId
        );


        pinInput.value = "";
        pinConfirm.value = "";


        const loginMessage =
            document.getElementById("loginMessage");

        if (loginMessage) {

            loginMessage.textContent = "";
            loginMessage.className = "message";

        }


        const requestedScreen =
            localStorage.getItem("requestedScreen")
            || "orderScreen";


        localStorage.removeItem(
            "requestedScreen"
        );


        if (requestedScreen === "orderScreen") {

            openOrderScreen(employeeId);

        } else {

            showScreen(requestedScreen);

        }

    });

}


function showLoginError(message) {

    const loginMessage =
        document.getElementById("loginMessage");

    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className =
        "message error-message";

}


// =====================================
// OBJEDNÁVKA OBEDA
// =====================================

function openOrderScreen(employeeId) {

    setWelcomeEmployee(employeeId);
    setCurrentDate();

    showScreen("orderScreen");
    loadMenus();

}


function setWelcomeEmployee(employeeId) {

    const select =
        document.getElementById("employeeSelect");

    const welcomeName =
        document.getElementById("welcomeName");

    if (!select || !welcomeName) return;


    const option =
        [...select.options].find(
            item => item.value === employeeId
        );


    const firstName =
        option?.dataset?.name || "";


    welcomeName.textContent =
        firstName
            ? `Ahoj, ${firstName}!`
            : "Ahoj!";

}


function setCurrentDate() {

    const currentDate =
        document.getElementById("currentDate");

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
        document.getElementById("menuContainer");

    if (!container) return;


    container.innerHTML =
        "<p>Načítavam menu...</p>";


    try {

        const response =
            await fetch("menus.json");

        if (!response.ok) {
            throw new Error(
                "Nepodarilo sa načítať menus.json"
            );
        }

        const menus =
            await response.json();


        container.innerHTML = "";


        menus.forEach(menu => {

            if (!menu.active) return;


            const card =
                document.createElement("article");

            card.className = "menu-card";


            card.innerHTML = `
                <div class="menu-card-header">
                    <span class="menu-number">
                        Menu ${escapeHtml(menu.id)}
                    </span>
                </div>

                <h3>${escapeHtml(menu.name)}</h3>

                <div class="menu-options">

                    <label class="menu-option">
                        <input
                            type="checkbox"
                            class="meal-choice"
                            data-menu-id="${escapeHtml(menu.id)}"
                            data-option="dining"
                        >
                        <span>V jedálni</span>
                    </label>

                    <label class="menu-option">
                        <input
                            type="checkbox"
                            class="meal-choice"
                            data-menu-id="${escapeHtml(menu.id)}"
                            data-option="takeaway"
                        >
                        <span>Zabaliť</span>
                    </label>

                </div>
            `;


            container.appendChild(card);

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Chyba pri načítaní menu.</p>";

    }

}


// =====================================
// POTVRDENIE OBJEDNÁVKY – ZATIAĽ TEST
// =====================================

function setupOrderButton() {

    const confirmOrderButton =
        document.getElementById(
            "confirmOrderButton"
        );

    if (!confirmOrderButton) return;


    confirmOrderButton.addEventListener(
        "click",
        () => {

            const selectedChoices =
                document.querySelectorAll(
                    ".meal-choice:checked"
                );

            const orderMessage =
                document.getElementById(
                    "orderMessage"
                );


            if (selectedChoices.length === 0) {

                orderMessage.textContent =
                    "Vyberte aspoň jeden obed.";

                orderMessage.className =
                    "message error-message";

                return;

            }


            const order = {};


            selectedChoices.forEach(choice => {

                const menuId =
                    choice.dataset.menuId;

                const option =
                    choice.dataset.option;


                if (!order[menuId]) {

                    order[menuId] = {
                        dining: false,
                        takeaway: false
                    };

                }


                order[menuId][option] = true;

            });


            const noSoup =
                document
                    .getElementById("noSoup")
                    ?.checked || false;


            const employee =
                localStorage.getItem(
                    "loggedEmployee"
                )
                || document.getElementById(
                    "employeeSelect"
                ).value;


            console.log({
                employee,
                order,
                noSoup
            });


            orderMessage.textContent =
                "Objednávka je pripravená na uloženie.";

            orderMessage.className =
                "message success-message";

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
