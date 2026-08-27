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
    menu_choice,
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

               return `${(item.menu_name || "").replace(/\s*\([^)]*\)/g, "").trim()} – ${methods.join(" + ")}`;

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

    }, 3000);

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

                            return `${(item.menu_name || "").replace(/\s*\([^)]*\)/g, "").trim()} – ${methods.join(" + ")}`;

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

}, 3000);



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

    await openWeekSelectionScreen(
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
    const issueCards = document.getElementById("issueCards");
    const waitingCount = document.getElementById("waitingCount");
    const issuedCount = document.getElementById("issuedCount");
    const diningCount = document.getElementById("diningCount");
    const takeawayCount = document.getElementById("takeawayCount");
    const totalCount = document.getElementById("totalCount");

    if (
        !issueCards
        || !waitingCount
        || !issuedCount
        || !diningCount
        || !takeawayCount
        || !totalCount
    ) {
        return;
    }

    issueCards.innerHTML = `
        <p>Načítavam dnešné objednávky...</p>
    `;

    try {
        const today = getTodayDate();

        const { data, error } = await supabaseClient
            .from("meal_orders")
            .select(`
                id,
                employee_id,
                employee_name,
                menu_id,
                menu_name,
                menu_choice,
                dining,
                takeaway,
                issued
            `)
            .eq("order_date", today);

        if (error) {
            throw error;
        }

        const orders = data || [];

        // Výpočet jednotlivých štatistík pre počítadlá
        const waitingMeals = orders.filter(order => !order.issued).length;
        const issuedMeals = orders.filter(order => order.issued).length;
        const diningMeals = orders.filter(order => order.dining).length;
        const takeawayMeals = orders.filter(order => order.takeaway).length;

        // PREPIS HODNÔT DO HTML ELEMENTOV NA DASHBOARDE (tu chýbali aktualizácie)
        waitingCount.textContent = waitingMeals;
        issuedCount.textContent = issuedMeals;
        diningCount.textContent = diningMeals;
        takeawayCount.textContent = takeawayMeals;

        // Výpočet celkového počtu porcií cez menu_id
        const menuCountsTemp = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        orders.forEach(order => {
            const menuNumber = Number(order.menu_id);
            if (menuCountsTemp[menuNumber] !== undefined) {
                menuCountsTemp[menuNumber]++;
            }
        });
        const totalPortions = Object.values(menuCountsTemp).reduce((a, b) => a + b, 0);
        totalCount.textContent = totalPortions;

        const employeeOrders = new Map();

        orders.forEach(order => {
            const employeeKey = String(order.employee_id);

            if (!employeeOrders.has(employeeKey)) {
                employeeOrders.set(
                    employeeKey,
                    {
                        employeeId: employeeKey,
                        employeeName: order.employee_name || "Neznámy zamestnanec",
                        orders: []
                    }
                );
            }

            employeeOrders.get(employeeKey).orders.push(order);
        });

        const employees = [...employeeOrders.values()]
            .map(employee => {
                const isIssued = employee.orders.every(order => Boolean(order.issued));
                return {
                    ...employee,
                    isIssued
                };
            })
            .sort((a, b) => {
                if (a.isIssued !== b.isIssued) {
                    return a.isIssued ? 1 : -1;
                }
                return a.employeeName.localeCompare(b.employeeName, "sk");
            });

        const todayMenuSummary = document.getElementById("todayMenuSummary");

        if (todayMenuSummary) {
            const menuCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            orders.forEach(order => {
                const menuNumber = Number(order.menu_id);
                if (menuCounts[menuNumber] !== undefined) {
                    menuCounts[menuNumber]++;
                }
            });

            const menuRows = [1, 2, 3, 4, 5, 6]
                .filter(menuNumber => menuCounts[menuNumber] > 0)
                .map(menuNumber => {
                    const menuOrder = orders.find(order => Number(order.menu_id) === menuNumber);
                    const menuText = (menuOrder?.menu_name || "").replace(/\s*\([^)]*\)/g, "").trim();
                    const label = menuNumber === 6 ? "⭐ Menu 6" : `Menu ${menuNumber}`;

                    return `
                        <div class="today-menu-row">
                            <span>
                                <span style="color:red;">${label}</span> – ${escapeHtml(menuText)}
                            </span>
                            <strong>
                                ${menuCounts[menuNumber]} ks
                            </strong>
                        </div>
                    `;
                })
                .join("");

            const todayFormatted = new Date(today + "T12:00:00").toLocaleDateString(
                "sk-SK",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "numeric",
                    year: "numeric"
                }
            );

            const todayFormattedCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);
            
            todayMenuSummary.innerHTML = `
                <div class="today-menu-summary-title">
                    Dnešná objednávka
                </div>
                <div class="today-menu-date">
                    ${todayFormattedCapitalized}
                </div>
                <div class="today-menu-total">
                    Spolu:
                    <strong>
                        ${totalPortions} ks
                    </strong>
                </div>
                <div class="today-menu-list">
                    ${menuRows}
                </div>
                <div class="today-menu-serving">
                    <span>
                        🍽️ V jedálni:
                        <strong>
                            ${diningMeals} ks
                        </strong>
                    </span>
                    <span>
                        📦 Zabaliť:
                        <strong>
                            ${takeawayMeals} ks
                        </strong>
                    </span>
                </div>
            `;
        }

        if (employees.length === 0) {
            issueCards.innerHTML = `
                <p>
                    Na dnešný deň nie sú žiadne objednávky.
                </p>
            `;
            return;
        }

        issueCards.innerHTML = employees
            .map(employee => {
                const mealsHtml = employee.orders
                    .map(order => {
                        const methods = [];
                        if (order.dining) methods.push("V jedálni");
                        if (order.takeaway) methods.push("Zabaliť");

                        return `
                            <div class="issue-meal-row">
                                <div class="issue-type">
                                    ${order.takeaway ? "📦 Zabaliť" : "🍽️ V jedálni"}
                                </div>
                                <div class="issue-menu">
                                    <span style="color:red;">
                                        Menu ${order.menu_id}
                                    </span>
                                    ${
                                        order.menu_choice
                                            ? `<div class="issue-menu-choice">
                                                🧀 ${escapeHtml(order.menu_choice)}
                                              </div>`
                                            : ""
                                    }
                                </div>
                            </div>
                        `;
                    })
                    .join("");

                return `
                    <div class="issue-item ${employee.isIssued ? "issued" : "waiting"}">
                        <div class="issue-name">
                            ${escapeHtml(employee.employeeName)}
                        </div>
                        ${mealsHtml}
                        <div class="issue-status">
                            ${employee.isIssued ? "🔴 Vydané" : "🟢 Čaká"}
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

        issueCards.querySelectorAll(".manual-issue-card-button").forEach(button => {
            button.addEventListener("click", async () => {
                const employeeId = button.dataset.employeeId;
                if (!employeeId) return;

                button.disabled = true;
                button.textContent = "Vydávam...";

                try {
                    const { error } = await supabaseClient
                        .from("meal_orders")
                        .update({ issued: true })
                        .eq("employee_id", employeeId)
                        .eq("order_date", today);

                    if (error) throw error;

                    await renderIssueDashboard();
                } catch (error) {
                    console.error("Chyba pri osobnom výdaji:", error);
                    button.disabled = false;
                    button.textContent = "✅ Vydať osobne";
                    alert("Obed sa nepodarilo označiť ako vydaný.");
                }
            });
        });

    } catch (error) {
        console.error("Chyba pri načítaní dashboardu:", error);

        waitingCount.textContent = "0";
        issuedCount.textContent = "0";
        diningCount.textContent = "0";
        takeawayCount.textContent = "0";
        totalCount.textContent = "0";

        issueCards.innerHTML = `
            <p class="error-message">
                Dashboard sa nepodarilo načítať.
            </p>
        `;
    }
}


        waitingCount.textContent = "0";
        issuedCount.textContent = "0";
        totalCount.textContent = "0";


        issueCards.innerHTML = `
            <p class="error-message">
                Dashboard sa nepodarilo načítať.
            </p>
        `;

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
    menu_choice,
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

    }, 3000);

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
    ${escapeHtml(
        (item.menu_name || "")
            .replace(/\s*\([^)]*\)/g, "")
            .trim()
    )}
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

}, 3000);

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

// // =====================================
// 17. MESAČNÝ VÝKAZ OBEDOV
// =====================================

let monthlyReportRows = [];
let monthlyReportDailyRows = [];
let monthlyReportSelectedMonth = "";
let monthlyReportDaysInMonth = 0;
