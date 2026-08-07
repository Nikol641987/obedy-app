function setupMonthlyReport() {

    const generateButton =
        document.getElementById(
            "generateMonthlyReportButton"
        );

    const exportButton =
        document.getElementById(
            "exportMonthlyReportButton"
        );

    const dailyExportButton =
        document.getElementById(
            "exportDailyReportButton"
        );


    generateButton?.addEventListener(
        "click",
        generateMonthlyReport
    );

    exportButton?.addEventListener(
        "click",
        exportMonthlyReportToExcel
    );

    dailyExportButton?.addEventListener(
        "click",
        exportDailyReportToExcel
    );

}


async function generateMonthlyReport() {

    const monthInput =
        document.getElementById(
            "monthlyReportMonth"
        );

    const summary =
        document.getElementById(
            "monthlyReportSummary"
        );

    const container =
        document.getElementById(
            "monthlyReportContainer"
        );

    const exportButton =
        document.getElementById(
            "exportMonthlyReportButton"
        );

    const dailyExportButton =
        document.getElementById(
            "exportDailyReportButton"
        );


    if (
        !monthInput
        || !summary
        || !container
    ) {
        return;
    }


    if (!monthInput.value) {

        summary.textContent =
            "Vyberte mesiac.";

        summary.className =
            "message error-message";

        return;
    }


    summary.textContent =
        "Načítavam údaje...";

    summary.className =
        "message";

    container.innerHTML = "";


    if (exportButton) {
        exportButton.hidden = true;
    }

    if (dailyExportButton) {
        dailyExportButton.hidden = true;
    }


    const [year, month] =
        monthInput.value.split("-");


    const fromDate =
        `${year}-${month}-01`;


    const lastDay =
        new Date(
            Number(year),
            Number(month),
            0
        ).getDate();


    const toDate =
        `${year}-${month}-${String(lastDay).padStart(2, "0")}`;


    try {

       const [
    ordersResult,
    employeesResult
] = await Promise.all([

    supabaseClient
        .from("meal_orders")
        .select(`
            employee_id,
            employee_name,
            order_date
        `)
        .gte(
            "order_date",
            fromDate
        )
        .lte(
            "order_date",
            toDate
        ),

    supabaseClient
        .from("employees")
        .select(`
            name,
            surname,
            employee_number
        `)

]);


if (ordersResult.error) {
    throw ordersResult.error;
}


if (employeesResult.error) {
    throw employeesResult.error;
}


const orders =
    ordersResult.data || [];

const employees =
    employeesResult.data || [];
        
        const employeeMap =
            new Map();


        employees.forEach(employee => {

            const personalNumber =
    String(
        employee.employee_number || ""
    ).trim();


            const fullName =
                [
                    employee.surname,
                    employee.name
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();


            const oldEmployeeId =
                `${employee.surname}_${employee.name}`;


            if (personalNumber) {

                employeeMap.set(
                    personalNumber,
                    {
                        personalNumber,
                        fullName
                    }
                );

            }


            employeeMap.set(
                oldEmployeeId,
                {
                    personalNumber,
                    fullName
                }
            );


            if (fullName) {

                employeeMap.set(
                    fullName,
                    {
                        personalNumber,
                        fullName
                    }
                );

            }

        });


        const employeeTotals =
            new Map();


        orders.forEach(order => {

            const employeeId =
                String(
                    order.employee_id || ""
                ).trim();


            const savedName =
                String(
                    order.employee_name || ""
                ).trim();


            const employee =
                employeeMap.get(employeeId)
                || employeeMap.get(savedName);


            const personalNumber =
                employee?.personalNumber
                || employeeId
                || "-";


            const fullName =
                employee?.fullName
                || savedName
                || employeeId
                || "Neznámy zamestnanec";


            const employeeKey =
                personalNumber !== "-"
                    ? personalNumber
                    : fullName;


            if (!employeeTotals.has(employeeKey)) {

                employeeTotals.set(
                    employeeKey,
                    {
                        personalNumber,
                        fullName,
                        total: 0,
                        days: {}
                    }
                );

            }


            const employeeRow =
                employeeTotals.get(employeeKey);


            employeeRow.total += 1;


           const orderDate =
    String(order.order_date || "")
        .trim();

const datePart =
    orderDate.split("T")[0];

const dateParts =
    datePart.split("-");

const day =
    Number(dateParts[2]);


            if (
                Number.isInteger(day)
                && day >= 1
                && day <= lastDay
            ) {

                employeeRow.days[day] =
                    (employeeRow.days[day] || 0) + 1;

            }

        });


        monthlyReportDailyRows =
            [...employeeTotals.values()]
                .sort((a, b) =>

                    a.fullName.localeCompare(
                        b.fullName,
                        "sk"
                    )

                );


        monthlyReportRows =
            monthlyReportDailyRows.map(
                employee => ({
                    personalNumber:
                        employee.personalNumber,

                    fullName:
                        employee.fullName,

                    total:
                        employee.total
                })
            );


        monthlyReportSelectedMonth =
            monthInput.value;


        monthlyReportDaysInMonth =
            lastDay;


        summary.textContent =
            `Spolu objednaných obedov: ${orders.length}`;

        summary.className =
            "message success-message";


        if (
            monthlyReportRows.length === 0
        ) {

            container.innerHTML = `
                <p>
                    Za vybraný mesiac nie sú uložené žiadne objednávky.
                </p>
            `;

            return;

        }


        container.innerHTML = `
            <div class="monthly-report-table">

                <div class="monthly-report-row monthly-report-header">

                    <div>
                        Osobné číslo
                    </div>

                    <div>
                        Zamestnanec
                    </div>

                    <div>
                        Počet obedov
                    </div>

                </div>

                ${monthlyReportRows
                    .map(employee => `
                        <div class="monthly-report-row">

                            <div>
                                ${escapeHtml(
                                    employee.personalNumber
                                )}
                            </div>

                            <div>
                                ${escapeHtml(
                                    employee.fullName
                                )}
                            </div>

                            <div>
                                ${employee.total}
                            </div>

                        </div>
                    `)
                    .join("")}

            </div>
        `;


        if (exportButton) {
            exportButton.hidden = false;
        }


        if (dailyExportButton) {
            dailyExportButton.hidden = false;
        }


    } catch (error) {

        console.error(
            "Chyba mesačného výkazu:",
            error
        );


        monthlyReportRows = [];
        monthlyReportDailyRows = [];
        monthlyReportSelectedMonth = "";
        monthlyReportDaysInMonth = 0;


        summary.textContent =
            "Výkaz sa nepodarilo načítať.";

        summary.className =
            "message error-message";

        container.innerHTML = "";


        if (exportButton) {
            exportButton.hidden = true;
        }


        if (dailyExportButton) {
            dailyExportButton.hidden = true;
        }

    }

}


function exportMonthlyReportToExcel() {

    if (
        monthlyReportRows.length === 0
    ) {

        alert(
            "Najprv vygenerujte mesačný výkaz."
        );

        return;

    }


    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "Knižnica na vytvorenie Excelu sa nenačítala."
        );

        return;

    }


    const excelData = [

        [
            "Osobné číslo",
            "Zamestnanec",
            "Počet obedov"
        ],

        ...monthlyReportRows.map(
            employee => [

                employee.personalNumber,

                employee.fullName,

                employee.total

            ]
        )

    ];


    const totalMeals =
        monthlyReportRows.reduce(
            (
                sum,
                employee
            ) => sum + employee.total,
            0
        );


    excelData.push([]);

    excelData.push([
        "",
        "Spolu objednaných obedov",
        totalMeals
    ]);


    const worksheet =
        XLSX.utils.aoa_to_sheet(
            excelData
        );


    worksheet["!cols"] = [

        {
            wch: 18
        },

        {
            wch: 32
        },

        {
            wch: 18
        }

    ];


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Mesačný výkaz"
    );


    const [
        year,
        month
    ] = monthlyReportSelectedMonth.split("-");


    XLSX.writeFile(
        workbook,
        `Mesacny_vykaz_obedov_${month}_${year}.xlsx`
    );

}


