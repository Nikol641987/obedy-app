// 4. NAVIGÁCIA
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

    const adminBackButtons =
    document.querySelectorAll(
        "[data-back-admin]"
    );

adminBackButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            showScreen(
                "adminScreen"
            );

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
    
const openMonthlyReportButton =
    document.getElementById("openMonthlyReportButton");

    const openAdminButton =
    document.getElementById("openAdminButton");
    
const adminEmployeesButton =
    document.getElementById("adminEmployeesButton");
    
    const adminWeeklyMenuButton =
    document.getElementById("adminWeeklyMenuButton");

const adminWeeklyMenuScreen =
    document.getElementById("adminWeeklyMenuScreen");

    const adminEmailOrdersButton =
document.getElementById(
    "adminEmailOrdersButton"
);

const adminEmailOrdersScreen =
document.getElementById(
    "adminEmailOrdersScreen"
);
    const restaurantEmailInput =
    document.getElementById(
        "restaurantEmailInput"
    );

const orderEmailTimeInput =
    document.getElementById(
        "orderEmailTimeInput"
    );

const automaticOrderEmailEnabled =
    document.getElementById(
        "automaticOrderEmailEnabled"
    );

const saveOrderEmailSettingsButton =
    document.getElementById(
        "saveOrderEmailSettingsButton"
    );

const sendTestOrderEmailButton =
    document.getElementById(
        "sendTestOrderEmailButton"
    );

const orderEmailHistory =
    document.getElementById(
        "orderEmailHistory"
    );

const downloadWeeklyMenuButton =
    document.getElementById("downloadWeeklyMenuButton");
    const saveWeeklyMenuButton =
    document.getElementById(
        "saveWeeklyMenuButton"
    );

const weeklyMenuImportResult =
    document.getElementById("weeklyMenuImportResult");

    const weeklyMenuFrom =
    document.getElementById("weeklyMenuFrom");

const weeklyMenuTo =
    document.getElementById("weeklyMenuTo");

    const addEmployeeButton =
    document.getElementById("addEmployeeButton");


    const cancelEmployeeButton =
    document.getElementById("cancelEmployeeButton");

    const saveEmployeeButton =
    document.getElementById("saveEmployeeButton");

    const employeeMaxMenuInput =
    document.getElementById(
        "employeeMaxMenuInput"
    );

    const deactivateEmployeeCheckbox =
    document.getElementById(
        "deactivateEmployeeCheckbox"
    );

    const employeeModal =
    document.getElementById("employeeModal");
    
    const openProfileButton =
        document.getElementById("openProfileButton");

