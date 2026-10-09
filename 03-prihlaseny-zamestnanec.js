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

function canAccessIssueDashboard(role = getCurrentUserRole()) {
    return (
        role === "admin"
        || role === "issue"
        || role === "issue_admin"
    );
}

function canAccessAdminScreen(
    screenId = "adminScreen",
    role = getCurrentUserRole()
) {
    // ADMIN má prístup do celej administrácie.
    if (role === "admin") {
        return [
            "adminScreen",
            "adminEmployeesScreen",
            "adminWeeklyMenuScreen",
            "adminEmailOrdersScreen"
        ].includes(screenId);
    }

    // ISSUE a ISSUE_ADMIN môžu vstúpiť
    // do administrácie, ale iba do povolených častí.
    if (role === "issue" || role === "issue_admin") {
        return [
            "adminScreen",
            "adminWeeklyMenuScreen",
            "adminEmailOrdersScreen"
        ].includes(screenId);
    }

    return false;
}

function updatePermissions() {

   const role =
    getCurrentUserRole();

const isLoggedIn =
    Boolean(role);
    const automaticEmailCheckbox =
    document.getElementById("automaticOrderEmailEnabled");

if (automaticEmailCheckbox) {
    automaticEmailCheckbox.disabled = role !== "admin";
}
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

    const adminEmployeesButton =
        document.getElementById(
            "adminEmployeesButton"
        );

    const adminWeeklyMenuButton =
        document.getElementById(
            "adminWeeklyMenuButton"
        );

    const adminEmailOrdersButton =
        document.getElementById(
            "adminEmailOrdersButton"
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
            !canAccessIssueDashboard(role);
    }


    // ADMINISTRÁCIA
    if (openAdminButton) {

        openAdminButton.hidden =
            !canAccessAdminScreen("adminScreen", role);
    }

    if (adminEmployeesButton) {

        adminEmployeesButton.hidden =
            !canAccessAdminScreen(
                "adminEmployeesScreen",
                role
            );
    }

    if (adminWeeklyMenuButton) {

        adminWeeklyMenuButton.hidden =
            !canAccessAdminScreen(
                "adminWeeklyMenuScreen",
                role
            );
    }

    if (adminEmailOrdersButton) {

        adminEmailOrdersButton.hidden =
            !canAccessAdminScreen(
                "adminEmailOrdersScreen",
                role
            );
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