function exportDailyReportToExcel() {

    if (
        monthlyReportDailyRows.length === 0
        || !monthlyReportSelectedMonth
    ) {

        alert(
            "Najprv vygenerujte mesačný výkaz."
        );

        return;

    }


    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "Knižnica na vytvorenie Excelu sa nenačítala."
        );

        return;

    }


    const [
        year,
        month
    ] = monthlyReportSelectedMonth.split("-");


    const monthNames = [
        "január",
        "február",
        "marec",
        "apríl",
        "máj",
        "jún",
        "júl",
        "august",
        "september",
        "október",
        "november",
        "december"
    ];


    const monthName =
        monthNames[
            Number(month) - 1
        ];


    const dayColumns =
        Array.from(
            {
                length:
                    monthlyReportDaysInMonth
            },
            (_, index) => index + 1
        );


    const headerRow = [

        "Osobné číslo",

        "Zamestnanec",

        ...dayColumns.map(day => {

            const date =
                new Date(
                    Number(year),
                    Number(month) - 1,
                    day
                );

            const dayOfWeek =
                date.getDay();

            let weekendText = "";

            if (dayOfWeek === 6) {
                weekendText = " So";
            }

            if (dayOfWeek === 0) {
                weekendText = " Ne";
            }

            return (
                `${String(day).padStart(2, "0")}.${month}${weekendText}`
            );

        }),

        "Spolu"

    ];


    const dailyTotals =
        dayColumns.map(day =>

            monthlyReportDailyRows.reduce(
                (
                    sum,
                    employee
                ) =>
                    sum
                    + (
                        employee.days[day]
                        || 0
                    ),
                0
            )

        );


    const totalMeals =
        monthlyReportDailyRows.reduce(
            (
                sum,
                employee
            ) =>
                sum + employee.total,
            0
        );


    const titleRow = [

        `Denný výkaz obedov – ${monthName} ${year}`

    ];


    const generatedRow = [

        `Vygenerované: ${new Date().toLocaleString("sk-SK")}`

    ];


    const employeeCountRow = [

        `Počet zamestnancov: ${monthlyReportDailyRows.length}`

    ];


    const totalRow = [

        "",

        "Spolu za deň",

        ...dailyTotals,

        totalMeals

    ];


    const employeeRows =
        monthlyReportDailyRows.map(
            employee => [

                employee.personalNumber,

                employee.fullName,

                ...dayColumns.map(day => {

                    const count =
                        employee.days[day]
                        || 0;

                    return count > 0
                        ? count
                        : "";

                }),

                employee.total

            ]
        );


    const excelData = [

        titleRow,

        generatedRow,

        employeeCountRow,

        [],

        headerRow,

        ...employeeRows,

        totalRow

    ];


    const worksheet =
        XLSX.utils.aoa_to_sheet(
            excelData
        );


    worksheet["!cols"] = [

        {
            wch: 16
        },

        {
            wch: 30
        },

        ...dayColumns.map(day => {

            const date =
                new Date(
                    Number(year),
                    Number(month) - 1,
                    day
                );

            const isWeekend =
                date.getDay() === 0
                || date.getDay() === 6;

            return {
                wch: isWeekend
                    ? 9
                    : 7
            };

        }),

        {
            wch: 10
        }

    ];


    worksheet["!autofilter"] = {

        ref:
            `A5:${XLSX.utils.encode_col(
                headerRow.length - 1
            )}${employeeRows.length + 5}`

    };


    worksheet["!merges"] = [

        {
            s: {
                r: 0,
                c: 0
            },

            e: {
                r: 0,
                c:
                    headerRow.length - 1
            }
        },

        {
            s: {
                r: 1,
                c: 0
            },

            e: {
                r: 1,
                c:
                    headerRow.length - 1
            }
        },

        {
            s: {
                r: 2,
                c: 0
            },

            e: {
                r: 2,
                c:
                    headerRow.length - 1
            }
        }

    ];


    worksheet["!freeze"] = {

        xSplit: 2,

        ySplit: 5

    };


    worksheet["!pageSetup"] = {

        orientation: "landscape",

        fitToWidth: 1,

        fitToHeight: 0,

        paperSize: 9

    };


    worksheet["!margins"] = {

        left: 0.3,

        right: 0.3,

        top: 0.5,

        bottom: 0.5,

        header: 0.2,

        footer: 0.2

    };


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Denný výkaz"
    );


    XLSX.writeFile(
        workbook,
        `Denny_vykaz_obedov_${month}_${year}.xlsx`
    );

}

let editingEmployee =
    null;
