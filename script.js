// =====================================
// OBEDY TMV
// Navigácia, zamestnanci a prihlasovanie
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadEmployees();
    setupNavigation();
    setupLogin();
 function setupOrderButton() {

    const confirmOrderButton =
        document.getElementById(
            "confirmOrderButton"
        );

    if (!confirmOrderButton) return;


    confirmOrderButton.addEventListener(
        "click",
        async () => {

            const selectedChoices =
                document.querySelectorAll(
                    ".meal-choice:checked"
                );

            const orderMessage =
                document.getElementById(
                    "orderMessage"
                );


            if (selectedChoices.length === 0) {

                orderMessage.textContent =
                    "Vyberte aspoň jeden obed.";

                orderMessage.className =
                    "message error-message";

                return;

            }


            const employeeSelect =
                document.getElementById(
                    "employeeSelect"
                );

            const employeeId =
                localStorage.getItem(
                    "loggedEmployee"
                )
                || employeeSelect?.value;


            if (!employeeId) {

                orderMessage.textContent =
                    "Najprv sa prihláste.";

                orderMessage.className =
                    "message error-message";

                return;

            }


            const selectedEmployee =
                [...employeeSelect.options].find(
                    option =>
                        option.value === employeeId
                );

            const employeeName =
                selectedEmployee
                    ? selectedEmployee.textContent.trim()
                    : employeeId;


            const noSoup =
                document
                    .getElementById("noSoup")
                    ?.checked || false;


            const orderDate =
                new Date()
                    .toISOString()
                    .slice(0, 10);


            const groupedMenus = {};


            selectedChoices.forEach(choice => {

                const menuId =
                    choice.dataset.menuId;

                const option =
                    choice.dataset.option;

                const menuCard =
                    choice.closest(".menu-card");

                const menuName =
                    menuCard
                        ?.querySelector("h3")
                        ?.textContent
                        ?.trim()
                    || `Menu ${menuId}`;


                if (!groupedMenus[menuId]) {

                    groupedMenus[menuId] = {
                        employee_id: employeeId,
                        employee_name: employeeName,
                        order_date: orderDate,
                        menu_id: String(menuId),
                        menu_name: menuName,
                        dining: false,
                        takeaway: false,
                        no_soup: noSoup,
                        issued: false
                    };

                }


                if (option === "dining") {
                    groupedMenus[menuId].dining = true;
                }

                if (option === "takeaway") {
                    groupedMenus[menuId].takeaway = true;
                }

            });


            const rows =
                Object.values(groupedMenus);


            confirmOrderButton.disabled = true;

            confirmOrderButton.textContent =
                "Ukladám objednávku...";

            orderMessage.textContent = "";

            orderMessage.className =
                "message";


            try {

                const { error: deleteError } =
                    await supabaseClient
                        .from("orders")
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


                const { error: insertError } =
                    await supabaseClient
                        .from("orders")
                        .insert(rows);


                if (insertError) {
                    throw insertError;
                }


                orderMessage.textContent =
                    "Objednávka bola úspešne uložená.";

                orderMessage.className =
                    "message success-message";


            } catch (error) {

                console.error(
                    "Chyba pri ukladaní objednávky:",
                    error
                );

                orderMessage.textContent =
                    "Objednávku sa nepodarilo uložiť.";

                orderMessage.className =
                    "message error-message";

            } finally {

                confirmOrderButton.disabled = false;

                confirmOrderButton.textContent =
                    "Potvrdiť objednávku";

            }

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
