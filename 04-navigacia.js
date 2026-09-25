// =====================================
// 4. NAVIGÁCIA
// =====================================

let isNavigationInitialized = false;

async function recognizeWeeklyMenuImage(
    imageBase64,
    contentType,
    statusElement
) {
    console.log("OCR INPUT:", contentType);
    
    console.log("NOVÁ OCR FUNKCIA SA SPUSTILA");

    if (!imageBase64) {
        throw new Error(
            "Edge Function neposlala súbor menu."
        );
    }

    const isPdf =
        String(contentType || "")
            .toLowerCase()
            .includes("pdf");

    /*
     * PDF:
     * Najprv sa pokúsime prečítať text priamo z PDF.
     * Tesseract použijeme iba vtedy, ak PDF nemá
     * použiteľnú textovú vrstvu.
     */
    if (isPdf) {
        if (!window.pdfjsLib) {
            throw new Error(
                "PDF.js sa nenačítal."
            );
        }

        const binaryString = atob(imageBase64);

        const bytes = new Uint8Array(
            binaryString.length
        );

        for (
            let i = 0;
            i < binaryString.length;
            i++
        ) {
            bytes[i] =
                binaryString.charCodeAt(i);
        }

        const pdf =
            await pdfjsLib.getDocument({
                data: bytes
            }).promise;

        console.log(
            "PDF počet strán:",
            pdf.numPages
        );

        let directPdfText = "";

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {
            if (statusElement) {
                statusElement.textContent =
                    `Čítam text PDF – strana ${pageNumber} z ${pdf.numPages}...`;
            }

            const page =
                await pdf.getPage(
                    pageNumber
                );

            const textContent =
                await page.getTextContent();

            const pageText =
                textContent.items
                    .map(item => item.str || "")
                    .join(" ");

            directPdfText +=
                pageText + "\n";
        }

        directPdfText =
            directPdfText.trim();

        console.log(
            "Text priamo z PDF:",
            directPdfText
        );

        /*
         * Ak PDF obsahuje dostatok textu,
         * použijeme ho priamo.
         */
        if (
            directPdfText &&
            directPdfText.length > 10
        ) {
            return directPdfText;
        }

        /*
         * Ak PDF nemá textovú vrstvu,
         * pokračujeme OCR cez Tesseract.
         */
        console.log(
            "PDF nemá použiteľnú textovú vrstvu. Spúšťam OCR."
        );

        const imagesToRecognize = [];

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {
            if (statusElement) {
                statusElement.textContent =
                    `Pripravujem OCR – strana ${pageNumber} z ${pdf.numPages}...`;
            }

            const page =
                await pdf.getPage(
                    pageNumber
                );

            const viewport =
                page.getViewport({
                    scale: 4
                });

            const canvas =
                document.createElement(
                    "canvas"
                );

            const context =
                canvas.getContext("2d");

            canvas.width =
                viewport.width;

            canvas.height =
                viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            imagesToRecognize.push(
                canvas.toDataURL(
                    "image/png"
                )
            );
        }

        return await recognizeImagesWithTesseract(
            imagesToRecognize,
            statusElement
        );
    }

    /*
     * Bežný obrázok menu.
     */
    const imageDataUrl =
        `data:${contentType || "image/jpeg"};base64,${imageBase64}`;

    return await recognizeImagesWithTesseract(
        [imageDataUrl],
        statusElement
    );
}


/*
 * Pomocná funkcia pre Tesseract.
 */
async function recognizeImagesWithTesseract(
    images,
    statusElement
) {
    if (!window.Tesseract) {
        throw new Error(
            "Tesseract.js sa nenačítal."
        );
    }

    const worker =
        await Tesseract.createWorker(
            "slk",
            1,
            {
                logger: message => {
                    console.log(
                        "OCR:",
                        message
                    );

                    if (
                        statusElement &&
                        message.status ===
                            "recognizing text"
                    ) {
                        const percent =
                            Math.round(
                                (message.progress || 0)
                                * 100
                            );

                        statusElement.textContent =
                            `Rozpoznávam menu... ${percent} %`;
                    }
                }
            }
        );

    try {
        let fullText = "";

        for (
            let i = 0;
            i < images.length;
            i++
        ) {
            if (statusElement) {
                statusElement.textContent =
                    `Rozpoznávam menu – strana ${i + 1} z ${images.length}...`;
            }

            const result =
                await worker.recognize(
                    images[i]
                );

            fullText +=
                (result?.data?.text || "") +
                "\n";
        }

                return fullText.trim();
    } finally {
        await worker.terminate();
    }
}
        
// =====================================
// SETUP NAVIGÁCIE
// =====================================

function setupNavigation() {

    if (isNavigationInitialized) {
        return;
    }

    const backButtons =
        document.querySelectorAll(
            "[data-back-home]"
        );

    backButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showScreen("homeScreen");

            }
        );

    });


    const adminBackButtons =
        document.querySelectorAll(
            "[data-back-admin]"
        );

    adminBackButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showScreen("adminScreen");

            }
        );

    });


    isNavigationInitialized = true;

}


