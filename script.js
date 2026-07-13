// =====================================
// OBEDY APP
// Načítanie zamestnancov
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();


    const select = document.getElementById("employeeSelect");

    const loginButton = document.getElementById("loginButton");
const pinInput = document.getElementById("pinInput");
const loginMessage = document.getElementById("loginMessage");

    select.addEventListener("change", () => {

        loginButton.addEventListener("click", () => {

    const employeeId = select.value;
    const pin = pinInput.value;


    if (!employeeId) {

        loginMessage.textContent =
            "Vyberte zamestnanca.";

        return;

    }


    if (!pin) {

        loginMessage.textContent =
            "Zadajte PIN.";

        return;

    }


    if (pin === "1234") {

        loginMessage.textContent =
            "Prihlásenie úspešné.";

    } else {

        loginMessage.textContent =
            "Nesprávny PIN.";

    }

});

        localStorage.setItem("lastEmployee", select.value);

    });
});


async function loadEmployees() {

    const select = document.getElementById("employeeSelect");

    try {

        const response = await fetch("employees.json");

        const employees = await response.json();

        employees.sort((a, b) => {

            const menoA = `${a.surname} ${a.name}`;
            const menoB = `${b.surname} ${b.name}`;

            return menoA.localeCompare(menoB, "sk");
        });

        select.innerHTML = "";

        const firstOption = document.createElement("option");
        firstOption.value = "";
        firstOption.textContent = "-- Vyberte zamestnanca --";

        select.appendChild(firstOption);


        employees.forEach(employee => {

            if (!employee.active) return;

            const option = document.createElement("option");

            option.value = employee.id;

            option.textContent =
                `${employee.surname} ${employee.name}`;

            select.appendChild(option);

        });


        // načítanie posledného zamestnanca
        const lastEmployee = localStorage.getItem("lastEmployee");

        if (lastEmployee) {
            select.value = lastEmployee;
        }


    } catch (error) {

        console.error(error);

        select.innerHTML =
            "<option>Chyba pri načítaní zamestnancov</option>";

    }

}

async function loadMenus() {

    const container = document.getElementById("menuContainer");

    try {

        const response = await fetch("menus.json");

        const menus = await response.json();


        container.innerHTML = "";


        menus.forEach(menu => {

            if (!menu.active) return;


            const button = document.createElement("button");

            button.className = "btn btn-outline-primary w-100 mt-2";

            button.textContent = menu.name;


            container.appendChild(button);

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "Chyba pri načítaní menu";

    }

}
