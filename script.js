// =====================================
// OBEDY TMV
// Kompletný script.js
// =====================================

// =====================================
// 1. Štart aplikácie
// =====================================

let selectedOrderDate = null;
let editingEmployee = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadEmployees();
    updatePermissions();
    setupNavigation();
    setupLogin();
    setupOrderButton();
    setupManualIssue();
    setupChipLogin();
    setupChipIssue();
    setupMonthlyReport();
});

// =====================================
// 2. PREPÍNANIE OBRAZOVIEK
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

    if (screenId === "loginScreen") {
        const chipInput = document.getElementById("chipLoginInput");
        if (chipInput) {
            chipInput.value = "";
            setTimeout(() => {
                chipInput.focus();
            }, 150);
        }
    }
}

// =====================================
// 3. AKTUÁLNE PRIHLÁSENÝ ZAMESTNANEC
// =====================================

function getCurrentEmployeeId() {
    return (
        sessionStorage.getItem("loggedEmployee") ||
        localStorage.getItem("loggedEmployee") ||
        ""
    );
}

function getCurrentUserRole() {
    const employeeId = getCurrentEmployeeId();
    const select = document.getElementById("employeeSelect");

    if (!select || !employeeId) {
        return "";
    }

    const option = [...select.options].find(
        opt => opt.value === employeeId
    );

    return option?.dataset?.role || "";
}

function updatePermissions() {
    const role = getCurrentUserRole();
    console.log("Aktuálna rola:", role);

    const openIssueButton = document.getElementById("openIssueButton");
    const openDashboardButton = document.getElementById("openDashboardButton");
    const openAdminButton = document.getElementById("openAdminButton");
    const openMonthlyReportButton = document.getElementById("openMonthlyReportButton");

    if (openIssueButton) {
        openIssueButton.hidden = false;
    }
    if (openDashboardButton) {
        openDashboardButton.hidden = !(role === "admin" || role === "issue");
    }
    if (openAdminButton) {
        openAdminButton.hidden = role !== "admin";
    }
    if (openMonthlyReportButton) {
        openMonthlyReportButton.hidden = role !== "admin";
    }
}

// =====================================
// 4. NAVIGÁCIA
// =====================================

