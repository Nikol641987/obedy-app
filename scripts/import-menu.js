const https = require("https");
const fs = require("fs");

const MENU_URL =
    "https://superobed.sk/podnik/appetit-obedove-menu-rozvoz/denne-menu";

function downloadImage(url) {

    return new Promise((resolve, reject) => {

        https.get(
            url,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 TMV-Obedy-Menu-Checker/1.0"
                }
            },
            response => {

                // SuperObed nás môže presmerovať
                if (
                    response.statusCode >= 300 &&
                    response.statusCode < 400 &&
                    response.headers.location
                ) {

                    const redirectUrl =
                        new URL(
                            response.headers.location,
                            url
                        ).href;

                    console.log(
                        "↪️ Presmerovanie na:",
                        redirectUrl
                    );

                    downloadImage(
                        redirectUrl
                    )
                        .then(resolve)
                        .catch(reject);

                    return;
                }

                if (response.statusCode !== 200) {

                    reject(
                        new Error(
                            `SuperObed vrátil stav ${response.statusCode}.`
                        )
                    );

                    return;
                }

                const contentType =
                    response.headers["content-type"] || "";

                console.log(
                    "Content-Type:",
                    contentType
                );

                if (
                    !contentType.startsWith("image/")
                ) {

                    reject(
                        new Error(
                            `SuperObed neposlal obrázok. Typ: ${contentType}`
                        )
                    );

                    return;
                }

                const chunks = [];

                response.on(
                    "data",
                    chunk => {
                        chunks.push(chunk);
                    }
                );

                response.on(
                    "end",
                    () => {

                        const buffer =
                            Buffer.concat(
                                chunks
                            );

                        resolve({
                            buffer,
                            contentType
                        });

                    }
                );

            }
        ).on(
            "error",
            reject
        );

    });

}


async function main() {

    console.log(
        "🔄 Kontrolujem aktuálne menu na SuperObed..."
    );

    const result =
        await downloadImage(
            MENU_URL
        );

    console.log(
        `✅ Obrázok stiahnutý: ${result.buffer.length} bytes`
    );

    fs.writeFileSync(
        "/tmp/menu.jpg",
        result.buffer
    );

    console.log(
        "📸 Obrázok uložený."
    );

}


main().catch(error => {

    console.error(
        "❌ Import menu zlyhal:",
        error
    );

    process.exit(1);

});