// =====================================
// SPUSTENIE PO NAČÍTANÍ HTML
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeNavigation();

    }
);


// =====================================
// HLAVNÁ INICIALIZÁCIA
// =====================================

function initializeNavigation() {

    // =====================================
    // DOM ELEMENTY
    // =====================================

    const openOrderButton =
        document.getElementById(
            "openOrderButton"
        );

    const openWeeklyMenuButton =
        document.getElementById(
            "openWeeklyMenuButton"
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

    const openMonthlyReportButton =
        document.getElementById(
            "openMonthlyReportButton"
        );

    const openAdminButton =
        document.getElementById(
            "openAdminButton"
        );

    const adminEmployeesButton =
        document.getElementById(
            "adminEmployeesButton"
        );

    const adminWeeklyMenuButton =
        document.getElementById(
            "adminWeeklyMenuButton"
        );

    const adminWeeklyMenuScreen =
        document.getElementById(
            "adminWeeklyMenuScreen"
        );

    const adminEmailOrdersButton =
        document.getElementById(
            "adminEmailOrdersButton"
        );

    const adminEmailOrdersScreen =
        document.getElementById(
            "adminEmailOrdersScreen"
        );

    const restaurantEmailInput =
        document.getElementById(
            "restaurantEmailInput"
        );

    const orderEmailTimeInput =
        document.getElementById(
            "orderEmailTimeInput"
        );

    const automaticOrderEmailEnabled =
        document.getElementById(
            "automaticOrderEmailEnabled"
        );

    const saveOrderEmailSettingsButton =
        document.getElementById(
            "saveOrderEmailSettingsButton"
        );

    const sendTestOrderEmailButton =
        document.getElementById(
            "sendTestOrderEmailButton"
        );

    const orderEmailHistory =
        document.getElementById(
            "orderEmailHistory"
        );

    const downloadWeeklyMenuButton =
        document.getElementById(
            "downloadWeeklyMenuButton"
        );

    const saveWeeklyMenuButton =
        document.getElementById(
            "saveWeeklyMenuButton"
        );

    const weeklyMenuImportResult =
        document.getElementById(
            "weeklyMenuImportResult"
        );

    const weeklyMenuFrom =
        document.getElementById(
            "weeklyMenuFrom"
        );

    const weeklyMenuTo =
        document.getElementById(
            "weeklyMenuTo"
        );

    const addEmployeeButton =
        document.getElementById(
            "addEmployeeButton"
        );

    const cancelEmployeeButton =
        document.getElementById(
            "cancelEmployeeButton"
        );

    const saveEmployeeButton =
        document.getElementById(
            "saveEmployeeButton"
        );

    const employeeMaxMenuInput =
        document.getElementById(
            "employeeMaxMenuInput"
        );

    const deactivateEmployeeCheckbox =
        document.getElementById(
            "deactivateEmployeeCheckbox"
        );

    const employeeModal =
        document.getElementById(
            "employeeModal"
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


    // =====================================
    // OBJEDNÁVKA
    // =====================================

    openOrderButton?.addEventListener(
        "click",
        () => {

            const employeeId =
                getCurrentEmployeeId();

            if (employeeId) {

                openWeekSelectionScreen(
                    employeeId
                );

            } else {

                sessionStorage.setItem(
                    "requestedScreen",
                    "orderScreen"
                );

                showScreen(
                    "loginScreen"
                );

            }

        }
    );


    // =====================================
    // TÝŽDENNÉ MENU
    // =====================================

    openWeeklyMenuButton?.addEventListener(
        "click",
        () => {

            showScreen(
                "weeklyMenuScreen"
            );

        }
    );


    // =====================================
    // PROBLÉM / ISSUE
    // =====================================

    openIssueButton?.addEventListener(
        "click",
        async () => {

            showScreen(
                "issueScreen"
            );

            try {

                await renderIssueDashboard();

            } catch (error) {

                console.error(
                    "Chyba pri načítaní issue dashboardu:",
                    error
                );

            }

        }
    );


    // =====================================
    // DASHBOARD
    // =====================================

    openDashboardButton?.addEventListener(
        "click",
        async () => {

            showScreen(
                "dashboardScreen"
            );

            try {

                await renderIssueDashboard();

            } catch (error) {

                console.error(
                    "Chyba pri načítaní dashboardu:",
                    error
                );

            }

        }
    );


    // =====================================
    // MESAČNÝ REPORT
    // =====================================

    openMonthlyReportButton?.addEventListener(
        "click",
        () => {

            showScreen(
                "monthlyReportScreen"
            );

        }
    );


    // =====================================
    // ADMIN
    // =====================================

    openAdminButton?.addEventListener(
        "click",
        () => {

            showScreen(
                "adminScreen"
            );

        }
    );


    // =====================================
    // ADMIN - ZAMESTNANCI
    // =====================================

    adminEmployeesButton?.addEventListener(
        "click",
        async () => {

            showScreen(
                "adminEmployeesScreen"
            );

            try {

                await renderAdminEmployees();

            } catch (error) {

                console.error(
                    "Chyba pri načítaní zamestnancov:",
                    error
                );

            }

        }
    );


    // =====================================
    // ADMIN - TÝŽDENNÉ MENU
    // =====================================

    adminWeeklyMenuButton?.addEventListener(
        "click",
        async () => {

            try {

                renderWeeklyMenuForm();

                setWeeklyMenuDateRange();

                showScreen(
                    "adminWeeklyMenuScreen"
                );

                // Nastav closed stav až po
                // vykreslení formulára
                document
                    .querySelectorAll(
                        "#adminWeeklyMenuScreen .weekly-menu-day"
                    )
                    .forEach(day => {

                        day.open = false;

                    });

                await loadWeeklyMenuFromDatabase();

            } catch (error) {

                console.error(
                    "Chyba pri otváraní týždenného menu:",
                    error
                );

            }

        }
    );


    // =====================================
    // ADMIN - EMAIL OBJEDNÁVKY
    // =====================================

    adminEmailOrdersButton?.addEventListener(
        "click",
        async () => {

            showScreen(
                "adminEmailOrdersScreen"
            );

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from(
                            "order_email_settings"
                        )
                        .select(
                            "restaurant_email, send_time, enabled"
                        )
                        .order(
                            "id",
                            {
                                ascending: true
                            }
                        )
                        .limit(1)
                        .maybeSingle();


                if (error) {
                    throw error;
                }


                if (restaurantEmailInput) {

                    restaurantEmailInput.value =
                        data?.restaurant_email
                        || "";

                }


                if (orderEmailTimeInput) {

                    orderEmailTimeInput.value =
                        data?.send_time
                            ? String(
                                data.send_time
                            ).slice(0, 5)
                            : "";

                }


                if (
                    automaticOrderEmailEnabled
                ) {

                    automaticOrderEmailEnabled.checked =
                        Boolean(
                            data?.enabled
                        );

                }

            } catch (error) {

                console.error(
                    "Chyba pri načítaní nastavení e-mailu:",
                    error
                );

            }


            await loadOrderEmailHistory();

        }
    );


    // =====================================
    // HISTÓRIA EMAILOV
    // =====================================

    async function loadOrderEmailHistory() {

        if (!orderEmailHistory) {
            return;
        }


        orderEmailHistory.innerHTML =
            "Načítavam históriu...";


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "order_email_history"
                    )
                    .select(`
                        id,
                        created_at,
                        order_date,
                        restaurant_email,
                        total_orders,
                        dining_orders,
                        takeaway_orders,
                        order_summary,
                        status,
                        error_message,
                        confirmed_at
                    `)
                    .order(
                        "order_date",
                        {
                            ascending: false
                        }
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {
                throw error;
            }


            if (
                !data ||
                data.length === 0
            ) {

                orderEmailHistory.innerHTML =
                    "Zatiaľ nebola odoslaná žiadna objednávka.";

                return;

            }


            orderEmailHistory.innerHTML =
                data
                    .map(item => {

                        const formattedDate =
                            item.order_date
                                ? new Date(
                                    item.order_date +
                                    "T12:00:00"
                                ).toLocaleDateString(
                                    "sk-SK"
                                )
                                : "";


                        const formattedTime =
                            item.created_at
                                ? new Date(
                                    item.created_at
                                ).toLocaleTimeString(
                                    "sk-SK",
                                    {
                                        hour:
                                            "2-digit",
                                        minute:
                                            "2-digit",
                                        timeZone:
                                            "Europe/Bratislava"
                                    }
                                )
                                : "";


                        const formattedConfirmedTime =
                            item.confirmed_at
                                ? new Date(
                                    item.confirmed_at
                                ).toLocaleTimeString(
                                    "sk-SK",
                                    {
                                        hour:
                                            "2-digit",
                                        minute:
                                            "2-digit",
                                        timeZone:
                                            "Europe/Bratislava"
                                    }
                                )
                                : "";


                        let statusText =
                            "";

                        let statusColor =
                            "";


                        if (
                            item.status ===
                                "sent"
                            ||
                            item.status ===
                                "test_sent"
                        ) {

                            statusText =
                                "🔴 Odoslaná";

                            statusColor =
                                "#dc2626";

                        } else if (
                            item.status ===
                            "confirmed"
                        ) {

                            statusText =
                                "🟢 Potvrdená";

                            statusColor =
                                "#16a34a";

                        } else {

                            statusText =
                                "❌ Chyba";

                            statusColor =
                                "#dc2626";

                        }


                        return `
                            <div class="order-email-history-item">

                                <div class="history-col history-date">

                                    <div class="history-icon">
                                        📅
                                    </div>

                                    <div>

                                        <strong>
                                            ${formattedDate}
                                        </strong>

                                        <div
                                            class="history-status"
                                            style="
                                                color: ${statusColor};
                                                font-weight: bold;
                                            "
                                        >
                                            ${statusText}
                                        </div>

                                        ${
                                            item.confirmed_at
                                                ? `
                                                    <div
                                                        style="
                                                            font-size: 11px;
                                                            color: #6b7280;
                                                            margin-top: 2px;
                                                        "
                                                    >
                                                        Potvrdené:
                                                        ${formattedConfirmedTime}
                                                    </div>
                                                `
                                                : ""
                                        }

                                    </div>

                                </div>


                                <div class="history-col">

                                    <div>
                                        🕒 Čas:
                                        <strong>
                                            ${formattedTime}
                                        </strong>
                                    </div>

                                    <div>
                                        👥 Spolu:
                                        <strong>
                                            ${item.total_orders || 0} ks
                                        </strong>
                                    </div>

                                </div>


                                <div class="history-col">

                                    <div>
                                        🍽️ V jedálni:
                                        <strong>
                                            ${item.dining_orders || 0} ks
                                        </strong>
                                    </div>

                                    <div>
                                        📦 Zabaliť:
                                        <strong>
                                            ${item.takeaway_orders || 0} ks
                                        </strong>
                                    </div>

                                </div>


                                <div class="history-col history-email">

                                    <div>
                                        ✉️ E-mail:
                                    </div>

                                    <div>
                                        ${item.restaurant_email || ""}
                                    </div>

                                </div>

                            </div>
                        `;

                    })
                    .join("");


        } catch (error) {

            console.error(
                "Chyba pri načítaní histórie e-mailov:",
                error
            );

            orderEmailHistory.innerHTML =
                "Históriu sa nepodarilo načítať.";

        }

    }


    // =====================================
    // ULOŽIŤ EMAIL NASTAVENIA
    // =====================================

    saveOrderEmailSettingsButton?.addEventListener(
        "click",
        async () => {

            const restaurantEmail =
                restaurantEmailInput?.value
                    .trim();

            const sendTime =
                orderEmailTimeInput?.value;

            const enabled =
                Boolean(
                    automaticOrderEmailEnabled?.checked
                );


            if (!restaurantEmail) {

                alert(
                    "Zadajte e-mail reštaurácie."
                );

                return;

            }


            if (!sendTime) {

                alert(
                    "Zadajte čas automatického odoslania."
                );

                return;

            }


            try {

                const {
                    data: existing,
                    error: loadError
                } =
                    await supabaseClient
                        .from(
                            "order_email_settings"
                        )
                        .select("id")
                        .order(
                            "id",
                            {
                                ascending: true
                            }
                        )
                        .limit(1)
                        .maybeSingle();


                if (loadError) {
                    throw loadError;
                }


                let saveError;


                if (existing?.id) {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "order_email_settings"
                            )
                            .update({
                                restaurant_email:
                                    restaurantEmail,

                                send_time:
                                    sendTime,

                                enabled:
                                    enabled
                            })
                            .eq(
                                "id",
                                existing.id
                            );

                    saveError =
                        error;

                } else {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "order_email_settings"
                            )
                            .insert({
                                restaurant_email:
                                    restaurantEmail,

                                send_time:
                                    sendTime,

                                enabled:
                                    enabled
                            });

                    saveError =
                        error;

                }


                if (saveError) {
                    throw saveError;
                }


                alert(
                    "Nastavenie bolo uložené."
                );


            } catch (error) {

                console.error(
                    "Chyba pri ukladaní nastavenia e-mailu:",
                    error
                );

                alert(
                    "Nastavenie sa nepodarilo uložiť."
                );

            }

        }
    );


    // =====================================
    // TEST EMAILU
    // =====================================

    sendTestOrderEmailButton?.addEventListener(
        "click",
        async () => {

            const email =
                restaurantEmailInput?.value
                    .trim();


            if (!email) {

                alert(
                    "Najprv zadajte e-mail reštaurácie."
                );

                return;

            }


            sendTestOrderEmailButton.disabled =
                true;

            sendTestOrderEmailButton.textContent =
                "📧 Odosielam...";


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .functions
                        .invoke(
                            "send-order-email",
                            {
                                body: {
                                    email:
                                        email,

                                    test:
                                        true
                                }
                            }
                        );


                if (error) {
                    throw error;
                }


                if (data?.error) {

                    throw new Error(
                        data.error
                    );

                }


                alert(
                    "E-mail bol úspešne odoslaný."
                );


            } catch (error) {

                console.error(
                    "Chyba pri odosielaní e-mailu:",
                    error
                );

                alert(
                    "E-mail sa nepodarilo odoslať."
                );


            } finally {

                sendTestOrderEmailButton.disabled =
                    false;

                sendTestOrderEmailButton.textContent =
                    "📧 Odoslať e-mail do reštaurácie - manuálne";

            }

        }
    );


    // =====================================
    // NAČÍTAŤ NOVÉ MENU
    // =====================================

    downloadWeeklyMenuButton?.addEventListener(
        "click",
        async () => {

            downloadWeeklyMenuButton.disabled =
                true;

            downloadWeeklyMenuButton.textContent =
                "Načítavam menu...";


            if (weeklyMenuImportResult) {

                weeklyMenuImportResult.textContent =
                    "Kontrolujem aktuálne menu na SuperObed...";

            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .functions
                        .invoke(
                            "check-4m-menu",
                            {
                                body: {}
                            }
                        );


                if (error) {
                    throw error;
                }


                if (!data?.success) {

                    throw new Error(
                        data?.error ||
                        "Menu sa nepodarilo načítať."
                    );

                }


                if (
                    data.menuAvailable ===
                    false
                ) {

                    if (weeklyMenuImportResult) {

                        weeklyMenuImportResult.textContent =
                            "Aktuálne menu zatiaľ nie je dostupné.";

                    }

                    return;

                }


                if (weeklyMenuImportResult) {

                    weeklyMenuImportResult.textContent =
                        "Pripravujem rozpoznanie menu...";

                }


                const recognizedText =
                    await recognizeWeeklyMenuImage(
                        data.fileBase64,
                        data.contentType,
                        weeklyMenuImportResult
                    );


                if (!recognizedText) {

                    throw new Error(
                        "Z obrázka sa nepodarilo rozpoznať žiadny text."
                    );

                }


                console.log(
                    "Rozpoznaný text menu:",
                    recognizedText
                );


                const parsedMenu =
                    parseWeeklyMenuText(
                        recognizedText
                    );


                console.log(
                    "Rozdelené menu:",
                    parsedMenu
                );


                fillWeeklyMenuForm(
                    parsedMenu
                );


                if (weeklyMenuImportResult) {

                    weeklyMenuImportResult.textContent =
                        "✅ Menu bolo rozpoznané a vložené do formulára. Skontroluj text a klikni Uložiť menu.";

                }


            } catch (error) {

                console.error(
                    "Načítanie menu zlyhalo:",
                    error
                );


                if (weeklyMenuImportResult) {

                    weeklyMenuImportResult.textContent =
                        error instanceof Error
                            ? error.message
                            : "Menu sa nepodarilo načítať.";

                }


            } finally {

                downloadWeeklyMenuButton.disabled =
                    false;

                downloadWeeklyMenuButton.textContent =
                    "🔄 Načítať nové menu";

            }

        }
    );


    // =====================================
    // ULOŽIŤ TÝŽDENNÉ MENU
    // =====================================

    saveWeeklyMenuButton?.addEventListener(
        "click",
        async () => {

            if (
                !weeklyMenuFrom?.value ||
                !weeklyMenuTo?.value
            ) {

                if (weeklyMenuImportResult) {

                    weeklyMenuImportResult.textContent =
                        "Najprv vyber týždeň.";

                    weeklyMenuImportResult.className =
                        "message error-message";

                }

                return;

            }


            saveWeeklyMenuButton.disabled =
                true;

            saveWeeklyMenuButton.textContent =
                "Ukladám menu...";


            if (weeklyMenuImportResult) {

                weeklyMenuImportResult.textContent =
                    "";

                weeklyMenuImportResult.className =
                    "message";

            }


            try {

                const menu =
                    getWeeklyMenuData();

                const weekFrom =
                    weeklyMenuFrom.value;


                const monday =
                    new Date(
                        `${weekFrom}T12:00:00`
                    );


                const days = [
                    {
                        key: "pondelok",
                        dayOfWeek: 1
                    },
                    {
                        key: "utorok",
                        dayOfWeek: 2
                    },
                    {
                        key: "streda",
                        dayOfWeek: 3
                    },
                    {
                        key: "stvrtok",
                        dayOfWeek: 4
                    },
                    {
                        key: "piatok",
                        dayOfWeek: 5
                    }
                ];


                const rows =
                    days.map(
                        (
                            day,
                            index
                        ) => {

                            const menuDate =
                                new Date(
                                    monday
                                );


                            menuDate.setDate(
                                monday.getDate()
                                + index
                            );


                            const dayMenu =
                                menu[
                                    day.key
                                ];


                            return {

                                week_from:
                                    weekFrom,

                                menu_date:
                                    formatDateForDatabase(
                                        menuDate
                                    ),

                                day_of_week:
                                    day.dayOfWeek,

                                soup:
                                    dayMenu
                                        ?.soup
                                        ?.trim()
                                    || null,

                                menu1:
                                    dayMenu
                                        ?.menu1
                                        ?.trim()
                                    || null,

                                menu2:
                                    dayMenu
                                        ?.menu2
                                        ?.trim()
                                    || null,

                                menu3:
                                    dayMenu
                                        ?.menu3
                                        ?.trim()
                                    || null,

                                menu4:
                                    dayMenu
                                        ?.menu4
                                        ?.trim()
                                    || null,

                                menu5:
                                    dayMenu
                                        ?.menu5
                                        ?.trim()
                                    || null,

                                menu6:
                                    dayMenu
                                        ?.menu6
                                        ?.trim()
                                    || null

                            };

                        }
                    );


                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "weekly_menu"
                        )
                        .upsert(
                            rows,
                            {
                                onConflict:
                                    "week_from,day_of_week"
                            }
                        );


                if (error) {
                    throw error;
                }


                showMessageModal(
                    "✅ Hotovo",
                    "Menu bolo úspešne uložené."
                );


                if (weeklyMenuImportResult) {

                    weeklyMenuImportResult.textContent =
                        "";

                }


            } catch (error) {

                console.error(
                    "Chyba pri ukladaní menu:",
                    error
                );


                showMessageModal(
                    "❌ Chyba",
                    error?.message ||
                    "Menu sa nepodarilo uložiť."
                );


            } finally {

                saveWeeklyMenuButton.disabled =
                    false;

                saveWeeklyMenuButton.textContent =
                    "💾 Uložiť menu";

            }

        }
    );


    // =====================================
    // PRIDAŤ ZAMESTNANCA
    // =====================================

    addEmployeeButton?.addEventListener(
        "click",
        () => {

            editingEmployee =
                null;


            if (employeeMaxMenuInput) {

                employeeMaxMenuInput.value =
                    "5";

            }


            const employeeNameInput =
                document.getElementById(
                    "employeeNameInput"
                );

            const employeeSurnameInput =
                document.getElementById(
                    "employeeSurnameInput"
                );

            const employeePersonalNumberInput =
                document.getElementById(
                    "employeePersonalNumberInput"
                );

            const employeeChipInput =
                document.getElementById(
                    "employeeChipInput"
                );

            const employeeRoleInput =
                document.getElementById(
                    "employeeRoleInput"
                );

            const deactivateEmployeeWrapper =
                document.getElementById(
                    "deactivateEmployeeWrapper"
                );


            if (employeeNameInput) {
                employeeNameInput.value = "";
            }

            if (employeeSurnameInput) {
                employeeSurnameInput.value = "";
            }

            if (employeePersonalNumberInput) {
                employeePersonalNumberInput.value = "";
            }

            if (employeeChipInput) {
                employeeChipInput.value = "";
            }

            if (employeeRoleInput) {
                employeeRoleInput.value =
                    "employee";
            }

            if (deactivateEmployeeWrapper) {
                deactivateEmployeeWrapper.hidden =
                    true;
            }

            if (deactivateEmployeeCheckbox) {
                deactivateEmployeeCheckbox.checked =
                    false;
            }

            if (employeeModal) {
                employeeModal.hidden =
                    false;
            }

        }
    );


    // =====================================
    // ZRUŠIŤ ZAMESTNANCA
    // =====================================

    cancelEmployeeButton?.addEventListener(
        "click",
        () => {

            if (employeeModal) {

                employeeModal.hidden =
                    true;

            }

        }
    );


    // =====================================
    // ULOŽIŤ ZAMESTNANCA
    // =====================================

    saveEmployeeButton?.addEventListener(
        "click",
        async () => {

            const employeeData = {

                name:
                    document.getElementById(
                        "employeeNameInput"
                    )?.value
                    ?.trim() || "",

                surname:
                    document.getElementById(
                        "employeeSurnameInput"
                    )?.value
                    ?.trim() || "",

                personalNumber:
                    document.getElementById(
                        "employeePersonalNumberInput"
                    )?.value
                    ?.trim() || "",

                chip:
                    document.getElementById(
                        "employeeChipInput"
                    )?.value
                    ?.trim() || "",

                role:
                    document.getElementById(
                        "employeeRoleInput"
                    )?.value
                    || "employee",

                maxMenuNumber:
                    Number(
                        document.getElementById(
                            "employeeMaxMenuInput"
                        )?.value
                    ) || 0

            };


            console.log(
                employeeData
            );


            if (
                editingEmployee &&
                deactivateEmployeeCheckbox?.checked
            ) {

                const confirmed =
                    confirm(
                        "Naozaj chcete deaktivovať tohto zamestnanca?"
                    );


                if (!confirmed) {
                    return;
                }

            }


            if (!editingEmployee) {

                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "employees"
                        )
                        .insert({

                            name:
                                employeeData.name,

                            surname:
                                employeeData.surname,

                            employee_number:
                                employeeData.personalNumber,

                            chip:
                                employeeData.chip ||
                                null,

                            has_chip:
                                Boolean(
                                    employeeData.chip
                                ),

                            active:
                                true,

                            role:
                                employeeData.role,

                            max_menu_number:
                                employeeData.maxMenuNumber

                        });


                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        error.message
                    );

                    return;

                }


                alert(
                    "Zamestnanec bol uložený."
                );


                if (employeeModal) {

                    employeeModal.hidden =
                        true;

                }


                await renderAdminEmployees();

                await loadEmployees();


            } else {

                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "employees"
                        )
                        .update({

                            name:
                                employeeData.name,

                            surname:
                                employeeData.surname,

                            employee_number:
                                employeeData.personalNumber,

                            chip:
                                employeeData.chip ||
                                null,

                            has_chip:
                                Boolean(
                                    employeeData.chip
                                ),

                            role:
                                employeeData.role,

                            active:
                                !Boolean(
                                    deactivateEmployeeCheckbox?.checked
                                ),

                            max_menu_number:
                                employeeData.maxMenuNumber

                        })
                        .eq(
                            "id",
                            editingEmployee.id
                        );


                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        error.message
                    );

                    return;

                }


                alert(
                    "Zamestnanec bol upravený."
                );


                if (employeeModal) {

                    employeeModal.hidden =
                        true;

                }


                editingEmployee =
                    null;


                await renderAdminEmployees();

                await loadEmployees();

            }

        }
    );


    // =====================================
    // MOJE OBJEDNÁVKY
    // =====================================

    openMyOrdersButton?.addEventListener(
        "click",
        () => {

            const employeeId =
                getCurrentEmployeeId();


            if (employeeId) {

                openMyOrdersScreen(
                    employeeId
                );

            } else {

                sessionStorage.setItem(
                    "requestedScreen",
                    "myOrdersScreen"
                );

                showScreen(
                    "loginScreen"
                );

            }

        }
    );


    // =====================================
    // PROFIL
    // =====================================

    openProfileButton?.addEventListener(
        "click",
        async () => {

            const employeeId =
                getCurrentEmployeeId();


            if (employeeId) {

                try {

                    await loadProfile();

                } catch (error) {

                    console.error(
                        "Chyba pri načítaní profilu:",
                        error
                    );

                }


                showScreen(
                    "profileScreen"
                );

            } else {

                sessionStorage.setItem(
                    "requestedScreen",
                    "profileScreen"
                );

                showScreen(
                    "loginScreen"
                );

            }

        }
    );


    // =====================================
    // PROFIL - EMAIL / PIN
    // =====================================

    const changeEmailButton =
        document.getElementById(
            "changeEmailButton"
        );

    const changePinButton =
        document.getElementById(
            "changePinButton"
        );

    const pinModal =
        document.getElementById(
            "pinModal"
        );

    const cancelPinButton =
        document.getElementById(
            "cancelPinButton"
        );

    const emailModal =
        document.getElementById(
            "emailModal"
        );

    const cancelEmailButton =
        document.getElementById(
            "cancelEmailButton"
        );


    changeEmailButton?.addEventListener(
        "click",
        () => {

            const newEmailInput =
                document.getElementById(
                    "newEmailInput"
                );

            if (newEmailInput) {
                newEmailInput.value =
                    "";
            }


            if (emailModal) {
                emailModal.hidden =
                    false;
            }

        }
    );


    changePinButton?.addEventListener(
        "click",
        () => {

            const newPinInput =
                document.getElementById(
                    "newPinInput"
                );

            if (newPinInput) {
                newPinInput.value =
                    "";
            }


            if (pinModal) {
                pinModal.hidden =
                    false;
            }

        }
    );


    cancelPinButton?.addEventListener(
        "click",
        () => {

            if (pinModal) {
                pinModal.hidden =
                    true;
            }

        }
    );


    cancelEmailButton?.addEventListener(
        "click",
        () => {

            if (emailModal) {
                emailModal.hidden =
                    true;
            }

        }
    );


    // =====================================
    // ULOŽIŤ NOVÝ PIN
    // =====================================

    const savePinButton =
        document.getElementById(
            "savePinButton"
        );


    savePinButton?.addEventListener(
        "click",
        () => {

            const newPinInput =
                document.getElementById(
                    "newPinInput"
                );

            const newPin =
                newPinInput?.value
                    ?.trim() || "";


            if (
                !/^\d{4}$/.test(
                    newPin
                )
            ) {

                alert(
                    "PIN musí mať presne 4 číslice."
                );

                return;

            }


            let employeeId =
                getCurrentEmployeeId();


            if (!employeeId) {

                employeeId =
                    sessionStorage.getItem(
                        "pinResetEmployeeId"
                    );

            }


            if (!employeeId) {

                alert(
                    "Nepodarilo sa zistiť zamestnanca."
                );

                return;

            }


            localStorage.setItem(
                `pin_${employeeId}`,
                newPin
            );


            if (pinModal) {

                pinModal.hidden =
                    true;

            }


            sessionStorage.removeItem(
                "pinResetCode"
            );

            sessionStorage.removeItem(
                "pinResetEmployeeId"
            );


            showScreen(
                "loginScreen"
            );


            const loginMessage =
                document.getElementById(
                    "loginMessage"
                );


            if (loginMessage) {

                loginMessage.textContent =
                    "✅ PIN bol úspešne zmenený. Teraz sa môžete prihlásiť.";

                loginMessage.className =
                    "message success-message";

            }

        }
    );


    // =====================================
    // ZMENA EMAILU
    // =====================================

    const saveEmailButton =
        document.getElementById(
            "saveEmailButton"
        );


    saveEmailButton?.addEventListener(
        "click",
        async () => {

            const newEmailInput =
                document.getElementById(
                    "newEmailInput"
                );


            const email =
                newEmailInput?.value
                    ?.trim() || "";


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {

                alert(
                    "Zadajte platný e-mail."
                );

                return;

            }


            const employeeId =
                sessionStorage.getItem(
                    "loggedEmployee"
                )
                ||
                localStorage.getItem(
                    "loggedEmployee"
                );


            if (!employeeId) {
                return;
            }


            const [
                surname,
                name
            ] =
                employeeId.split("_");


            const {
                error
            } =
                await supabaseClient
                    .from(
                        "employees"
                    )
                    .update({
                        email:
                            email
                    })
                    .eq(
                        "surname",
                        surname
                    )
                    .eq(
                        "name",
                        name
                    );


            if (error) {

                console.error(
                    "Chyba pri ukladaní e-mailu:",
                    error
                );

                alert(
                    "E-mail sa nepodarilo uložiť."
                );

                return;

            }


            if (emailModal) {

                emailModal.hidden =
                    true;

            }


            alert(
                "E-mail bol uložený."
            );


            await loadProfile();

        }
    );


    // =====================================
    // RESET PIN - OVERENIE KÓDU
    // =====================================

    const resetCodeInput =
        document.getElementById(
            "resetCodeInput"
        );

    const resetCodeError =
        document.getElementById(
            "resetCodeError"
        );

    const confirmResetCodeButton =
        document.getElementById(
            "confirmResetCodeButton"
        );

    const cancelResetPinButton =
        document.getElementById(
            "cancelResetPinButton"
        );


    confirmResetCodeButton?.addEventListener(
        "click",
        () => {

            const enteredCode =
                resetCodeInput?.value
                    ?.trim() || "";


            const correctCode =
                sessionStorage.getItem(
                    "pinResetCode"
                );


            if (!enteredCode) {

                if (resetCodeError) {

                    resetCodeError.textContent =
                        "Zadajte overovací kód.";

                }

                return;

            }


            if (
                enteredCode !==
                correctCode
            ) {

                if (resetCodeError) {

                    resetCodeError.textContent =
                        "Zadaný overovací kód nie je správny.";

                }

                return;

            }


            if (resetCodeError) {

                resetCodeError.textContent =
                    "";

            }


            const resetPinModal =
                document.getElementById(
                    "resetPinModal"
                );

            const pinModalElement =
                document.getElementById(
                    "pinModal"
                );

            const newPinInput =
                document.getElementById(
                    "newPinInput"
                );


            if (resetPinModal) {

                resetPinModal.hidden =
                    true;

            }


            if (newPinInput) {

                newPinInput.value =
                    "";

            }


            if (pinModalElement) {

                pinModalElement.hidden =
                    false;

            }

        }
    );


    // =====================================
    // ZRUŠIŤ RESET PIN
    // =====================================

    cancelResetPinButton?.addEventListener(
        "click",
        () => {

            const resetPinModal =
                document.getElementById(
                    "resetPinModal"
                );


            if (resetPinModal) {

                resetPinModal.hidden =
                    true;

            }


            sessionStorage.removeItem(
                "pinResetCode"
            );

            sessionStorage.removeItem(
                "pinResetEmployeeId"
            );

        }
    );


    // =====================================
    // PRIHLÁSENIE Z HOME
    // =====================================

    homeLoginButton?.addEventListener(
        "click",
        () => {

            sessionStorage.setItem(
                "requestedScreen",
                "homeScreen"
            );


            showScreen(
                "loginScreen"
            );

        }
    );


    // =====================================
    // LOGOUT
    // =====================================

    logoutButton?.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                "loggedEmployee"
            );

            localStorage.removeItem(
                "loggedEmployee"
            );

            sessionStorage.removeItem(
                "requestedScreen"
            );


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


            if (select) {
                select.value = "";
            }

            if (pinInput) {
                pinInput.value = "";
            }

            if (pinConfirm) {
                pinConfirm.value = "";
            }

            if (pinConfirmWrapper) {
                pinConfirmWrapper.hidden =
                    true;
            }

            if (rememberMe) {
                rememberMe.checked =
                    false;
            }


            clearLoginMessage();


            showScreen(
                "homeScreen"
            );


            updatePermissions();


            showMessageModal(
                "Odhlásenie",
                "Boli ste úspešne odhlásený."
            );

        }
    );


    // =====================================
    // SPUSTENIE NAVIGÁCIE
    // =====================================

    setupNavigation();


    // =====================================
    // REŠTAURÁCIA - MENU SUPEROBED
    // =====================================

    const openRestaurantMenuButton =
        document.getElementById(
            "openRestaurantMenuButton"
        );


    openRestaurantMenuButton?.addEventListener(
        "click",
        () => {

            window.open(
                "https://superobed.sk/podnik/4m-restaurant/denne-menu-34?h=3be11773ba",
                "_blank"
            );

        }
    );

}