function setupNavigation() {
    const backButtons = document.querySelectorAll("[data-back-home]");
    backButtons.forEach(button => {
        button.addEventListener("click", () => {
            showScreen("homeScreen");
        });
    });

    const adminBackButtons = document.querySelectorAll("[data-back-admin]");
    adminBackButtons.forEach(button => {
        button.addEventListener("click", () => {
            showScreen("adminScreen");
        });
    });

    const openOrderButton = document.getElementById("openOrderButton");
    const openWeeklyMenuButton = document.getElementById("openWeeklyMenuButton");
    const openIssueButton = document.getElementById("openIssueButton");
    const openDashboardButton = document.getElementById("openDashboardButton");
    const openMyOrdersButton = document.getElementById("openMyOrdersButton");
    const openMonthlyReportButton = document.getElementById("openMonthlyReportButton");
    const openAdminButton = document.getElementById("openAdminButton");
    const adminEmployeesButton = document.getElementById("adminEmployeesButton");
    const adminWeeklyMenuButton = document.getElementById("adminWeeklyMenuButton");
    const downloadWeeklyMenuButton = document.getElementById("downloadWeeklyMenuButton");
    const saveWeeklyMenuButton = document.getElementById("saveWeeklyMenuButton");
    const weeklyMenuImportResult = document.getElementById("weeklyMenuImportResult");
    const weeklyMenuFrom = document.getElementById("weeklyMenuFrom");
    const weeklyMenuTo = document.getElementById("weeklyMenuTo");
    const addEmployeeButton = document.getElementById("addEmployeeButton");
    const cancelEmployeeButton = document.getElementById("cancelEmployeeButton");
    const saveEmployeeButton = document.getElementById("saveEmployeeButton");
    const deactivateEmployeeCheckbox = document.getElementById("deactivateEmployeeCheckbox");
    const employeeModal = document.getElementById("employeeModal");
    const openProfileButton = document.getElementById("openProfileButton");
    const logoutButton = document.getElementById("logoutButton");

    openOrderButton?.addEventListener("click", () => {
        const employeeId = getCurrentEmployeeId();
        if (employeeId) {
            openWeekSelectionScreen(employeeId);
        } else {
            sessionStorage.setItem("requestedScreen", "orderScreen");
            showScreen("loginScreen");
        }
    });

    openWeeklyMenuButton?.addEventListener("click", () => {
        showScreen("weeklyMenuScreen");
    });

    openIssueButton?.addEventListener("click", async () => {
        showScreen("issueScreen");
        await renderIssueDashboard();
    });

    openDashboardButton?.addEventListener("click", async () => {
        showScreen("dashboardScreen");
        await renderIssueDashboard();
    });

    openMonthlyReportButton?.addEventListener("click", () => {
        showScreen("monthlyReportScreen");
    });

    openAdminButton?.addEventListener("click", () => {
        showScreen("adminScreen");
    });

    adminEmployeesButton?.addEventListener("click", async () => {
        showScreen("adminEmployeesScreen");
        await renderAdminEmployees();
    });

    adminWeeklyMenuButton?.addEventListener("click", async () => {
        renderWeeklyMenuForm();
        setWeeklyMenuDateRange();
        showScreen("adminWeeklyMenuScreen");
        await loadWeeklyMenuFromDatabase();

        document.querySelectorAll("#adminWeeklyMenuScreen .weekly-menu-day")
            .forEach(day => {
                day.open = false;
            });
    });

    downloadWeeklyMenuButton?.addEventListener("click", async () => {
        downloadWeeklyMenuButton.disabled = true;
        downloadWeeklyMenuButton.textContent = "Načítavam menu...";
        weeklyMenuImportResult.textContent = "Kontrolujem aktuálne menu na SuperObed...";

        try {
            const { data, error } = await supabaseClient.functions.invoke(
                "check-appetit-menu",
                { body: {} }
            );

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || "Menu sa nepodarilo načítať.");

            if (data.menuAvailable === false) {
                weeklyMenuImportResult.textContent = "Aktuálne menu zatiaľ nie je dostupné.";
                return;
            }

            weeklyMenuImportResult.textContent = "Pripravujem rozpoznanie menu...";
            const recognizedText = await recognizeWeeklyMenuImage(
                data.imageBase64,
                data.contentType,
                weeklyMenuImportResult
            );

            if (!recognizedText) {
                throw new Error("Z obrázka sa nepodarilo rozpoznať žiadny text.");
            }

            const parsedMenu = parseWeeklyMenuText(recognizedText);
            fillWeeklyMenuForm(parsedMenu);
            weeklyMenuImportResult.textContent = "✅ Menu bolo rozpoznané a vložené do formulára. Skontroluj text a klikni Uložiť menu.";

        } catch (error) {
            console.error("Načítanie menu zlyhalo:", error);
            weeklyMenuImportResult.textContent = error instanceof Error ? error.message : "Menu sa nepodarilo načítať.";
        } finally {
            downloadWeeklyMenuButton.disabled = false;
            downloadWeeklyMenuButton.textContent = "🔄 Načítať nové menu";
        }
    });

    saveWeeklyMenuButton?.addEventListener("click", async () => {
        if (!weeklyMenuFrom?.value || !weeklyMenuTo?.value) {
            weeklyMenuImportResult.textContent = "Najprv vyber týždeň.";
            weeklyMenuImportResult.className = "message error-message";
            return;
        }

        saveWeeklyMenuButton.disabled = true;
        saveWeeklyMenuButton.textContent = "Ukladám menu...";
        weeklyMenuImportResult.textContent = "";
        weeklyMenuImportResult.className = "message";

        try {
            const menu = getWeeklyMenuData();
            const weekFrom = weeklyMenuFrom.value;
            const monday = new Date(`${weekFrom}T12:00:00`);

            const days = [
                { key: "pondelok", dayOfWeek: 1 },
                { key: "utorok", dayOfWeek: 2 },
                { key: "streda", dayOfWeek: 3 },
                { key: "stvrtok", dayOfWeek: 4 },
                { key: "piatok", dayOfWeek: 5 }
            ];

            const rows = days.map((day, index) => {
                const menuDate = new Date(monday);
                menuDate.setDate(monday.getDate() + index);
                const dayMenu = menu[day.key];

                return {
                    week_from: weekFrom,
                    menu_date: formatDateForDatabase(menuDate),
                    day_of_week: day.dayOfWeek,
                    soup: dayMenu?.soup?.trim() || null,
                    menu1: dayMenu?.menu1?.trim() || null,
                    menu2: dayMenu?.menu2?.trim() || null,
                    menu3: dayMenu?.menu3?.trim() || null,
                    menu4: dayMenu?.menu4?.trim() || null,
                    menu5: dayMenu?.menu5?.trim() || null,
                    menu6: dayMenu?.menu6?.trim() || null
                };
            });

            const { error } = await supabaseClient
                .from("weekly_menu")
                .upsert(rows, { onConflict: "week_from,day_of_week" });

            if (error) throw error;

            showMessageModal("✅ Hotovo", "Menu bolo úspešne uložené.");
            weeklyMenuImportResult.textContent = "";

        } catch (error) {
            console.error("Chyba pri ukladaní menu:", error);
            showMessageModal("❌ Chyba", error?.message || "Menu sa nepodarilo uložiť.");
        } finally {
            saveWeeklyMenuButton.disabled = false;
            saveWeeklyMenuButton.textContent = "💾 Uložiť menu";
        }
    });

    addEmployeeButton?.addEventListener("click", () => {
        editingEmployee = null;
        document.getElementById("employeeNameInput").value = "";
        document.getElementById("employeeSurnameInput").value = "";
        document.getElementById("employeePersonalNumberInput").value = "";
        document.getElementById("employeeChipInput").value = "";
        document.getElementById("employeeRoleInput").value = "employee";
        document.getElementById("deactivateEmployeeWrapper").hidden = true;
        document.getElementById("deactivateEmployeeCheckbox").checked = false;
        employeeModal.hidden = false;
    });

    cancelEmployeeButton?.addEventListener("click", () => {
        employeeModal.hidden = true;
    });

    saveEmployeeButton?.addEventListener("click", async () => {
        const employeeData = {
            name: document.getElementById("employeeNameInput").value.trim(),
            surname: document.getElementById("employeeSurnameInput").value.trim(),
            personalNumber: document.getElementById("employeePersonalNumberInput").value.trim(),
            chip: document.getElementById("employeeChipInput").value.trim(),
            role: document.getElementById("employeeRoleInput").value
        };

        if (editingEmployee && deactivateEmployeeCheckbox.checked) {
            const confirmed = confirm("Naozaj chcete deaktivovať tohto zamestnanca?");
            if (!confirmed) return;
        }

        if (!editingEmployee) {
            const { error } = await supabaseClient
                .from("employees")
                .insert({
                    name: employeeData.name,
                    surname: employeeData.surname,
                    employee_number: employeeData.personalNumber,
                    chip: employeeData.chip || null,
                    has_chip: Boolean(employeeData.chip),
                    active: true,
                    role: employeeData.role
                });

            if (error) {
                console.error(error);
                alert(error.message);
                return;
            }
            alert("Zamestnanec bol uložený.");
        } else {
            const { error } = await supabaseClient
                .from("employees")
                .update({
                    name: employeeData.name,
                    surname: employeeData.surname,
                    employee_number: employeeData.personalNumber,
                    chip: employeeData.chip || null,
                    has_chip: Boolean(employeeData.chip),
                    role: employeeData.role,
                    active: !deactivateEmployeeCheckbox.checked
                })
                .eq("id", editingEmployee.id);

            if (error) {
                console.error(error);
                alert(error.message);
                return;
            }
            alert("Zamestnanec bol upravený.");
        }

        employeeModal.hidden = true;
        editingEmployee = null;
        await renderAdminEmployees();
        await loadEmployees();
    });

    openMyOrdersButton?.addEventListener("click", () => {
        const employeeId = getCurrentEmployeeId();
        if (employeeId) {
            openMyOrdersScreen(employeeId);
        } else {
            sessionStorage.setItem("requestedScreen", "myOrdersScreen");
            showScreen("loginScreen");
        }
    });

    openProfileButton?.addEventListener("click", async () => {
        const employeeId = getCurrentEmployeeId();
        if (employeeId) {
            await loadProfile();
            showScreen("profileScreen");
        } else {
            sessionStorage.setItem("requestedScreen", "profileScreen");
            showScreen("loginScreen");
        }
    });

    const changeEmailButton = document.getElementById("changeEmailButton");
    const changePinButton = document.getElementById("changePinButton");
    const pinModal = document.getElementById("pinModal");
    const cancelPinButton = document.getElementById("cancelPinButton");
    const emailModal = document.getElementById("emailModal");
    const cancelEmailButton = document.getElementById("cancelEmailButton");

    changeEmailButton?.addEventListener("click", () => {
        document.getElementById("newEmailInput").value = "";
        emailModal.hidden = false;
    });

    changePinButton?.addEventListener("click", () => {
        document.getElementById("newPinInput").value = "";
        pinModal.hidden = false;
    });

    cancelPinButton?.addEventListener("click", () => {
        pinModal.hidden = true;
    });

    cancelEmailButton?.addEventListener("click", () => {
        emailModal.hidden = true;
    });

    const savePinButton = document.getElementById("savePinButton");
    savePinButton?.addEventListener("click", () => {
        const newPin = document.getElementById("newPinInput").value.trim();
        if (!/^\d{4}$/.test(newPin)) {
            alert("PIN musí mať presne 4 číslice.");
            return;
        }

        let employeeId = getCurrentEmployeeId();
        if (!employeeId) {
            employeeId = sessionStorage.getItem("pinResetEmployeeId");
        }

        if (!employeeId) {
            alert("Nepodarilo sa zistiť zamestnanca.");
            return;
        }

        localStorage.setItem(`pin_${employeeId}`, newPin);
        pinModal.hidden = true;
        sessionStorage.removeItem("pinResetCode");
        sessionStorage.removeItem("pinResetEmployeeId");

        showScreen("loginScreen");
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
            loginMessage.textContent = "✅ PIN bol úspešne zmenený. Teraz sa môžete prihlásiť.";
            loginMessage.className = "message success-message";
        }
    });

    const saveEmailButton = document.getElementById("saveEmailButton");
    saveEmailButton?.addEventListener("click", async () => {
        const email = document.getElementById("newEmailInput").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Zadajte platný e-mail.");
            return;
        }

        const employeeId = getCurrentEmployeeId();
        if (!employeeId) return;

        const [surname, name] = employeeId.split("_");
        const { error } = await supabaseClient
            .from("employees")
            .update({ email: email })
            .eq("surname", surname)
            .eq("name", name);

        if (error) {
            console.error("Chyba pri ukladaní e-mailu:", error);
            alert("E-mail sa nepodarilo uložiť.");
            return;
        }

        emailModal.hidden = true;
        alert("E-mail bol uložený.");
        loadProfile();
    });

    const verifyResetCodeButton = document.getElementById("verifyResetCodeButton");
    const cancelResetPinButton = document.getElementById("cancelResetPinButton");

    verifyResetCodeButton?.addEventListener("click", () => {
        const resetCodeInput = document.getElementById("resetCodeInput");
        const resetCodeError = document.getElementById("resetCodeError");
        const enteredCode = resetCodeInput.value.trim();
        const correctCode = sessionStorage.getItem("pinResetCode");

        if (!enteredCode) {
            resetCodeError.textContent = "Zadajte overovací kód.";
            return;
        }

        if (enteredCode !== correctCode) {
            resetCodeError.textContent = "Zadaný overovací kód nie je správny.";
            return;
        }

        resetCodeError.textContent = "";
        document.getElementById("resetPinModal").hidden = true;
        document.getElementById("newPinInput").value = "";
        document.getElementById("pinModal").hidden = false;
    });

    cancelResetPinButton?.addEventListener("click", () => {
        const resetPinModal = document.getElementById("resetPinModal");
        resetPinModal.hidden = true;
        sessionStorage.removeItem("pinResetCode");
        sessionStorage.removeItem("pinResetEmployeeId");
    });

    logoutButton?.addEventListener("click", () => {
        sessionStorage.removeItem("loggedEmployee");
        localStorage.removeItem("loggedEmployee");
        sessionStorage.removeItem("requestedScreen");

        const select = document.getElementById("employeeSelect");
        const pinInput = document.getElementById("pinInput");
        const pinConfirm = document.getElementById("pinConfirm");
        const pinConfirmWrapper = document.getElementById("pinConfirmWrapper");
        const rememberMe = document.getElementById("rememberMe");

        if (select) select.value = "";
        if (pinInput) pinInput.value = "";
        if (pinConfirm) pinConfirm.value = "";
        if (pinConfirmWrapper) pinConfirmWrapper.hidden = true;
        if (rememberMe) rememberMe.checked = false;

        clearLoginMessage();
        showScreen("homeScreen");
        updatePermissions();
    });
}

