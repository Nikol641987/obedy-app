// 5. NAČÍTANIE ZAMESTNANCOV
// =====================================

async function loadEmployees() {

    const select =
        document.getElementById(
            "employeeSelect"
        );

    if (!select) return;


    try {

        const { data: employees, error } =
    await supabaseClient
        .from("employees")
        .select("*");

if (error) {

    throw error;

}
        
window.adminEmployeesData =
    employees;

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

            if (employee.active === false) return;


            const option =
                document.createElement("option");

option.value =
    employee.employee_number
    && employee.employee_number !== "None"

        ? String(
            employee.employee_number
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
    employee.has_chip
        ? "true"
        : "false";
            option.dataset.role =
    employee.role || "";
            option.dataset.maxMenuNumber =
    employee.max_menu_number
        ? String(employee.max_menu_number)
        : "5";


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
