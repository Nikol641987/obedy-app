// 3. AKTUÁLNE PRIHLÁSENÝ ZAMESTNANEC
// =====================================

function getCurrentEmployeeId() {

    return (
        sessionStorage.getItem("loggedEmployee")
        || localStorage.getItem("loggedEmployee")
        || ""
    );

}

function getCurrentUserRole() {

    const employeeId = getCurrentEmployeeId();

    const select = document.getElementById("employeeSelect");

    if (!select || !employeeId) {
        return "";
    }

    const option = [...select.options].find(
        option => option.value === employeeId
    );

    return option?.dataset?.role || "";
}
function updatePermissions() {

   const role =
    getCurrentUserRole();

const isLoggedIn =
    Boolean(role);
    console.log(
        "Aktuálna rola:",
        role
    );

    const openIssueButton =
        document.getElementById(
            "openIssueButton"
        );

    const openDashboardButton =
        document.getElementById(
            "openDashboardButton"
        );

    const openMyOrdersButton =
        document.getElementById(
            "openMyOrdersButton"
        );

    const openProfileButton =
        document.getElementById(
            "openProfileButton"
        );

    const homeLoginButton =
    document.getElementById(
        "homeLoginButton"
    );
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    const openAdminButton =
        document.getElementById(
            "openAdminButton"
        );

    const openMonthlyReportButton =
        document.getElementById(
            "openMonthlyReportButton"
        );


   // VÝDAJ OBEDOV
// Bez prihlásenia dostupný.
// Po prihlásení iba admin.
if (openIssueButton) {

    openIssueButton.hidden =
        isLoggedIn
        && role !== "admin";
}
    // MOJE OBEDY
    // Iba po prihlásení.
    if (openMyOrdersButton) {

        openMyOrdersButton.hidden =
            !isLoggedIn;
    }


    // MÔJ PROFIL
    // Iba po prihlásení.
    if (openProfileButton) {

        openProfileButton.hidden =
            !isLoggedIn;
    }


    // ODHLÁSIŤ SA
    // Iba po prihlásení.
    if (logoutButton) {

        logoutButton.hidden =
            !isLoggedIn;
    }


    // STAV VÝDAJA OBEDOV
    // Iba admin a issue.
    if (openDashboardButton) {

        openDashboardButton.hidden =
            !(
                role === "admin"
                || role === "issue"
            );
    }


    // ADMINISTRÁCIA
    // Iba admin.
    if (openAdminButton) {

        openAdminButton.hidden =
            role !== "admin";
    }


    // MESAČNÝ VÝKAZ
    // Iba admin.
    if (openMonthlyReportButton) {

        openMonthlyReportButton.hidden =
            role !== "admin";
    }
// PRIHLÁSIŤ SA
if (homeLoginButton) {
    homeLoginButton.hidden =
        isLoggedIn;
}
}
// =====================================
