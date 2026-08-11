// 6. PRIHLÁSENIE A VLASTNÝ PIN
// =====================================

function setupLogin() {

    const loginButton =
        document.getElementById(
            "loginButton"
        );
    
const forgotPinButton = document.getElementById("forgotPinButton");
    
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


    if (
        !loginButton
        || !select
        || !pinInput
        || !pinConfirm
        || !pinConfirmWrapper
        || !rememberMe
    ) {

        return;

    }


    function updatePinMode() {

        const employeeId =
            select.value;

        pinInput.value = "";
        pinConfirm.value = "";

        clearLoginMessage();


        if (!employeeId) {

            pinConfirmWrapper.hidden = true;

            loginButton.textContent =
                "Prihlásiť";

            return;

        }


        const savedPin =
            localStorage.getItem(
                `pin_${employeeId}`
            );


        if (savedPin) {

            pinConfirmWrapper.hidden = true;

            loginButton.textContent =
                "Prihlásiť";

        } else {

            pinConfirmWrapper.hidden = false;

            loginButton.textContent =
                "Vytvoriť PIN";

        }

    }


  select.addEventListener(
    "change",
    updatePinMode
);

updatePinMode();
    forgotPinButton?.addEventListener(
    "click",
    forgotPin
);


    loginButton.addEventListener(
        "click",
        () => {

            const employeeId =
                select.value;

            const pin =
                pinInput.value.trim();

            const confirmPin =
                pinConfirm.value.trim();


            if (!employeeId) {

                showLoginError(
                    "Vyberte zamestnanca."
                );

                return;

            }


            if (!/^\d{4}$/.test(pin)) {

                showLoginError(
                    "PIN musí obsahovať presne 4 čísla."
                );

                return;

            }


            const pinKey =
                `pin_${employeeId}`;

            const savedPin =
                localStorage.getItem(
                    pinKey
                );


            // PIN sa vytvára iba prvýkrát
            if (!savedPin) {

                pinConfirmWrapper.hidden =
                    false;


                if (
                    !/^\d{4}$/.test(
                        confirmPin
                    )
                ) {

                    showLoginError(
                        "Potvrďte svoj 4-miestny PIN."
                    );

                    return;

                }


                if (pin !== confirmPin) {

                    showLoginError(
                        "PIN-y sa nezhodujú."
                    );

                    return;

                }


                localStorage.setItem(
                    pinKey,
                    pin
                );

            } else {

                // Pri ďalšom prihlásení zadá PIN iba raz
                if (pin !== savedPin) {

                    showLoginError(
                        "Nesprávny PIN."
                    );

                    return;

                }

            }


            // Prihlásenie počas otvorenej karty
            sessionStorage.setItem(
                "loggedEmployee",
                employeeId
            );

            updatePermissions();

            // Dlhodobé prihlásenie iba pri zaškrtnutí
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


            pinInput.value = "";
            pinConfirm.value = "";

            clearLoginMessage();


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

    openOrderScreen(
        employeeId
    );

} else if (
    requestedScreen ===
    "myOrdersScreen"
) {

    openMyOrdersScreen(
        employeeId
    );

} else if (
    requestedScreen ===
    "profileScreen"
) {

    loadProfile().then(() => {

        showScreen(
            "profileScreen"
        );

    });

} else {

    showScreen(
        requestedScreen
    );

}

        }
    );
    }
