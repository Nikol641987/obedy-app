// 15. DÁTUM PRE DATABÁZU
// =====================================

function formatDateForDatabase(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

function formatShortDate(date) {

    return date.toLocaleDateString(
        "sk-SK",
        {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        }
    );

}
function getOrderDate() {

    return selectedOrderDate || getTodayDate();

}
function getTodayDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatOrderDate(date) {

    return new Date(
        `${date}T12:00:00`
    ).toLocaleDateString(
        "sk-SK",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// =====================================
// 16. BEZPEČNÉ ZOBRAZENIE TEXTU
// =====================================

function escapeHtml(text) {

    const element =
        document.createElement("div");

    element.textContent =
        String(text ?? "");

    return element.innerHTML;

}
