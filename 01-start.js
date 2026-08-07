// =====================================
// OBEDY TMV
// =====================================

// =====================================
// 1. Štart aplikácie
// =====================================

let selectedOrderDate = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadEmployees();
    
    updatePermissions();

    setupNavigation();
    setupLogin();
    setupOrderButton();
    setupManualIssue();
    setupChipLogin();
    setupChipIssue();
    setupMonthlyReport();

});