async function forgotPin() {

    const select =
        document.getElementById(
            "employeeSelect"
        );

    if (!select || !select.value) {

        showLoginError(
            "Najprv vyberte zamestnanca."
        );

        return;
    }

    const selectedOption =
        select.options[
            select.selectedIndex
        ];

    const name =
        selectedOption.dataset.name;

    const surname =
        selectedOption.dataset.surname;

    if (!name || !surname) {

        showLoginError(
            "Údaje zamestnanca sa nepodarilo načítať."
        );

        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("employees")
                .select("email")
                .eq("name", name)
                .eq("surname", surname)
                .single();

        if (error) {
            throw error;
        }

        if (!data?.email) {

            alert(
                "Pre tento účet nie je uložená e-mailová adresa na obnovu PIN-u.\n\nPo prihlásení si ju doplň vo svojom profile, aby si si v prípade zabudnutého PIN-u mohol(a) jednoducho nastaviť nový."
            );

            return;
        }

       const code =
    Math.floor(
        100000 + Math.random() * 900000
    ).toString();

sessionStorage.setItem(
    "pinResetCode",
    code
);

const { error: functionError } =
    await supabaseClient.functions.invoke(
        "send-pin-code",
        {
            body: {
                email: data.email,
                code: code
            }
        }
    );
        
console.log("Kód:", code);
console.log("Function error:", functionError);
        
if (functionError) {

    console.error(functionError);

    alert(
        "E-mail sa nepodarilo odoslať."
    );

    return;
}

sessionStorage.setItem(
    "pinResetEmployeeId",
    select.value
);

const resetPinModal =
    document.getElementById(
        "resetPinModal"
    );

const resetPinText =
    document.getElementById(
        "resetPinText"
    );

const resetCodeInput =
    document.getElementById(
        "resetCodeInput"
    );

const resetCodeError =
    document.getElementById(
        "resetCodeError"
    );

if (
    !resetPinModal
    || !resetPinText
    || !resetCodeInput
    || !resetCodeError
) {
    alert(
        "Okno na obnovu PIN-u sa nepodarilo otvoriť."
    );
    return;
}

resetPinText.textContent =
    "Na e-mail " +
    data.email +
    " sme poslali 6-miestny overovací kód.";

resetCodeInput.value = "";
resetCodeError.textContent = "";
resetPinModal.hidden = false;

setTimeout(() => {
    resetCodeInput.focus();
}, 100);
    } catch (error) {

        console.error(
            "Chyba pri obnove PIN-u:",
            error
        );

        alert(
            "E-mailovú adresu sa nepodarilo overiť."
        );
    }
}
async function loadProfile() {

    const profileFullName =
        document.getElementById(
            "profileFullName"
        );

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    if (
        !profileFullName
        || !profileEmail
    ) {
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

        profileFullName.textContent =
            "-";

        profileEmail.textContent =
            "-";

        return;
    }

    try {

        let query =
            supabaseClient
                .from("employees")
                .select(
                    "name, surname, email"
                );

        if (
            employeeId.includes("_")
        ) {

            const [
                surname,
                ...nameParts
            ] =
                employeeId.split("_");

            const name =
                nameParts.join("_");

            query =
                query
                    .eq(
                        "surname",
                        surname
                    )
                    .eq(
                        "name",
                        name
                    );

        } else {

            query =
                query.eq(
                    "employee_number",
                    employeeId
                );

        }

        const {
            data,
            error
        } =
            await query.single();

        if (error) {
            throw error;
        }

        const fullName =
            [
                data?.name,
                data?.surname
            ]
                .filter(Boolean)
                .join(" ");

        profileFullName.textContent =
            fullName || "-";

        profileEmail.textContent =
            data?.email
            || "E-mail nie je zadaný";

    } catch (error) {

        console.error(
            "Chyba pri načítaní profilu:",
            error
        );

        profileFullName.textContent =
            "Profil sa nepodarilo načítať";

        profileEmail.textContent =
            "-";

    }

}

function clearLoginMessage() {

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.className =
        "message";

}


let messageModalTimeout = null;

function showMessageModal(
    title,
    text
) {

    const modal =
        document.getElementById(
            "messageModal"
        );

    const titleElement =
        document.getElementById(
            "messageModalTitle"
        );

    const textElement =
        document.getElementById(
            "messageModalText"
        );

    const closeButton =
        document.getElementById(
            "closeMessageModalButton"
        );

    if (
        !modal
        || !titleElement
        || !textElement
        || !closeButton
    ) {
        return;
    }

    function closeModal() {

        modal.hidden = true;

        if (messageModalTimeout) {

            clearTimeout(
                messageModalTimeout
            );

            messageModalTimeout = null;
        }
    }

    titleElement.textContent =
        title;

    textElement.textContent =
        text;

    modal.hidden = false;

    closeButton.onclick =
        closeModal;

    clearTimeout(
        messageModalTimeout
    );

    messageModalTimeout =
        setTimeout(
            closeModal,
            3000
        );

}
function showLoginError(message) {

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    if (!loginMessage) return;

    loginMessage.textContent = message;

    loginMessage.className =
        "message error";

}
// =====================================
