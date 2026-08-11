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

    const role = getCurrentUserRole();

    console.log("Aktuálna rola:", role);

    const openIssueButton =
        document.getElementById("openIssueButton");

    const openDashboardButton =
        document.getElementById("openDashboardButton");
    
    const openAdminButton =
    document.getElementById("openAdminButton");
    
    const openMonthlyReportButton =
    document.getElementById(
        "openMonthlyReportButton"
    );

    // Výdaj obedov vidí iba admin
if (openIssueButton) {
    openIssueButton.hidden =
        role !== "admin";
}

    // Stav výdaja obedov vidí iba admin a issue
    if (openDashboardButton) {
        openDashboardButton.hidden =
            !(role === "admin" || role === "issue");
    }
// Administráciu vidí iba admin
if (openAdminButton) {
    openAdminButton.hidden =
        role !== "admin";
    
}
    // Mesačný výkaz vidí iba admin
if (openMonthlyReportButton) {

    openMonthlyReportButton.hidden =
        role !== "admin";

}
}
// =====================================