const homeLoginButton =
    document.getElementById(
        "homeLoginButton"
    );
    
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
    openMonthlyReportButton?.addEventListener(
    "click",
    () => {

        showScreen("monthlyReportScreen");

    }
);

    openAdminButton?.addEventListener(
    "click",
    () => {

        showScreen("adminScreen");

    }
);

    adminEmployeesButton?.addEventListener(
    "click",
    async () => {

        showScreen("adminEmployeesScreen");

        await renderAdminEmployees();

    }
);

 adminWeeklyMenuButton?.addEventListener(
    "click",
    async () => {

        renderWeeklyMenuForm();

        setWeeklyMenuDateRange();

        showScreen(
            "adminWeeklyMenuScreen"
        );

        await loadWeeklyMenuFromDatabase();

        document
            .querySelectorAll(
                "#adminWeeklyMenuScreen .weekly-menu-day"
            )
            .forEach(day => {

                day.open = false;

            });

    }
);

    adminEmailOrdersButton?.addEventListener(
    "click",
    async () => {

        showScreen(
            "adminEmailOrdersScreen"
        );

        try {

            const { data, error } =
                await supabaseClient
                    .from(
                        "order_email_settings"
                    )
                    .select(
                        "restaurant_email, send_time, enabled"
                    )
                    .order(
                        "id",
                        {
                            ascending: true
                        }
                    )
                    .limit(1)
                    .maybeSingle();

            if (error) {
                throw error;
            }

            if (restaurantEmailInput) {
                restaurantEmailInput.value =
                    data?.restaurant_email || "";
            }

            if (orderEmailTimeInput) {
                orderEmailTimeInput.value =
                    data?.send_time
                        ? String(data.send_time).slice(0, 5)
                        : "";
            }

            if (automaticOrderEmailEnabled) {
                automaticOrderEmailEnabled.checked =
                    Boolean(
                        data?.enabled
                    );
            }

        } catch (error) {

            console.error(
                "Chyba pri načítaní nastavení e-mailu:",
                error
            );

        }
    await loadOrderEmailHistory();
    }
);
async function loadOrderEmailHistory() {

    if (!orderEmailHistory) {
        return;
    }

    orderEmailHistory.innerHTML =
        "Načítavam históriu...";

    try {

        const { data, error } =
            await supabaseClient
                .from(
                    "order_email_history"
                )
                .select(`
                    id,
                    created_at,
                    order_date,
                    restaurant_email,
                    total_orders,
                    dining_orders,
                    takeaway_orders,
                    order_summary,
                    status,
                    error_message
                `)
                .order(
                    "order_date",
                    {
                        ascending: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            orderEmailHistory.innerHTML =
                "Zatiaľ nebola odoslaná žiadna objednávka.";

            return;
        }

        orderEmailHistory.innerHTML =
            data
                .map(item => {

                    const formattedDate =
                        new Date(
                            item.order_date + "T12:00:00"
                        )
                        .toLocaleDateString(
                            "sk-SK"
                        );

                    const formattedTime =
                        item.created_at
                            ? new Date(
                                item.created_at
                            )
                            .toLocaleTimeString(
                                "sk-SK",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone:
                                        "Europe/Bratislava"
                                }
                            )
                            : "";

                    const statusText =
                        item.status === "sent"
                            ? "✅ Odoslané"
                            : "❌ Chyba";

                    return `
                        <div class="order-email-history-item">

                            <div class="order-email-history-top">
                                <strong>
                                    ${formattedDate}
                                </strong>

                                <span>
                                    ${statusText}
                                </span>
                            </div>

                            <div>
                                Čas:
                                <strong>${formattedTime}</strong>
                            </div>

                            <div>
                                Spolu:
                                <strong>${item.total_orders || 0} ks</strong>
                            </div>

                            <div>
                                🍽️ V jedálni:
                                <strong>${item.dining_orders || 0} ks</strong>
                            </div>

                            <div>
                                📦 Zabaliť:
                                <strong>${item.takeaway_orders || 0} ks</strong>
                            </div>

                            <div>
                                E-mail:
                                ${item.restaurant_email || ""}
                            </div>

                        </div>
                    `;

                })
                .join("");

    } catch (error) {

        console.error(
            "Chyba pri načítaní histórie e-mailov:",
            error
        );

        orderEmailHistory.innerHTML =
            "Históriu sa nepodarilo načítať.";
    }
}
    saveOrderEmailSettingsButton?.addEventListener(
    "click",
    async () => {

        const restaurantEmail =
            restaurantEmailInput?.value
                .trim();

        const sendTime =
            orderEmailTimeInput?.value;

        const enabled =
            Boolean(
                automaticOrderEmailEnabled?.checked
            );


        if (!restaurantEmail) {

            alert(
                "Zadajte e-mail reštaurácie."
            );

            return;
        }


        if (!sendTime) {

            alert(
                "Zadajte čas automatického odoslania."
            );

            return;
        }


        try {

            const { data: existing, error: loadError } =
                await supabaseClient
                    .from(
                        "order_email_settings"
                    )
                    .select("id")
                    .order(
                        "id",
                        {
                            ascending: true
                        }
                    )
                    .limit(1)
                    .maybeSingle();

            if (loadError) {
                throw loadError;
            }


            let saveError;


            if (existing?.id) {

                const { error } =
                    await supabaseClient
                        .from(
                            "order_email_settings"
                        )
                        .update({
                            restaurant_email:
                                restaurantEmail,

                            send_time:
                                sendTime,

                            enabled:
                                enabled
                        })
                        .eq(
                            "id",
                            existing.id
                        );

                saveError = error;

            } else {

                const { error } =
                    await supabaseClient
                        .from(
                            "order_email_settings"
                        )
                        .insert({
                            restaurant_email:
                                restaurantEmail,

                            send_time:
                                sendTime,

                            enabled:
                                enabled
                        });

                saveError = error;
            }


            if (saveError) {
                throw saveError;
            }


            alert(
                "Nastavenie bolo uložené."
            );


        } catch (error) {

            console.error(
                "Chyba pri ukladaní nastavenia e-mailu:",
                error
            );

            alert(
                "Nastavenie sa nepodarilo uložiť."
            );
        }

    }
);

    sendTestOrderEmailButton?.addEventListener(
    "click",
    async () => {

        const email =
            restaurantEmailInput?.value.trim();

        if (!email) {

            alert(
                "Najprv zadajte e-mail reštaurácie."
            );

            return;
        }

        sendTestOrderEmailButton.disabled =
            true;

        sendTestOrderEmailButton.textContent =
            "📧 Odosielam...";

        try {

            const { data, error } =
                await supabaseClient.functions.invoke(
                    "send-order-email",
                    {
                        body: {
                            email:
                                email,

                            test:
                                true
                        }
                    }
                );

            if (error) {
                throw error;
            }

            if (data?.error) {
                throw new Error(
                    data.error
                );
            }

            alert(
                "Testovací e-mail bol úspešne odoslaný."
            );

        } catch (error) {

            console.error(
                "Chyba pri odosielaní testovacieho e-mailu:",
                error
            );

            alert(
                "Testovací e-mail sa nepodarilo odoslať."
            );

        } finally {

            sendTestOrderEmailButton.disabled =
                false;

            sendTestOrderEmailButton.textContent =
                "📧 Odoslať testovací e-mail";
        }

    }
);
    