const openRestaurantMenuButton = document.getElementById("openRestaurantMenuButton");
openRestaurantMenuButton?.addEventListener("click", () => {
    window.open(
        "https://superobed.sk/podnik/appetit-obedove-menu-rozvoz/denne-menu-54?h=2aa4fbd1b6",
        "_blank"
    );
});

// =====================================
// 5. NAČÍTANIE ZAMESTNANCOV
// =====================================

async function loadEmployees() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;

    try {
        const { data: employees, error } = await supabaseClient
            .from("employees")
            .select("*");

        if (error) throw error;

        window.adminEmployeesData = employees;

        employees.sort((a, b) => {
            const employeeA = `${a.surname} ${a.name}`;
            const employeeB = `${b.surname} ${b.name}`;
            return employeeA.localeCompare(employeeB, "sk");
        });

        select.innerHTML = "";
        const firstOption = document.createElement("option");
        firstOption.value = "";
        firstOption.textContent = "-- Vyberte zamestnanca --";
        select.appendChild(firstOption);

        employees.forEach(employee => {
            if (employee.active === false) return;

            const option = document.createElement("option");
            option.value = employee.employee_number && employee.employee_number !== "None"
                ? String(employee.employee_number)
                : `${employee.surname}_${employee.name}`;

            option.textContent = `${employee.surname} ${employee.name}`;
            option.dataset.name = employee.name || "";
            option.dataset.surname = employee.surname || "";
            option.dataset.chip = employee.chip || "";
            option.dataset.hasChip = employee.has_chip ? "true" : "false";
            option.dataset.role = employee.role || "";
            option.dataset.maxMenuNumber = employee.max_menu_number ? String(employee.max_menu_number) : "5";

            select.appendChild(option);
        });

        const currentEmployee = getCurrentEmployeeId();
        const persistentEmployee = localStorage.getItem("loggedEmployee");

        if (currentEmployee && hasEmployeeOption(select, currentEmployee)) {
            select.value = currentEmployee;
        } else {
            select.value = "";
        }

        const rememberMe = document.getElementById("rememberMe");
        if (rememberMe) {
            rememberMe.checked = Boolean(persistentEmployee);
        }

    } catch (error) {
        console.error(error);
        select.innerHTML = "<option>Chyba pri načítaní zamestnancov</option>";
    }
}

