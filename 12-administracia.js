async function renderAdminEmployees() {
    
const searchInput =
    document.getElementById(
        "adminEmployeesSearch"
    );
    const container =
        document.getElementById(
            "adminEmployeesContainer"
        );
const employeeModal =
    document.getElementById(
        "employeeModal"
    );
    
    if (!container) {
        return;
    }

    
    container.innerHTML =
        "<p>Načítavam zamestnancov...</p>";

    try {

      const { data: employees, error } =
    await supabaseClient
        .from("employees")
        .select("*");

if (error) {
    throw error;
}

        employees.sort((a, b) => {

            const employeeA =
                `${a.surname || ""} ${a.name || ""}`;

            const employeeB =
                `${b.surname || ""} ${b.name || ""}`;

            return employeeA.localeCompare(
                employeeB,
                "sk"
            );
        });

        if (employees.length === 0) {
if (employeesToRender.length === 1) {

    container.classList.add(
        "single-result"
    );

} else {

    container.classList.remove(
        "single-result"
    );

}
            
            container.innerHTML =
                "<p>V zozname nie sú žiadni zamestnanci.</p>";

            return;
        }

        const renderEmployeesList =
    employeesToRender => {
        
        container.innerHTML =
            employeesToRender
                .map(employee => {

                    const fullName =
                        `${employee.surname || ""} ${employee.name || ""}`.trim();

                   const personalNumber =
    employee.employee_number || "-";

                    const chip =
                        employee.chip || "-";

                    const role =
                        employee.role || "-";

                    const status =
                        employee.active
                            ? "Aktívny"
                            : "Neaktívny";

                    return `
                        <article class="admin-employee-card">

                            <h3>
                                ${escapeHtml(fullName)}
                            </h3>

                            <p>
                                <strong>Osobné číslo:</strong>
                                ${escapeHtml(personalNumber)}
                            </p>

                            <p>
                                <strong>Čip:</strong>
                                ${escapeHtml(chip)}
                            </p>

                            <p>
                                <strong>Rola:</strong>
                                ${escapeHtml(role)}
                            </p>

                            <p>
                                <strong>Stav:</strong>
                                ${escapeHtml(status)}
                            </p>
<div class="admin-employee-actions">

    <button
        class="secondary-button edit-employee-button"
        data-personal-number="${escapeHtml(personalNumber)}"
        type="button"
    >
        ✏️ Upraviť
    </button>

</div>

                        </article>
                    `;

                })
                .join("");
        document
    .querySelectorAll(".edit-employee-button")
    .forEach(button => {

        button.onclick = () => {

            const personalNumber =
                button.dataset.personalNumber;

            editingEmployee =
                employees.find(employee =>
                    String(
                       employee.employee_number
                    ) === personalNumber
                );
            if (!editingEmployee) {
    return;
}

document.getElementById(
    "employeeNameInput"
).value =
    editingEmployee.name || "";

document.getElementById(
    "employeeSurnameInput"
).value =
    editingEmployee.surname || "";

document.getElementById(
    "employeePersonalNumberInput"
).value =
    editingEmployee.employee_number || "";

document.getElementById(
    "employeeChipInput"
).value =
    editingEmployee.chip || "";

document.getElementById(
    "employeeRoleInput"
).value =
    editingEmployee.role || "employee";
            
document.getElementById(
    "deactivateEmployeeWrapper"
).hidden = false;

document.getElementById(
    "deactivateEmployeeCheckbox"
).checked = false;
            
employeeModal.hidden =
    false;

        };

    });
        };
  const activeEmployees =
    employees.filter(employee =>
        employee.active !== false
    );

renderEmployeesList(
    activeEmployees
);

        
        if (searchInput) {

    searchInput.value = "";

    searchInput.oninput = () => {

        const searchValue =
            searchInput.value
                .trim()
                .toLowerCase();

        const filteredEmployees =
             activeEmployees.filter(employee => {

                const fullName =
                    `${employee.surname || ""} ${employee.name || ""}`
                        .toLowerCase();

                const personalNumber =
    String(
        employee.employee_number || ""
    ).toLowerCase();

                return (
                    fullName.includes(searchValue) ||
                    personalNumber.includes(searchValue)
                );

            });

        renderEmployeesList(
            filteredEmployees
        );

    };

}
    } catch (error) {

        console.error(
            "Chyba pri načítaní zamestnancov:",
            error
        );

        container.innerHTML = `
            <p class="error-message">
                Zamestnancov sa nepodarilo načítať.
            </p>
        `;
    }
}
function renderWeeklyMenuForm() {

    const container =
        document.getElementById(
            "weeklyMenuAccordion"
        );

    if (!container) {
        return;
    }

    const days = [
        "Pondelok",
        "Utorok",
        "Streda",
        "Štvrtok",
        "Piatok"
    ];

    container.innerHTML = "";

    days.forEach((day, index) => {

        const key =
            day.toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );

        let html = `
            <details
                class="weekly-menu-day"
                ${index === 0 ? "open" : ""}
            >

                <summary>
                    ${day}
                </summary>

                <div class="weekly-menu-day-content">

                    <label for="${key}Soup">
    Polievka
</label>

                    <textarea
                        id="${key}Soup"
                        rows="2"
                    ></textarea>
        `;

        for (let i = 1; i <= 6; i++) {

            html += `
               <label for="${key}Menu${i}">
    Menu ${i}
</label>

                <textarea
                    id="${key}Menu${i}"
                    rows="2"
                ></textarea>
            `;
        }

        html += `
                </div>

            </details>
        `;

        container.insertAdjacentHTML(
            "beforeend",
            html
        );

    });

}
function formatDateForInput(date) {

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


function setWeeklyMenuDateRange() {

    if (
        !weeklyMenuFrom
        || !weeklyMenuTo
    ) {
        return;
    }

    let fromDate;

    if (weeklyMenuFrom.value) {

        fromDate =
            new Date(
                `${weeklyMenuFrom.value}T12:00:00`
            );

    } else {

        const today =
            new Date();
const dayOfWeek =
    today.getDay();

const daysFromMonday =
    dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;

fromDate =
    new Date(today);

fromDate.setDate(
    today.getDate()
    - daysFromMonday
);

        weeklyMenuFrom.value =
            formatDateForInput(
                fromDate
            );

    }

    const toDate =
        new Date(fromDate);

    toDate.setDate(
        fromDate.getDate() + 4
    );

    weeklyMenuTo.value =
        formatDateForInput(
            toDate
        );

}


weeklyMenuFrom?.addEventListener(
    "change",
    async () => {

        setWeeklyMenuDateRange();

        await loadWeeklyMenuFromDatabase();

    }
);
function getWeeklyMenuData() {

    const data = {};

    const days = [
        "pondelok",
        "utorok",
        "streda",
        "stvrtok",
        "piatok"
    ];

    days.forEach(day => {

        data[day] = {

            soup:
                document.getElementById(
                    `${day}Soup`
                )?.value ?? "",

            menu1:
                document.getElementById(
                    `${day}Menu1`
                )?.value ?? "",

            menu2:
                document.getElementById(
                    `${day}Menu2`
                )?.value ?? "",

            menu3:
                document.getElementById(
                    `${day}Menu3`
                )?.value ?? "",

            menu4:
                document.getElementById(
                    `${day}Menu4`
                )?.value ?? "",

            menu5:
                document.getElementById(
                    `${day}Menu5`
                )?.value ?? "",

            menu6:
                document.getElementById(
                    `${day}Menu6`
                )?.value ?? ""

        };

    });

    return data;

}
async function recognizeWeeklyMenuImage(
    imageBase64,
    contentType,
    statusElement
) {

    if (!window.Tesseract) {
        throw new Error(
            "Tesseract.js sa nenačítal."
        );
    }

    if (!imageBase64) {
        throw new Error(
            "Edge Function neposlala obrázok menu."
        );
    }

    const imageDataUrl =
        `data:${contentType || "image/jpeg"};base64,${imageBase64}`;

    const worker =
        await Tesseract.createWorker(
            "slk",
            1,
            {
                logger: message => {

                    console.log(
                        "OCR:",
                        message
                    );

                    if (
                        statusElement
                        && message.status ===
                            "recognizing text"
                    ) {

                        const percent =
                            Math.round(
                                (message.progress || 0)
                                * 100
                            );

                        statusElement.textContent =
                            `Rozpoznávam menu... ${percent} %`;
                    }

                }
            }
        );

    try {

        const result =
            await worker.recognize(
                imageDataUrl
            );

        return (
            result?.data?.text
            || ""
        ).trim();

    } finally {

        await worker.terminate();

    }

}
function cleanWeeklyMenuText(text) {

    return String(text || "")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();

}


function cleanMenuItem(text) {

    return String(text || "")
        // odstráni cenu na konci
        .replace(
            /\s*[\d.,:]*\s*(6,90|9,20)\s*€?\s*$/i,
            ""
        )

        // odstráni zvyšky alergénov pred cenou
        .replace(
            /\s+[.,:+]?\d(?:[.,:]\d)*\s*$/g,
            ""
        )

        .replace(/\s+/g, " ")
        .trim();

}


function parseWeeklyMenuText(text) {

    const normalizedText =
        cleanWeeklyMenuText(text);

    const dayDefinitions = [
        {
            key: "pondelok",
            pattern: "Pondelok"
        },
        {
            key: "utorok",
            pattern: "Utorok"
        },
        {
            key: "streda",
            pattern: "Streda"
        },
        {
    key: "stvrtok",
    // OCR môže napísať Štvrtok, Štvrok, Stvrtok alebo Stvrok
    pattern: "(?:Š|S)tv(?:rt|r)ok"
},
        {
            key: "piatok",
            pattern: "Piatok"
        }
    ];

    const result = {};

    dayDefinitions.forEach(
        (day, index) => {

            const nextDay =
                dayDefinitions[index + 1];

            const endPattern =
                nextDay
                    ? `(?=${nextDay.pattern}\\s*:)`
                    : `(?=Appetit Obedové menu|Polievka samostatne|Alergény:|$)`;

            const dayRegex =
                new RegExp(
                    `${day.pattern}\\s*:\\s*([\\s\\S]*?)${endPattern}`,
                    "i"
                );

            const dayMatch =
                normalizedText.match(
                    dayRegex
                );

            if (!dayMatch) {

                result[day.key] = {
                    soup: "",
                    menu1: "",
                    menu2: "",
                    menu3: "",
                    menu4: "",
                    menu5: "",
                    menu6: ""
                };

                return;
            }

            const dayText =
                dayMatch[1].trim();

            // Polievka je všetko pred Menu 1
            const soupMatch =
                dayText.match(
                    /^([\s\S]*?)(?=\s*1\.\s*\d+g?\s*\/)/i
                );

            let soup =
                soupMatch
                    ? soupMatch[1]
                    : "";

            soup = soup
                .replace(
                    /^\s*0[,.]33[l1]\s*/i,
                    ""
                )
                .replace(
                    /\s*(?:1[.,:]*3?[.,:]*)?\s*2ks chlieb\s*$/i,
                    ""
                )
                .replace(/\s+/g, " ")
                .trim();

            const parsedDay = {
                soup,
                menu1: "",
                menu2: "",
                menu3: "",
                menu4: "",
                menu5: "",
                menu6: ""
            };

            for (
                let menuNumber = 1;
                menuNumber <= 6;
                menuNumber++
            ) {

                const nextNumber =
                    menuNumber + 1;

                const menuRegex =
                    new RegExp(
                        `${menuNumber}\\.\\s*\\d+g?\\s*\\/([\\s\\S]*?)`
                        + (
                            menuNumber < 6
                                ? `(?=\\s*${nextNumber}\\.\\s*\\d+g?\\s*\\/)`
                                : "$"
                        ),
                        "i"
                    );

                const menuMatch =
                    dayText.match(
                        menuRegex
                    );

                if (menuMatch) {

                    parsedDay[
                        `menu${menuNumber}`
                    ] = cleanMenuItem(
                        menuMatch[1]
                    );
                }

            }

            result[day.key] =
                parsedDay;

        }
    );

    return result;

}


function fillWeeklyMenuForm(menuData) {

    const days = [
        "pondelok",
        "utorok",
        "streda",
        "stvrtok",
        "piatok"
    ];

    days.forEach(day => {

        const dayData =
            menuData[day];

        if (!dayData) {
            return;
        }

        const soupInput =
            document.getElementById(
                `${day}Soup`
            );

        if (soupInput) {
            soupInput.value =
                dayData.soup || "";
        }

        for (
            let menuNumber = 1;
            menuNumber <= 6;
            menuNumber++
        ) {

            const input =
                document.getElementById(
                    `${day}Menu${menuNumber}`
                );

            if (input) {

                input.value =
                    dayData[
                        `menu${menuNumber}`
                    ] || "";
            }

        }

    });

}
async function loadWeeklyMenuFromDatabase() {

    const fromInput =
        document.getElementById(
            "weeklyMenuFrom"
        );

    const resultElement =
        document.getElementById(
            "weeklyMenuImportResult"
        );

    if (!fromInput?.value) {
        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("weekly_menu")
                .select(`
                    day_of_week,
                    soup,
                    menu1,
                    menu2,
                    menu3,
                    menu4,
                    menu5,
                    menu6
                `)
                .eq(
                    "week_from",
                    fromInput.value
                )
                .order(
                    "day_of_week",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        const menuData = {
            pondelok: {},
            utorok: {},
            streda: {},
            stvrtok: {},
            piatok: {}
        };

        const dayKeys = [
            "pondelok",
            "utorok",
            "streda",
            "stvrtok",
            "piatok"
        ];

        (data || []).forEach(row => {

            const key =
                dayKeys[
                    Number(row.day_of_week) - 1
                ];

            if (!key) {
                return;
            }

            menuData[key] = {
                soup: row.soup || "",
                menu1: row.menu1 || "",
                menu2: row.menu2 || "",
                menu3: row.menu3 || "",
                menu4: row.menu4 || "",
                menu5: row.menu5 || "",
                menu6: row.menu6 || ""
            };

        });

        fillWeeklyMenuForm(
            menuData
        );

        if (resultElement) {

            resultElement.textContent =
                data?.length
                    ? "Uložené menu bolo načítané."
                    : "Pre tento týždeň ešte nie je uložené menu.";

            resultElement.className =
                "message";
        }

    } catch (error) {

        console.error(
            "Chyba pri načítaní uloženého menu:",
            error
        );

        if (resultElement) {

            resultElement.textContent =
                error?.message
                || "Uložené menu sa nepodarilo načítať.";

            resultElement.className =
                "message error-message";
        }
    }
}
async function loadWeeklyMenuFromDatabase() {

    const fromInput =
        document.getElementById(
            "weeklyMenuFrom"
        );

    const resultElement =
        document.getElementById(
            "weeklyMenuImportResult"
        );

    if (!fromInput?.value) {
        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("weekly_menu")
                .select(`
                    day_of_week,
                    soup,
                    menu1,
                    menu2,
                    menu3,
                    menu4,
                    menu5,
                    menu6
                `)
                .eq(
                    "week_from",
                    fromInput.value
                )
                .order(
                    "day_of_week",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        const menuData = {
            pondelok: {},
            utorok: {},
            streda: {},
            stvrtok: {},
            piatok: {}
        };

        const dayKeys = [
            "pondelok",
            "utorok",
            "streda",
            "stvrtok",
            "piatok"
        ];

        (data || []).forEach(row => {

            const key =
                dayKeys[
                    Number(row.day_of_week) - 1
                ];

            if (!key) {
                return;
            }

            menuData[key] = {
                soup: row.soup || "",
                menu1: row.menu1 || "",
                menu2: row.menu2 || "",
                menu3: row.menu3 || "",
                menu4: row.menu4 || "",
                menu5: row.menu5 || "",
                menu6: row.menu6 || ""
            };

        });

        fillWeeklyMenuForm(
            menuData
        );

        if (resultElement) {

    if (data?.length) {

        resultElement.textContent = "";
        resultElement.className =
            "message";

    } else {

        resultElement.textContent =
            "Pre tento týždeň ešte nie je uložené menu.";

        resultElement.className =
            "message";

    }

}
    } catch (error) {

        console.error(
            "Chyba pri načítaní uloženého menu:",
            error
        );

        if (resultElement) {

            resultElement.textContent =
                error?.message
                || "Uložené menu sa nepodarilo načítať.";

            resultElement.className =
                "message error-message";
        }
    }
}
