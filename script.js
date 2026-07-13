// =====================================
// OBEDY APP
// Načítanie zamestnancov
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();

    const select = document.getElementById("employeeSelect");

    select.addEventListener("change", () => {

        localStorage.setItem("lastEmployee", select.value);

        checkPin(select.value);

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

function checkPin(employeeId) {

    const savedPin = localStorage.getItem("pin_" + employeeId);

    if (!savedPin) {

        const newPin = prompt("Vytvorte si PIN (4 čísla):");

        if (newPin && newPin.length === 4) {

            localStorage.setItem(
                "pin_" + employeeId,
                newPin
            );

            alert("PIN bol nastavený.");

        } else {

            alert("PIN musí mať 4 čísla.");

        }

    } else {

        const enteredPin = prompt("Zadajte PIN:");

        if (enteredPin !== savedPin) {

            alert("Nesprávny PIN.");

            document.getElementById("employeeSelect").value = "";

        }

    }

}