downloadWeeklyMenuButton?.addEventListener(
    "click",
    async () => {

        downloadWeeklyMenuButton.disabled = true;
        downloadWeeklyMenuButton.textContent =
            "Načítavam menu...";

        weeklyMenuImportResult.textContent =
            "Kontrolujem aktuálne menu na SuperObed...";

        try {

           const { data, error } =
    await supabaseClient
        .functions
        .invoke(
            "check-appetit-menu",
            {
                body: {}
            }
        );
           
            
            if (error) {
                throw error;
            }

            if (!data?.success) {
                throw new Error(
                    data?.error ||
                    "Menu sa nepodarilo načítať."
                );
            }

            if (
    data.menuAvailable === false
) {

    weeklyMenuImportResult.textContent =
        "Aktuálne menu zatiaľ nie je dostupné.";

    return;
}

weeklyMenuImportResult.textContent =
    "Pripravujem rozpoznanie menu...";

const recognizedText =
    await recognizeWeeklyMenuImage(
        data.imageBase64,
        data.contentType,
        weeklyMenuImportResult
    );

if (!recognizedText) {

    throw new Error(
        "Z obrázka sa nepodarilo rozpoznať žiadny text."
    );
}

console.log(
    "Rozpoznaný text menu:",
    recognizedText
);

const parsedMenu =
    parseWeeklyMenuText(
        recognizedText
    );

console.log(
    "Rozdelené menu:",
    parsedMenu
);

fillWeeklyMenuForm(
    parsedMenu
);

weeklyMenuImportResult.textContent =
    "✅ Menu bolo rozpoznané a vložené do formulára. Skontroluj text a klikni Uložiť menu.";

        } catch (error) {

            console.error(
                "Načítanie menu zlyhalo:",
                error
            );

            weeklyMenuImportResult.textContent =
                error instanceof Error
                    ? error.message
                    : "Menu sa nepodarilo načítať.";

        } finally {

            downloadWeeklyMenuButton.disabled = false;
            downloadWeeklyMenuButton.textContent =
                "🔄 Načítať nové menu";

        }

    }
);
    saveWeeklyMenuButton?.addEventListener(
    "click",
    async () => {

        if (
            !weeklyMenuFrom?.value
            || !weeklyMenuTo?.value
        ) {

            weeklyMenuImportResult.textContent =
                "Najprv vyber týždeň.";

            weeklyMenuImportResult.className =
                "message error-message";

            return;
        }

        saveWeeklyMenuButton.disabled = true;
        saveWeeklyMenuButton.textContent =
            "Ukladám menu...";

        weeklyMenuImportResult.textContent =
            "";

        weeklyMenuImportResult.className =
            "message";

        try {

            const menu =
                getWeeklyMenuData();

            const weekFrom =
                weeklyMenuFrom.value;

            const monday =
                new Date(
                    `${weekFrom}T12:00:00`
                );

            const days = [
                {
                    key: "pondelok",
                    dayOfWeek: 1
                },
                {
                    key: "utorok",
                    dayOfWeek: 2
                },
                {
                    key: "streda",
                    dayOfWeek: 3
                },
                {
                    key: "stvrtok",
                    dayOfWeek: 4
                },
                {
                    key: "piatok",
                    dayOfWeek: 5
                }
            ];

            const rows =
                days.map(
                    (
                        day,
                        index
                    ) => {

                        const menuDate =
                            new Date(monday);

                        menuDate.setDate(
                            monday.getDate()
                            + index
                        );

                        const dayMenu =
                            menu[day.key];

                        return {
                            week_from:
                                weekFrom,

                            menu_date:
                                formatDateForDatabase(
                                    menuDate
                                ),

                            day_of_week:
                                day.dayOfWeek,

                            soup:
                                dayMenu?.soup
                                ?.trim()
                                || null,

                            menu1:
                                dayMenu?.menu1
                                ?.trim()
                                || null,

                            menu2:
                                dayMenu?.menu2
                                ?.trim()
                                || null,

                            menu3:
                                dayMenu?.menu3
                                ?.trim()
                                || null,

                            menu4:
                                dayMenu?.menu4
                                ?.trim()
                                || null,

                            menu5:
                                dayMenu?.menu5
                                ?.trim()
                                || null,

                            menu6:
                                dayMenu?.menu6
                                ?.trim()
                                || null
                        };

                    }
                );

            const { error } =
                await supabaseClient
                    .from("weekly_menu")
                    .upsert(
                        rows,
                        {
                            onConflict:
                                "week_from,day_of_week"
                        }
                    );

            if (error) {
                throw error;
            }

           showMessageModal(
    "✅ Hotovo",
    "Menu bolo úspešne uložené."
);

weeklyMenuImportResult.textContent = "";

        } catch (error) {

            console.error(
                "Chyba pri ukladaní menu:",
                error
            );

           showMessageModal(
    "❌ Chyba",
    error?.message
    || "Menu sa nepodarilo uložiť."
);

        } finally {

            saveWeeklyMenuButton.disabled =
                false;

            saveWeeklyMenuButton.textContent =
                "💾 Uložiť menu";

        }

    }
);
    
