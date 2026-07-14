// =====================================
// OBEDY APP
// Načítanie zamestnancov + prihlásenie
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadEmployees();

    const select = document.getElementById("employeeSelect");

    select.addEventListener("change", () => {

        localStorage.setItem("lastEmployee", select.value);

    });


    const loginButton = document.getElementById("loginButton");

    if (loginButton) {

        const pinInput = document.getElementById("pinInput");
        const rememberMe = document.getElementById("rememberMe");
        const loginMessage = document.getElementById("loginMessage");


        loginButton.addEventListener("click", () => {

            const employeeId = select.value;
            const pin = pinInput.value;


            if (!employeeId) {
                loginMessage.textContent = "Vyberte zamestnanca.";
                return;
            }


           if (pin === "1234") {

    loginMessage.textContent = "";

    document.querySelector(".login-card").classList.add("logged");

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

    loadMenus();

} else {

    loginMessage.textContent =
        "Nesprávny PIN.";

}

        });

    }

});



// =====================================
// NAČÍTANIE ZAMESTNANCOV
// =====================================

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

        firstOption.textContent =
            "-- Vyberte zamestnanca --";


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

        const lastEmployee =
            localStorage.getItem("lastEmployee");


        if (lastEmployee) {

            select.value = lastEmployee;

        }



    } catch (error) {

        console.error(error);


        select.innerHTML =
            "<option>Chyba pri načítaní zamestnancov</option>";

    }

}



// =====================================
// NAČÍTANIE MENU
// =====================================

async function loadMenus() {

    const container =
        document.getElementById("menuContainer");


    try {

        const response =
            await fetch("menus.json");


        const menus =
            await response.json();


        container.innerHTML = "";



        menus.forEach(menu => {


            if (!menu.active) return;



            const button =
                document.createElement("button");


            button.className =
                "btn btn-outline-primary w-100 mt-2";


            button.textContent =
                menu.name;



            container.appendChild(button);


        });



    } catch (error) {


        console.error(error);


        container.innerHTML =
            "Chyba pri načítaní menu";


    }

}
