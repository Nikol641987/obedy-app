// =====================================
// OBEDY TMV
// Kompletný script.js
// =====================================

// =====================================
// AKTUÁLNE VYBRANÝ DEŇ OBJEDNÁVKY
// =====================================

let selectedOrderDate = null;
document.addEventListener("DOMContentLoaded", async () => {

    await loadEmployees();
    
    updatePermissions();

    setupNavigation();
    setupLogin();
    setupOrderButton();
    setupManualIssue();
    setupChipLogin();
    setupChipIssue();

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
if (screenId === "loginScreen") {

    const chipInput =
        document.getElementById(
            "chipLoginInput"
        );

    if (chipInput) {

        chipInput.value = "";

        setTimeout(() => {
            chipInput.focus();
        }, 150);

    }

}
}


// =====================================
// AKTUÁLNE PRIHLÁSENÝ ZAMESTNANEC
// =====================================

function getCurrentEmployeeId() {

    return (
        sessionStorage.getItem("loggedEmployee")
        || localStorage.getItem("loggedEmployee")
        || ""
    );

}

function getCurrentUserRole() {

    const employeeId = getCurrentEmployeeId();

    const select = document.getElementById("employeeSelect");

    if (!select || !employeeId) {
        return "";
    }

    const option = [...select.options].find(
        option => option.value === employeeId
    );

    return option?.dataset?.role || "";
}
function updatePermissions() {

    const role = getCurrentUserRole();

    console.log("Aktuálna rola:", role);

    const openIssueButton =
        document.getElementById("openIssueButton");

    const openDashboardButton =
        document.getElementById("openDashboardButton");

    // Výdaj obedov vidí každý
    if (openIssueButton) {
        openIssueButton.hidden = false;
    }

    // Stav výdaja obedov vidí iba admin a issue
    if (openDashboardButton) {
        openDashboardButton.hidden =
            !(role === "admin" || role === "issue");
    }

}
// =====================================
// NAVIGÁCIA
// =====================================

function setupNavigation() {

    const backButtons =
    document.querySelectorAll(
        "[data-back-home]"
    );

backButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            showScreen("homeScreen");

        }
    );

});
    const openOrderButton =
        document.getElementById("openOrderButton");

    const openWeeklyMenuButton =
        document.getElementById("openWeeklyMenuButton");

    const openIssueButton =
        document.getElementById("openIssueButton");
    
    const openDashboardButton =
    document.getElementById("openDashboardButton");

    const openMyOrdersButton =
        document.getElementById("openMyOrdersButton");

    const openProfileButton =
        document.getElementById("openProfileButton");

    const logoutButton =
        document.getElementById("logoutButton");


    openOrderButton?.addEventListener(
        "click",
        () => {

            const employeeId =
                getCurrentEmployeeId();

            if (employeeId) {

               openWeekSelectionScreen(employeeId);

            } else {

                sessionStorage.setItem(
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
    async () => {

        showScreen("issueScreen");

        await renderIssueDashboard();

    }
);
openDashboardButton?.addEventListener(
    "click",
    async () => {

        showScreen("dashboardScreen");

        await renderIssueDashboard();

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

                sessionStorage.setItem(
                    "requestedScreen",
                    "myOrdersScreen"
                );

                showScreen("loginScreen");

            }

        }
    );


    openProfileButton?.addEventListener(
    "click",
    async () => {

        const employeeId =
            getCurrentEmployeeId();

        if (employeeId) {

            await loadProfile();
            showScreen("profileScreen");

        } else {

            sessionStorage.setItem(
                "requestedScreen",
                "profileScreen"
            );

            showScreen("loginScreen");

        }

    }
);

const changeEmailButton =
    document.getElementById(
        "changeEmailButton"
    );
const changePinButton = document.getElementById("changePinButton");
const pinModal = document.getElementById("pinModal");
const cancelPinButton = document.getElementById("cancelPinButton");
    
const emailModal =
    document.getElementById(
        "emailModal"
    );

const cancelEmailButton =
    document.getElementById(
        "cancelEmailButton"
    );

changeEmailButton?.addEventListener(
    "click",
    () => {

        document.getElementById(
            "newEmailInput"
        ).value = "";

        emailModal.hidden = false;

    }
);

    changePinButton?.addEventListener("click", () => {
    document.getElementById("newPinInput").value = "";
    pinModal.hidden = false;
});

cancelPinButton?.addEventListener("click", () => {
    pinModal.hidden = true;
});
cancelEmailButton?.addEventListener(
    "click",
    () => {

        emailModal.hidden = true;

    }
);
  

const savePinButton =
    document.getElementById("savePinButton");

savePinButton?.addEventListener("click", () => {

    const newPin =
        document.getElementById("newPinInput").value.trim();

    if (!/^\d{4}$/.test(newPin)) {

        alert("PIN musí mať presne 4 číslice.");

        return;
    }

    let employeeId =
        getCurrentEmployeeId();

    if (!employeeId) {

        employeeId =
            sessionStorage.getItem(
                "pinResetEmployeeId"
            );
    }

    if (!employeeId) {

        alert("Nepodarilo sa zistiť zamestnanca.");

        return;
    }

    localStorage.setItem(
        `pin_${employeeId}`,
        newPin
    );

    pinModal.hidden = true;

    sessionStorage.removeItem(
        "pinResetCode"
    );

    sessionStorage.removeItem(
        "pinResetEmployeeId"
    );

    showScreen("loginScreen");

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    if (loginMessage) {

        loginMessage.textContent =
            "✅ PIN bol úspešne zmenený. Teraz sa môžete prihlásiť.";

        loginMessage.className =
            "message success-message";
    }

});
    const saveEmailButton =
    document.getElementById(
        "saveEmailButton"
    );

saveEmailButton?.addEventListener(
    "click",
    async () => {

        const email =
            document.getElementById(
                "newEmailInput"
            ).value.trim();

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {

            alert(
                "Zadajte platný e-mail."
            );

            return;
        }

        const employeeId =
            sessionStorage.getItem(
                "loggedEmployee"
            )
            || localStorage.getItem(
                "loggedEmployee"
            );

        if (!employeeId) {
            return;
        }

        const [surname, name] =
            employeeId.split("_");

        const { error } =
            await supabaseClient
                .from("employees")
                .update({
                    email: email
                })
                .eq(
                    "surname",
                    surname
                )
                .eq(
                    "name",
                    name
                );

        if (error) {

            console.error(
                "Chyba pri ukladaní e-mailu:",
                error
            );

            alert(
                "E-mail sa nepodarilo uložiť."
            );

            return;
        }

        emailModal.hidden = true;

        alert(
            "E-mail bol uložený."
        );

        loadProfile();

    }
);
    const verifyResetCodeButton =
    document.getElementById(
        "verifyResetCodeButton"
    );

const cancelResetPinButton =
    document.getElementById(
        "cancelResetPinButton"
    );

verifyResetCodeButton?.addEventListener(
    "click",
    () => {

        const resetCodeInput =
            document.getElementById(
                "resetCodeInput"
            );

        const resetCodeError =
            document.getElementById(
                "resetCodeError"
            );

        const enteredCode =
            resetCodeInput.value.trim();

        const correctCode =
            sessionStorage.getItem(
                "pinResetCode"
            );

        if (!enteredCode) {

            resetCodeError.textContent =
                "Zadajte overovací kód.";

            return;
        }

        if (enteredCode !== correctCode) {

            resetCodeError.textContent =
                "Zadaný overovací kód nie je správny.";

            return;
        }

       resetCodeError.textContent = "";

document.getElementById("resetPinModal").hidden = true;

document.getElementById("newPinInput").value = "";

document.getElementById("pinModal").hidden = false;

    }
);

cancelResetPinButton?.addEventListener(
    "click",
    () => {

        const resetPinModal =
            document.getElementById(
                "resetPinModal"
            );

        resetPinModal.hidden = true;

        sessionStorage.removeItem(
            "pinResetCode"
        );

        sessionStorage.removeItem(
            "pinResetEmployeeId"
        );

    }
);
    logoutButton?.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                "loggedEmployee"
            );

            localStorage.removeItem(
                "loggedEmployee"
            );

            sessionStorage.removeItem(
                "requestedScreen"
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

            if (select) {
                select.value = "";
            }

            if (pinInput) {
                pinInput.value = "";
            }

            if (pinConfirm) {
                pinConfirm.value = "";
            }

            if (pinConfirmWrapper) {
                pinConfirmWrapper.hidden = true;
            }

            if (rememberMe) {
                rememberMe.checked = false;
            }

            clearLoginMessage();
            showScreen("homeScreen");
            updatePermissions();

        }
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
            option.dataset.role =
    employee.role || "";


            select.appendChild(option);

        });


        const currentEmployee =
            getCurrentEmployeeId();

        const persistentEmployee =
            localStorage.getItem(
                "loggedEmployee"
            );


        if (
            currentEmployee
            && hasEmployeeOption(
                select,
                currentEmployee
            )
        ) {

            select.value =
                currentEmployee;

        } else {

            select.value = "";

        }


        const rememberMe =
            document.getElementById(
                "rememberMe"
            );

        if (rememberMe) {

            rememberMe.checked =
                Boolean(persistentEmployee);

        }


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
    