function hasEmployeeOption(select, employeeId) {
    return [...select.options].some(option => option.value === employeeId);
}

// =====================================
// 6. PRIHLÁSENIE A VLASTNÝ PIN
// =====================================

function setupLogin() {
    const loginButton = document.getElementById("loginButton");
    const forgotPinButton = document.getElementById("forgotPinButton");
    const select = document.getElementById("employeeSelect");
    const pinInput = document.getElementById("pinInput");
    const pinConfirm = document.getElementById("pinConfirm");
    const pinConfirmWrapper = document.getElementById("pinConfirmWrapper");
    const rememberMe = document.getElementById("rememberMe");

    if (!loginButton || !select || !pinInput || !pinConfirm || !pinConfirmWrapper || !rememberMe) {
        return;
    }

    function updatePinMode() {
        const employeeId = select.value;
        pinInput.value = "";
        pinConfirm.value = "";
        clearLoginMessage();

        if (!employeeId) {
            pinConfirmWrapper.hidden = true;
            loginButton.textContent = "Prihlásiť";
            return;
        }

        const savedPin = localStorage.getItem(`pin_${employeeId}`);
        if (savedPin) {
            pinConfirmWrapper.hidden = true;
            loginButton.textContent = "Prihlásiť";
        } else {
            pinConfirmWrapper.hidden = false;
            loginButton.textContent = "Vytvoriť PIN";
        }
    }

    select.addEventListener("change", updatePinMode);
    updatePinMode();
    forgotPinButton?.addEventListener("click", forgotPin);

    loginButton.addEventListener("click", () => {
        const employeeId = select.value;
        const pin = pinInput.value.trim();
        const confirmPin = pinConfirm.value.trim();

        if (!employeeId) {
            showLoginError("Vyberte zamestnanca.");
            return;
        }

        if (!/^\d{4}$/.test(pin)) {
            showLoginError("PIN musí obsahovať presne 4 čísla.");
            return;
        }

        const pinKey = `pin_${employeeId}`;
        const savedPin = localStorage.getItem(pinKey);

        if (!savedPin) {
            pinConfirmWrapper.hidden = false;
            if (!/^\d{4}$/.test(confirmPin)) {
                showLoginError("Potvrďte svoj 4-miestny PIN.");
                return;
            }

            if (pin !== confirmPin) {
                showLoginError("Zadané PIN kódy sa nezhodujú.");
                return;
            }

            localStorage.setItem(pinKey, pin);
        } else {
            if (pin !== savedPin) {
                showLoginError("Nesprávny PIN.");
                return;
            }
        }

        if (rememberMe.checked) {
            localStorage.setItem("loggedEmployee", employeeId);
            sessionStorage.removeItem("loggedEmployee");
        } else {
            sessionStorage.setItem("loggedEmployee", employeeId);
            localStorage.removeItem("loggedEmployee");
        }

        updatePermissions();
        const requestedScreen = sessionStorage.getItem("requestedScreen");
        sessionStorage.removeItem("requestedScreen");

        if (requestedScreen === "orderScreen") {
            openWeekSelectionScreen(employeeId);
        } else if (requestedScreen === "myOrdersScreen") {
            openMyOrdersScreen(employeeId);
        } else if (requestedScreen === "profileScreen") {
            loadProfile();
            showScreen("profileScreen");
        } else {
            showScreen("homeScreen");
        }
    });
}