addEmployeeButton?.addEventListener(
    "click",
    () => {

        editingEmployee =
            null;

        if (employeeMaxMenuInput) {
    employeeMaxMenuInput.value = "5";
}

        document.getElementById(
            "employeeNameInput"
        ).value = "";

        document.getElementById(
            "employeeSurnameInput"
        ).value = "";

        document.getElementById(
            "employeePersonalNumberInput"
        ).value = "";

        document.getElementById(
            "employeeChipInput"
        ).value = "";

        document.getElementById(
            "employeeRoleInput"
        ).value = "employee";
document.getElementById(
    "deactivateEmployeeWrapper"
).hidden = true;

document.getElementById(
    "deactivateEmployeeCheckbox"
).checked = false;
        employeeModal.hidden =
            false;

    }
);

    cancelEmployeeButton?.addEventListener(
    "click",
    () => {

        document
            .getElementById("employeeModal")
            .hidden = true;

    }
);

    
    
saveEmployeeButton?.addEventListener(
    "click",
    async () => {

        const employeeData = {

            name:
                document.getElementById(
                    "employeeNameInput"
                ).value.trim(),

            surname:
                document.getElementById(
                    "employeeSurnameInput"
                ).value.trim(),

            personalNumber:
                document.getElementById(
                    "employeePersonalNumberInput"
                ).value.trim(),

            chip:
                document.getElementById(
                    "employeeChipInput"
                ).value.trim(),

            role:
                document.getElementById(
                    "employeeRoleInput"
                ).value,
            maxMenuNumber:
    Number(
        document.getElementById(
            "employeeMaxMenuInput"
        ).value
    )

        };

        console.log(
            employeeData
        );
        if (
    editingEmployee
    && deactivateEmployeeCheckbox.checked
) {

    const confirmed =
        confirm(
            "Naozaj chcete deaktivovať tohto zamestnanca?"
        );

    if (!confirmed) {
        return;
    }

}
if (!editingEmployee) {

    const { error } =
        await supabaseClient
            .from("employees")
            .insert({

                name:
                    employeeData.name,

                surname:
                    employeeData.surname,

                employee_number:
                    employeeData.personalNumber,

                chip:
                    employeeData.chip || null,

                has_chip:
                    Boolean(employeeData.chip),

            active:
    true,

role:
    employeeData.role,

max_menu_number:
    employeeData.maxMenuNumber

            });

    if (error) {

    console.error(error);

    alert(
        error.message
    );

    return;

}
    alert(
    "Zamestnanec bol uložený."
);

employeeModal.hidden =
    true;

await renderAdminEmployees();
await loadEmployees();
    
} else {

    const { error } =
        await supabaseClient
           .from("employees")
.update({

    name:
        employeeData.name,

    surname:
        employeeData.surname,

    employee_number:
        employeeData.personalNumber,

    chip:
        employeeData.chip || null,

    has_chip:
        Boolean(employeeData.chip),

   role:
    employeeData.role,

active:
    !deactivateEmployeeCheckbox.checked,

max_menu_number:
    employeeData.maxMenuNumber
})
            .eq(
                "id",
                editingEmployee.id
            );

    if (error) {

        console.error(error);

        alert(error.message);

        return;
    }

    alert(
        "Zamestnanec bol upravený."
    );

    employeeModal.hidden =
    true;

editingEmployee =
    null;

await renderAdminEmployees();
await loadEmployees();
}

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
 homeLoginButton?.addEventListener(
    "click",
    () => {

        sessionStorage.setItem(
            "requestedScreen",
            "homeScreen"
        );

        showScreen(
            "loginScreen"
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
            showMessageModal(
    "Odhlásenie",
    "Boli ste úspešne odhlásený."
);

        }
    );

}
const openRestaurantMenuButton =
    document.getElementById(
        "openRestaurantMenuButton"
    );

openRestaurantMenuButton?.addEventListener(
    "click",
    () => {

        window.open(
            "https://superobed.sk/podnik/appetit-obedove-menu-rozvoz/denne-menu",
            "_blank"
        );

    }
);

// =====================================