const forgotPinButton = document.getElementById("forgotPinButton");
    
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
    forgotPinButton?.addEventListener(
    "click",
    forgotPin
);


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


            // PIN sa vytvára iba prvýkrát
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

                // Pri ďalšom prihlásení zadá PIN iba raz
                if (pin !== savedPin) {

                    showLoginError(
                        "Nesprávny PIN."
                    );

                    return;

                }

            }


            // Prihlásenie počas otvorenej karty
            sessionStorage.setItem(
                "loggedEmployee",
                employeeId
            );

            updatePermissions();

            // Dlhodobé prihlásenie iba pri zaškrtnutí
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
                sessionStorage.getItem(
                    "requestedScreen"
                )
                || "orderScreen";


            sessionStorage.removeItem(
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

} else if (
    requestedScreen ===
    "profileScreen"
) {

    loadProfile().then(() => {

        showScreen(
            "profileScreen"
        );

    });

} else {

    showScreen(
        requestedScreen
    );

}

        }
    );
    }
async function forgotPin() {

    const select =
        document.getElementById(
            "employeeSelect"
        );

    if (!select || !select.value) {

        showLoginError(
            "Najprv vyberte zamestnanca."
        );

        return;
    }

    const selectedOption =
        select.options[
            select.selectedIndex
        ];

    const name =
        selectedOption.dataset.name;

    const surname =
        selectedOption.dataset.surname;

    if (!name || !surname) {

        showLoginError(
            "Údaje zamestnanca sa nepodarilo načítať."
        );

        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("employees")
                .select("email")
                .eq("name", name)
                .eq("surname", surname)
                .single();

        if (error) {
            throw error;
        }

        if (!data?.email) {

            alert(
                "Pre tento účet nie je uložená e-mailová adresa na obnovu PIN-u.\n\nPo prihlásení si ju doplň vo svojom profile, aby si si v prípade zabudnutého PIN-u mohol(a) jednoducho nastaviť nový."
            );

            return;
        }

       const code =
    Math.floor(
        100000 + Math.random() * 900000
    ).toString();

sessionStorage.setItem(
    "pinResetCode",
    code
);

const { error: functionError } =
    await supabaseClient.functions.invoke(
        "send-pin-code",
        {
            body: {
                email: data.email,
                code: code
            }
        }
    );
        
console.log("Kód:", code);
console.log("Function error:", functionError);
        
if (functionError) {

    console.error(functionError);

    alert(
        "E-mail sa nepodarilo odoslať."
    );

    return;
}

sessionStorage.setItem(
    "pinResetEmployeeId",
    select.value
);

const resetPinModal =
    document.getElementById(
        "resetPinModal"
    );

const resetPinText =
    document.getElementById(
        "resetPinText"
    );

const resetCodeInput =
    document.getElementById(
        "resetCodeInput"
    );

const resetCodeError =
    document.getElementById(
        "resetCodeError"
    );

if (
    !resetPinModal
    || !resetPinText
    || !resetCodeInput
    || !resetCodeError
) {
    alert(
        "Okno na obnovu PIN-u sa nepodarilo otvoriť."
    );
    return;
}

resetPinText.textContent =
    "Na e-mail " +
    data.email +
    " sme poslali 6-miestny overovací kód.";

resetCodeInput.value = "";
resetCodeError.textContent = "";
resetPinModal.hidden = false;

setTimeout(() => {
    resetCodeInput.focus();
}, 100);
    } catch (error) {

        console.error(
            "Chyba pri obnove PIN-u:",
            error
        );

        alert(
            "E-mailovú adresu sa nepodarilo overiť."
        );
    }
}
async function loadProfile() {

    const profileFullName =
        document.getElementById(
            "profileFullName"
        );

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    if (
        !profileFullName
        || !profileEmail
    ) {
        return;
    }


    const employeeId =
        sessionStorage.getItem(
            "loggedEmployee"
        )
        || localStorage.getItem(
            "loggedEmployee"
        );


    if (!employeeId) {

        profileFullName.textContent = "-";
        profileEmail.textContent = "-";

        return;
    }


    try {
        const [surname, name] =
    employeeId.split("_");

        const { data, error } =
            await supabaseClient
                .from("employees")
                .select(
                    "name, surname, email"
                )
                .eq(
    "surname",
    surname
)
.eq(
    "name",
    name
)
                .single();


        if (error) {
            throw error;
        }


        const fullName =
            [
                data?.name,
                data?.surname
            ]
                .filter(Boolean)
                .join(" ");


        profileFullName.textContent =
            fullName || "-";

        profileEmail.textContent =
            data?.email || "E-mail nie je zadaný";


    } catch (error) {

        console.error(
            "Chyba pri načítaní profilu:",
            error
        );

        profileFullName.textContent =
            "Profil sa nepodarilo načítať";

        profileEmail.textContent = "-";

    }

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
// VÝBER DŇA OBJEDNÁVKY
// =====================================

// =====================================
// VÝBER DŇA OBJEDNÁVKY
// =====================================

async function openWeekSelectionScreen(employeeId) {

    sessionStorage.setItem(
        "loggedEmployee",
        employeeId
    );

    const weekCards =
        document.getElementById(
            "weekCards"
        );

    const weekTitle =
        document.getElementById(
            "weekTitle"
        );

    if (!weekCards || !weekTitle) {
        return;
    }

    const now =
        new Date();

    const currentDay =
        now.getDay();

    const isFridayAfterNoon =
        currentDay === 5
        && now.getHours() >= 12;

    const monday =
        new Date(now);

    const daysFromMonday =
        currentDay === 0
            ? -6
            : 1 - currentDay;

    monday.setDate(
        now.getDate()
        + daysFromMonday
        + (isFridayAfterNoon ? 7 : 0)
    );

    monday.setHours(
        12,
        0,
        0,
        0
    );

    const friday =
        new Date(monday);

    friday.setDate(
        monday.getDate() + 4
    );

    const mondayForDatabase =
        formatDateForDatabase(monday);

    const fridayForDatabase =
        formatDateForDatabase(friday);

    weekTitle.textContent =
        `Týždeň ${formatShortDate(monday)} – ${formatShortDate(friday)}`;

    weekCards.innerHTML = `
        <div class="week-loading">
            Načítavam objednávky...
        </div>
    `;

    showScreen(
        "weekSelectionScreen"
    );

    let weeklyOrders = [];

    try {

        const { data, error } =
            await supabaseClient
                .from("meal_orders")
                .select(
                    "order_date, menu_id, menu_name, dining, takeaway, no_soup, issued"
                )
                .eq(
                    "employee_id",
                    employeeId
                )
                .gte(
                    "order_date",
                    mondayForDatabase
                )
                .lte(
                    "order_date",
                    fridayForDatabase
                )
                .order(
                    "order_date",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        weeklyOrders =
            data || [];

    } catch (error) {

        console.error(
            "Chyba pri načítaní týždenných objednávok:",
            error
        );

        weekCards.innerHTML = `
            <div class="message error">
                Objednávky sa nepodarilo načítať.
            </div>
        `;

        return;
    }

    const ordersByDate = {};

    weeklyOrders.forEach(order => {

        if (!ordersByDate[order.order_date]) {
            ordersByDate[order.order_date] = [];
        }

        ordersByDate[order.order_date].push(
            order
        );
    });

    const weekdays = [
        "Pondelok",
        "Utorok",
        "Streda",
        "Štvrtok",
        "Piatok"
    ];

    weekCards.innerHTML = "";

    weekdays.forEach(
        (weekday, index) => {

            const date =
                new Date(monday);

            date.setDate(
                monday.getDate() + index
            );

            const dateForDatabase =
                formatDateForDatabase(date);

            const dayOrders =
                ordersByDate[dateForDatabase]
                || [];

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "week-card";

            card.dataset.date =
                dateForDatabase;

            const heading =
                document.createElement(
                    "h3"
                );

            heading.textContent =
                weekday;

            const dateElement =
                document.createElement(
                    "div"
                );

            dateElement.className =
                "date";

            dateElement.textContent =
                formatShortDate(date);

            card.appendChild(
                heading
            );

            card.appendChild(
                dateElement
            );

            if (dayOrders.length === 0) {

                const status =
                    document.createElement(
                        "div"
                    );

                status.className =
                    "status not-ordered";

                status.textContent =
                    "⚪ Neobjednané";

                card.appendChild(
                    status
                );

            } else {

                const orderDetails =
                    document.createElement(
                        "div"
                    );

                orderDetails.className =
                    "week-order-details";

                dayOrders.forEach(order => {

                    const meal =
                        document.createElement(
                            "div"
                        );

                    meal.className =
                        "week-order-meal";

                    const menuName =
                        order.menu_name
                        || `Menu ${order.menu_id}`;

                    let servingType = "";

                    if (order.takeaway) {

                        servingType =
                            " 📦 Zabaliť";

                  } else if (order.dining) {

    servingType =
        " 🍽️ V jedálni";

}

                    meal.textContent =
                        `${menuName}${servingType}`;

                    orderDetails.appendChild(
                        meal
                    );
                });

                const hasNoSoup =
                    dayOrders.some(
                        order =>
                            Boolean(
                                order.no_soup
                            )
                    );

                if (hasNoSoup) {

                    const soup =
                        document.createElement(
                            "div"
                        );

                    soup.className =
                        "week-order-soup";

                    soup.textContent =
                        "🥣 Bez polievky";

                    orderDetails.appendChild(
                        soup
                    );
                }

                const status =
                    document.createElement(
                        "div"
                    );

                status.className =
                    "status ordered";

                status.textContent =
                    "🟢 Objednané";

                card.appendChild(
                    orderDetails
                );

                card.appendChild(
                    status
                );
            }

            card.addEventListener(
                "click",
                () => {

                    selectedOrderDate =
                        dateForDatabase;

                    openOrderScreen(
                        employeeId
                    );
                }
            );

            weekCards.appendChild(
                card
            );
        }
    );
}
// =====================================
// OTVORENIE OBJEDNÁVKY
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

    await checkTodayOrder(
        employeeId
    );

}


// =====================================
// KONTROLA DNEŠNEJ OBJEDNÁVKY
// =====================================

async function checkTodayOrder(
    employeeId
) {

    const today =
    getOrderDate();

    const orderMessage =
        document.getElementById(
            "orderMessage"
        );

    const confirmOrderButton =
        document.getElementById(
            "confirmOrderButton"
        );

    const noSoup =
        document.getElementById(
            "noSoup"
        );

    const orderIntroText =
        document.getElementById(
            "orderIntroText"
        );


    document
        .querySelectorAll(
            ".meal-choice"
        )
        .forEach(choice => {

            choice.checked = false;
            choice.disabled = false;

        });


    if (noSoup) {

        noSoup.checked = false;
        noSoup.disabled = false;

    }


    if (confirmOrderButton) {

        confirmOrderButton.disabled =
            false;

        confirmOrderButton.textContent =
            "Potvrdiť objednávku";

        delete confirmOrderButton
            .dataset.edit;

    }


    if (orderMessage) {

        orderMessage.textContent = "";

        orderMessage.className =
            "message";

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


        const now =
            new Date();

        const deadline =
            new Date();

        deadline.setHours(
            16,
            30,
            0,
            0
        );

        const canEdit =
            now < deadline;


        // Dnes nemá objednávku
        if (
            !data
            || data.length === 0
        ) {

            if (orderIntroText) {

                orderIntroText.textContent =
                    canEdit

                        ? "🍽️ Dnes ešte nemáš objednaný obed. Objednať si ho môžeš do 8:30."

                        : "⏰ Dnes nemáš objednaný obed. Objednávky sú už uzavreté.";


                orderIntroText.style.color =
                    canEdit
                        ? "#d97706"
                        : "#b42318";

                orderIntroText.style.fontWeight =
                    "700";

                orderIntroText.style.fontSize =
                    "1.05rem";

            }


            if (!canEdit) {

                document
                    .querySelectorAll(
                        ".meal-choice"
                    )
                    .forEach(choice => {

                        choice.disabled = true;

                    });


                if (noSoup) {
                    noSoup.disabled = true;
                }


                if (confirmOrderButton) {

                    confirmOrderButton.disabled =
                        true;

                    confirmOrderButton.textContent =
                        "Objednávky sú uzavreté";

                }

            }


            return;

        }


        // Dnes už objednávku má
        if (orderIntroText) {

            orderIntroText.textContent =
                canEdit

                    ? "✅ Dnešný obed máš úspešne objednaný. Do 8:30 môžeš objednávku ešte upraviť."

                    : "🔒 Dnešný obed máš úspešne objednaný. Objednávku už nie je možné upraviť.";


            orderIntroText.style.color =
                canEdit
                    ? "#16803c"
                    : "#2563eb";

            orderIntroText.style.fontWeight =
                "700";

            orderIntroText.style.fontSize =
                "1.05rem";

        }


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
                    Boolean(
                        item.dining
                    );

            }


            if (takeawayChoice) {

                takeawayChoice.checked =
                    Boolean(
                        item.takeaway
                    );

            }

        });


        if (noSoup) {

            noSoup.checked =
                data.some(
                    item =>
                        Boolean(
                            item.no_soup
                        )
                );

        }


        if (confirmOrderButton) {

            if (canEdit) {

                confirmOrderButton.disabled =
                    false;

                confirmOrderButton.textContent =
                    "Uložiť zmeny";

                confirmOrderButton.dataset.edit =
                    "true";

            } else {

                confirmOrderButton.disabled =
                    true;

                confirmOrderButton.textContent =
                    "Objednávky sú uzavreté";

            }

        }


        if (!canEdit) {

            document
                .querySelectorAll(
                    ".meal-choice"
                )
                .forEach(choice => {

                    choice.disabled = true;

                });


            if (noSoup) {
                noSoup.disabled = true;
            }

        }


    } catch (error) {

        console.error(
            "Chyba pri kontrole dnešnej objednávky:",
            error
        );


        if (orderIntroText) {

            orderIntroText.textContent =
                "Dnešnú objednávku sa nepodarilo načítať.";

            orderIntroText.style.color =
                "#b42318";

            orderIntroText.style.fontWeight =
                "700";

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

    const orderDate =
        getOrderDate();

    const date =
        new Date(
            `${orderDate}T12:00:00`
        );

    currentDate.textContent =
        date.toLocaleDateString(
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
// ULOŽENIE OBJEDNÁVKY
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

            const orderMessage =
                document.getElementById(
                    "orderMessage"
                );

            const selectedChoices =
                document.querySelectorAll(
                    ".meal-choice:checked"
                );


            if (
                selectedChoices.length === 0
            ) {

                if (orderMessage) {

                    orderMessage.textContent =
                        "Vyberte aspoň jeden obed.";

                    orderMessage.className =
                        "message error-message";

                }

                return;

            }


            const employeeId =
                getCurrentEmployeeId();


            if (!employeeId) {

                if (orderMessage) {

                    orderMessage.textContent =
                        "Najprv sa prihláste.";

                    orderMessage.className =
                        "message error-message";

                }

                return;

            }


            const employeeSelect =
                document.getElementById(
                    "employeeSelect"
                );

            const selectedEmployee =
                [...employeeSelect.options]
                    .find(
                        option =>
                            option.value === employeeId
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
    getOrderDate();

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


            confirmOrderButton.disabled =
                true;

            confirmOrderButton.textContent =
                "Ukladám objednávku...";


            if (orderMessage) {

                orderMessage.textContent = "";

                orderMessage.className =
                    "message";

            }


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


                const isEdit =
    confirmOrderButton.dataset.edit === "true";

const orderSuccessModal =
    document.getElementById("orderSuccessModal");



const orderSuccessText =
    document.getElementById("orderSuccessText");

if (orderSuccessModal && orderSuccessText) {

    orderSuccessText.textContent =
        isEdit
            ? "Objednávka bola úspešne upravená."
            : "Objednávka bola úspešne uložená.";

    orderSuccessModal.hidden = false;

}

setTimeout(() => {

    if (orderSuccessModal) {
        orderSuccessModal.hidden = true;
    }

    showScreen("homeScreen");

}, 4000);


            } catch (error) {

                console.error(
                    "Chyba pri ukladaní objednávky:",
                    error
                );


                const errorText =
                    error?.message
                    || error?.details
                    || JSON.stringify(
                        error
                    );


                if (orderMessage) {

                    orderMessage.textContent =
                        `Chyba: ${errorText}`;

                    orderMessage.className =
                        "message error-message";

                }


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

function formatDateForDatabase(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

function formatShortDate(date) {

    return date.toLocaleDateString(
        "sk-SK",
        {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        }
    );

}
function getOrderDate() {

    return selectedOrderDate || getTodayDate();

}
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
function setupManualIssue() {

    const noChipButton =
        document.getElementById(
            "noChipButton"
        );

    const manualIssueBox =
        document.getElementById(
            "manualIssueBox"
        );

    const issueEmployeeSelect =
        document.getElementById(
            "issueEmployeeSelect"
        );

    const issueManualButton =
        document.getElementById(
            "issueManualButton"
        );

    const employeeSelect =
        document.getElementById(
            "employeeSelect"
        );

    const issueMessage =
        document.getElementById(
            "issueMessage"
        );


    if (
        !noChipButton
        || !manualIssueBox
        || !issueEmployeeSelect
        || !issueManualButton
        || !employeeSelect
        || !issueMessage
    ) {
        return;
    }


    issueEmployeeSelect.innerHTML =
        employeeSelect.innerHTML;


    noChipButton.addEventListener(
        "click",
        () => {

            manualIssueBox.hidden =
                !manualIssueBox.hidden;

            noChipButton.textContent =
                manualIssueBox.hidden
                    ? "Nemám čip"
                    : "Skryť výber zamestnanca";

        }
    );


    issueManualButton.addEventListener(
        "click",
        async () => {

            const employeeId =
                issueEmployeeSelect.value;


            if (!employeeId) {

                issueMessage.textContent =
                    "Vyberte zamestnanca.";

                issueMessage.className =
                    "message error-message";

                return;

            }


            issueManualButton.disabled = true;

            issueManualButton.textContent =
                "Kontrolujem objednávku...";

            issueMessage.textContent = "";

            issueMessage.className =
                "message";


            const today =
                getTodayDate();


            try {

                const { data, error } =
                    await supabaseClient
                        .from("meal_orders")
                        .select(
                            `
                            id,
                            menu_name,
                            dining,
                            takeaway,
                            issued
                            `
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


                if (
                    !data
                    || data.length === 0
                ) {

                    issueMessage.textContent =
                        "Tento zamestnanec dnes nemá objednaný obed.";

                    issueMessage.className =
                        "message error-message";

                    return;

                }


                const allIssued =
                    data.every(
                        item =>
                            Boolean(item.issued)
                    );


               if (allIssued) {

    const selectedOption =
        issueEmployeeSelect.options[
            issueEmployeeSelect.selectedIndex
        ];

    const employeeName =
        selectedOption?.textContent?.trim()
        || "Zamestnanec";

    const mealsText =
        data
            .map(item => {

                const methods = [];

                if (item.dining) {
                    methods.push("V jedálni");
                }

                if (item.takeaway) {
                    methods.push("Zabaliť");
                }

                return `${item.menu_name} – ${methods.join(" + ")}`;

            })
            .join("<br>");

    const issueResultModal =
        document.getElementById("issueResultModal");

    document.getElementById("issueResultIcon").textContent =
        "❌";

    document.getElementById("issueResultName").textContent =
        employeeName;

    document.getElementById("issueResultMeals").innerHTML =
        mealsText;

    document.getElementById("issueResultText").textContent =
        "Obed bol tomuto zamestnancovi už vydaný.";

    issueResultModal.hidden = false;

    setTimeout(() => {

        issueResultModal.hidden = true;

    }, 4000);

    return;

}


                const { error: updateError } =
                    await supabaseClient
                        .from("meal_orders")
                        .update({
                            issued: true
                        })
                        .eq(
                            "employee_id",
                            employeeId
                        )
                        .eq(
                            "order_date",
                            today
                        );


                if (updateError) {
                    throw updateError;
                }


                const selectedOption =
                    issueEmployeeSelect
                        .options[
                            issueEmployeeSelect
                                .selectedIndex
                        ];

                const employeeName =
                    selectedOption
                        ?.textContent
                        ?.trim()
                    || "Zamestnanec";


                const mealsText =
                    data
                        .map(item => {

                            const methods = [];

                            if (item.dining) {
                                methods.push(
                                    "V jedálni"
                                );
                            }

                            if (item.takeaway) {
                                methods.push(
                                    "Zabaliť"
                                );
                            }

                            return `${item.menu_name} – ${methods.join(" + ")}`;

                        })
                        .join(" | ");


  const issueResultModal =
    document.getElementById("issueResultModal");

document.getElementById("issueResultIcon").textContent =
    "✅";

document.getElementById("issueResultName").textContent =
    employeeName;

document.getElementById("issueResultMeals").innerHTML =
    mealsText.replaceAll(" | ", "<br>");

document.getElementById("issueResultText").textContent =
    "Obed bol úspešne vydaný.";

issueResultModal.hidden = false;

setTimeout(() => {

    issueResultModal.hidden = true;

}, 4000);



                setTimeout(
                    () => {

                        issueEmployeeSelect.value = "";

                        issueMessage.textContent = "";

                        issueMessage.className =
                            "message";

                        manualIssueBox.hidden = true;

                        noChipButton.textContent =
                            "Nemám čip";

                    },
                    4000
                );


            } catch (error) {

                console.error(
                    "Chyba pri výdaji obeda:",
                    error
                );

                issueMessage.textContent =
                    `Chyba: ${
                        error?.message
                        || "Obed sa nepodarilo vydať."
                    }`;

                issueMessage.className =
                    "message error-message";


          } finally {

    issueManualButton.disabled =
        false;

    issueManualButton.textContent =
        "Vydať obed";

}

        }
    );

}

function setupChipLogin() {
    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const employeeSelect =
        document.getElementById(
            "employeeSelect"
        );

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    const pinInput =
        document.getElementById(
            "pinInput"
        );

    const pinConfirm =
        document.getElementById(
            "pinConfirm"
        );


    if (
        !loginScreen
        || !employeeSelect
    ) {
        return;
    }


    let chipBuffer = "";
    let chipTimer = null;
    let processingChip = false;


    function normalizeChip(value) {

        return String(value || "")
            .trim()
            .replace(/\s+/g, "");

    }

    async function processChip(chipNumber) {

        if (
            processingChip
            || !chipNumber
        ) {
            return;
        }

        processingChip = true;


        const employeeOption =
            [...employeeSelect.options]
                .find(option => {

                    const savedChip =
                        normalizeChip(
                            option.dataset.chip
                        );

                    return (
                        savedChip
                        && savedChip === chipNumber
                    );

                });


        if (!employeeOption) {

            if (loginMessage) {

                loginMessage.textContent =
                    `Čip ${chipNumber} sa nenašiel v zozname zamestnancov.`;

                loginMessage.className =
                    "message error-message";

            }

            processingChip = false;
            return;

        }


        const employeeId =
            employeeOption.value;


        sessionStorage.setItem(
            "loggedEmployee",
            employeeId
        );

        employeeSelect.value =
            employeeId;
updatePermissions();

        if (loginMessage) {

            loginMessage.textContent =
                `Čip načítaný: ${employeeOption.textContent.trim()}`;

            loginMessage.className =
                "message success-message";

        }


        const requestedScreen =
            sessionStorage.getItem(
                "requestedScreen"
            )
            || "orderScreen";


        sessionStorage.removeItem(
            "requestedScreen"
        );


        if (
    requestedScreen ===
    "orderScreen"
) {

    await openOrderScreen(
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
        chipBuffer = "";
        processingChip = false;

    }


    document.addEventListener(
        "keydown",
        event => {

            // Čip snímame iba na prihlasovacej obrazovke
            if (loginScreen.hidden) {
                return;
            }

const resetCodeInput =
    document.getElementById("resetCodeInput");
            
            // Pri ručnom písaní PIN-u čítačku nesnímame
           if (
    document.activeElement === pinInput
    || document.activeElement === pinConfirm
    || document.activeElement === resetCodeInput
) {
    return;
}


            if (event.key === "Enter") {

                event.preventDefault();

                clearTimeout(chipTimer);

                const completedChip =
                    normalizeChip(chipBuffer);

                chipBuffer = "";

                processChip(
                    completedChip
                );

                return;

            }


            // Čítačka posiela číslice veľmi rýchlo
            if (/^\d$/.test(event.key)) {

                chipBuffer += event.key;

                clearTimeout(chipTimer);

                chipTimer = setTimeout(
                    () => {

                        const completedChip =
                            normalizeChip(
                                chipBuffer
                            );

                        chipBuffer = "";

                        // Aby sa obyčajný jeden stlačený kláves
                        // nepovažoval za RFID čip
                        if (
                            completedChip.length >= 6
                        ) {

                            processChip(
                                completedChip
                            );

                        }

                     },
                    800
                );

            }

        }
    );
    
    }

async function renderIssueDashboard() {

    const issueCards =
        document.getElementById("issueCards");

    const waitingCount =
        document.getElementById("waitingCount");

    const issuedCount =
        document.getElementById("issuedCount");

    const totalCount =
        document.getElementById("totalCount");


    if (
        !issueCards
        || !waitingCount
        || !issuedCount
        || !totalCount
    ) {
        return;
    }


    issueCards.innerHTML = `
        <p>Načítavam dnešné objednávky...</p>
    `;


    try {

        const today =
            getTodayDate();


        const { data, error } =
            await supabaseClient
                .from("meal_orders")
                .select(`
                    id,
                    employee_id,
                    employee_name,
                    menu_name,
                    dining,
                    takeaway,
                    issued
                `)
                .eq("order_date", today);


        if (error) {
            throw error;
        }


        const orders =
            data || [];


        const employeeOrders =
            new Map();


        orders.forEach(order => {

            const employeeKey =
                String(order.employee_id);


            if (!employeeOrders.has(employeeKey)) {

           employeeOrders.set(
    employeeKey,
    {
        employeeId: employeeKey,

        employeeName:
            order.employee_name
            || "Neznámy zamestnanec",

        orders: []
    }
);

            }


            employeeOrders
                .get(employeeKey)
                .orders
                .push(order);

        });


        const employees =
            [...employeeOrders.values()]
                .map(employee => {

                    const isIssued =
                        employee.orders.every(order =>
                            Boolean(order.issued)
                        );


                    return {
                        ...employee,
                        isIssued
                    };

                })
                .sort((a, b) => {

                    if (a.isIssued !== b.isIssued) {
                        return a.isIssued ? 1 : -1;
                    }

                    return a.employeeName.localeCompare(
                        b.employeeName,
                        "sk"
                    );

                });


        const waitingMeals =
    orders.filter(order =>
        !order.issued
    ).length;

const issuedMeals =
    orders.filter(order =>
        order.issued
    ).length;

waitingCount.textContent =
    waitingMeals;

issuedCount.textContent =
    issuedMeals;

totalCount.textContent =
    orders.length;


        if (employees.length === 0) {

            issueCards.innerHTML = `
                <p>
                    Na dnešný deň nie sú žiadne objednávky.
                </p>
            `;

            return;

        }


        issueCards.innerHTML =
            employees
                .map(employee => {

                    const mealsHtml =
                        employee.orders
                            .map(order => {

                                const methods = [];

                                if (order.dining) {
                                    methods.push("V jedálni");
                                }

                                if (order.takeaway) {
                                    methods.push("Zabaliť");
                                }


                                const methodText =
                                    methods.length > 0
                                        ? methods.join(" + ")
                                        : "Spôsob výdaja neuvedený";


                                return `
                                    <div class="issue-meal-row">

                                        <div class="issue-menu">
                                            🍽️ ${escapeHtml(
                                                order.menu_name
                                                || "Obed"
                                            )}
                                        </div>

                                        <div class="issue-type">
                                            ${
                                                order.takeaway
                                                    ? "📦"
                                                    : "🍴"
                                            }
                                            ${escapeHtml(methodText)}
                                        </div>

                                    </div>
                                `;

                            })
                            .join("");


                    return `
                        <div class="issue-item ${
                            employee.isIssued
                                ? "issued"
                                : "waiting"
                        }">

                            <div class="issue-name">
                                ${escapeHtml(
                                    employee.employeeName
                                )}
                            </div>

                            ${mealsHtml}

                            <div class="issue-status">
                                ${
                                    employee.isIssued
                                        ? "🔴 Vydané"
                                        : "🟢 Čaká"
                                }
                            </div>
                            ${
    !employee.isIssued
        ? `
            <button
                type="button"
                class="manual-issue-card-button"
                data-employee-id="${escapeHtml(employee.employeeId)}"
            >
                ✅ Vydať osobne
            </button>
        `
        : ""
}

                        </div>
                    `;

                })
                .join("");
issueCards
    .querySelectorAll(".manual-issue-card-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const employeeId =
                    button.dataset.employeeId;

                if (!employeeId) return;

                button.disabled = true;
                button.textContent = "Vydávam...";

                try {

                    const { error } =
                        await supabaseClient
                            .from("meal_orders")
                            .update({
                                issued: true
                            })
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

                    await renderIssueDashboard();

                } catch (error) {

                    console.error(
                        "Chyba pri osobnom výdaji:",
                        error
                    );

                    button.disabled = false;
                    button.textContent =
                        "✅ Vydať osobne";

                    alert(
                        "Obed sa nepodarilo označiť ako vydaný."
                    );
                }

            }
        );

    });

    } catch (error) {

        console.error(
            "Chyba pri načítaní dashboardu:",
            error
        );


        waitingCount.textContent = "0";
        issuedCount.textContent = "0";
        totalCount.textContent = "0";


        issueCards.innerHTML = `
            <p class="error-message">
                Dashboard sa nepodarilo načítať.
            </p>
        `;

    }
    
    }

function setupChipIssue() {

    const issueScreen =
        document.getElementById(
            "issueScreen"
        );

    const employeeSelect =
        document.getElementById(
            "employeeSelect"
        );

    const issueMessage =
        document.getElementById(
            "issueMessage"
        );

    if (
        !issueScreen
        || !employeeSelect
        || !issueMessage
    ) {
        return;
    }

    let chipBuffer = "";
    let chipTimer = null;
    let processingChip = false;


    function normalizeChip(value) {

        return String(value || "")
            .trim()
            .replace(/\s+/g, "");

    }
    async function issueByChip(
        chipNumber
    ) {

        if (
            processingChip
            || !chipNumber
        ) {
            return;
        }

        processingChip = true;


        const employeeOption =
            [...employeeSelect.options]
                .find(option => {

                    const savedChip =
                        normalizeChip(
                            option.dataset.chip
                        );

                    return (
                        savedChip
                        && savedChip === chipNumber
                    );

                });


        if (!employeeOption) {

            issueMessage.textContent =
                `Čip ${chipNumber} sa nenašiel v zozname zamestnancov.`;

            issueMessage.className =
                "message error-message";

            processingChip = false;

            return;

        }


        const employeeId =
            employeeOption.value;

        const employeeName =
            employeeOption.textContent.trim();

        const today =
            getTodayDate();


        try {

            const { data, error } =
                await supabaseClient
                    .from("meal_orders")
                    .select(
                        `
                        id,
                        menu_name,
                        dining,
                        takeaway,
                        issued
                        `
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


            if (
                !data
                || data.length === 0
            ) {

                issueMessage.innerHTML = `
                    <strong>❌ ${escapeHtml(employeeName)}</strong><br><br>
                    Tento zamestnanec dnes nemá objednaný obed.
                `;

                issueMessage.className =
                    "message error-message";

                processingChip = false;

                return;

            }


            const allIssued =
                data.every(
                    item =>
                        Boolean(item.issued)
                );


            if (allIssued) {

    const mealsHtml =
        data
            .map(item => {

                const methods = [];

                if (item.dining) {
                    methods.push("V jedálni");
                }

                if (item.takeaway) {
                    methods.push("Zabaliť");
                }

                return `
                    <div>
                        <strong>${escapeHtml(item.menu_name)}</strong>
                        – ${escapeHtml(methods.join(" + "))}
                    </div>
                `;

            })
            .join("");

    const issueResultModal =
        document.getElementById("issueResultModal");

    document.getElementById("issueResultIcon").textContent =
        "❌";

    document.getElementById("issueResultName").textContent =
        employeeName;

    document.getElementById("issueResultMeals").innerHTML =
        mealsHtml;

    document.getElementById("issueResultText").textContent =
        "Obed bol tomuto zamestnancovi už vydaný.";

    issueResultModal.hidden = false;

    setTimeout(() => {

        issueResultModal.hidden = true;

    }, 4000);

    processingChip = false;

    return;

}

            const { error: updateError } =
                await supabaseClient
                    .from("meal_orders")
                    .update({
                        issued: true
                    })
                    .eq(
                        "employee_id",
                        employeeId
                    )
                    .eq(
                        "order_date",
                        today
                    );


            if (updateError) {
                throw updateError;
            }


            const mealsHtml =
                data
                    .map(item => {

                        const methods = [];

                        if (item.dining) {
                            methods.push(
                                "V jedálni"
                            );
                        }

                        if (item.takeaway) {
                            methods.push(
                                "Zabaliť"
                            );
                        }

                        return `
                            <div>
                                <strong>
                                    ${escapeHtml(item.menu_name)}
                                </strong>
                                – ${escapeHtml(methods.join(" + "))}
                            </div>
                        `;

                    })
                    .join("");


            const issueResultModal =
    document.getElementById("issueResultModal");

document.getElementById("issueResultIcon").textContent = "✅";

document.getElementById("issueResultName").textContent =
    employeeName;

document.getElementById("issueResultMeals").innerHTML =
    mealsHtml;

document.getElementById("issueResultText").textContent =
    "Obed bol úspešne vydaný.";

issueResultModal.hidden = false;

await renderIssueDashboard();

setTimeout(() => {

    issueResultModal.hidden = true;

}, 4000);

        } catch (error) {

            console.error(
                "Chyba pri výdaji čipom:",
                error
            );

            issueMessage.textContent =
                `Chyba: ${
                    error?.message
                    || "Obed sa nepodarilo vydať."
                }`;

            issueMessage.className =
                "message error-message";

        } finally {

            chipBuffer = "";
            processingChip = false;

        }

    }


    document.addEventListener(
        "keydown",
        event => {

            // Čip načítavame iba na obrazovke Výdaj obedov
            if (issueScreen.hidden) {
                return;
            }


            if (event.key === "Enter") {

                event.preventDefault();

                clearTimeout(chipTimer);

                const completedChip =
                    normalizeChip(
                        chipBuffer
                    );

                chipBuffer = "";

                issueByChip(
                    completedChip
                );

                return;

            }


            if (/^\d$/.test(event.key)) {

                chipBuffer += event.key;

                clearTimeout(chipTimer);

                chipTimer = setTimeout(
                    () => {

                        const completedChip =
                            normalizeChip(
                                chipBuffer
                            );

                        chipBuffer = "";

                        if (
                            completedChip.length >= 6
                        ) {

                            issueByChip(
                                completedChip
                            );

                        }

                    },
                    800
                );

            }

        }
    );

}