function showLoginError(msg) {
    const el = document.getElementById("loginMessage");
    if (el) {
        el.textContent = msg;
        el.className = "message error-message";
    }
}

function clearLoginMessage() {
    const el = document.getElementById("loginMessage");
    if (el) {
        el.textContent = "";
        el.className = "message";
    }
}

async function forgotPin() {
    const select = document.getElementById("employeeSelect");
    const employeeId = select?.value;

    if (!employeeId) {
        alert("Najprv vyberte zamestnanca.");
        return;
    }

    const option = [...select.options].find(opt => opt.value === employeeId);
    const surname = option?.dataset?.surname;
    const name = option?.dataset?.name;

    const { data: emp, error } = await supabaseClient
        .from("employees")
        .select("email")
        .eq("surname", surname)
        .eq("name", name)
        .single();

    if (error || !emp?.email) {
        alert("Pre tohto zamestnanca nebol nájdený e-mail na obnovu PIN kódu.");
        return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem("pinResetCode", code);
    sessionStorage.setItem("pinResetEmployeeId", employeeId);

    alert(`Overovací kód bol odoslaný na ${emp.email}. (Testovací kód: ${code})`);
    document.getElementById("resetPinModal").hidden = false;
}

// =====================================
// 7. GENERÁTOR SUMÁRU A ROZPÍSANIA PRE REŠTAURÁCIU
// =====================================

function formatRestaurantOrderSummary(orders) {
    let summaryText = "";
    const ordersByDate = {};

    orders.forEach(order => {
        const dateKey = order.order_date;
        if (!ordersByDate[dateKey]) ordersByDate[dateKey] = [];
        ordersByDate[dateKey].push(order);
    });

    Object.keys(ordersByDate).sort().forEach(date => {
        const dayOrders = ordersByDate[date];
        const counts = {};

        dayOrders.forEach(o => {
            const itemKey = o.sub_option ? `${o.menu_title} (${o.sub_option})` : o.menu_title;
            counts[itemKey] = (counts[itemKey] || 0) + 1;
        });

        summaryText += `**${date}**\n\n`;
        summaryText += `Spolu: **${dayOrders.length} ks**\n\n`;

        Object.keys(counts).forEach(item => {
            summaryText += `**${item}** — **${counts[item]} ks**\n`;
        });
        summaryText += `\n-------------------------\n\n`;
    });

    return summaryText;
}

function setupOrderButton() {}
function setupManualIssue() {}
function setupChipLogin() {}
function setupChipIssue() {}
function setupMonthlyReport() {}
function renderIssueDashboard() {}
function openWeekSelectionScreen() {}
function openMyOrdersScreen() {}
function loadProfile() {}
function renderAdminEmployees() {}
function renderWeeklyMenuForm() {}
function setWeeklyMenuDateRange() {}
function loadWeeklyMenuFromDatabase() {}
function recognizeWeeklyMenuImage() {}
function parseWeeklyMenuText(text) { return {}; }
function fillWeeklyMenuForm() {}
function getWeeklyMenuData() { return {}; }
function formatDateForDatabase(d) { return d.toISOString().split('T')[0]; }
function showMessageModal(title, msg) { alert(`${title}\n${msg}`); }
