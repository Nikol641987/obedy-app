// 2. PREPÍNANIE OBRAZOVIEK
// =====================================

function showScreen(screenId) {

    document
        .querySelectorAll(".app-screen")
        .forEach(screen => {
            screen.hidden = true;
        });

    const selectedScreen =
        document.getElementById(screenId);

    if (selectedScreen) {
        selectedScreen.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
if (screenId === "loginScreen") {

    const chipInput =
        document.getElementById(
            "chipLoginInput"
        );

    if (chipInput) {

        chipInput.value = "";

        setTimeout(() => {
            chipInput.focus();
        }, 150);

    }

}
}


// =====================================
