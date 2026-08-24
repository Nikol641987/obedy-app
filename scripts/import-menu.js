const https = require("https");
const fs = require("fs");

const MENU_URL =
    "https://superobed.sk/podnik/appetit-obedove-menu-rozvoz/denne-menu";

async function downloadImage() {
    return new Promise((resolve, reject) => {

        https.get(
            MENU_URL,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 TMV-Obedy-Menu-Checker/1.0"
                }
            },
            response => {

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

                if (!contentType.startsWith("image/")) {
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
                    chunk => chunks.push(chunk)
                );

                response.on(
                    "end",
                    () => {

                        const buffer =
                            Buffer.concat(chunks);

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
        await downloadImage();

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
