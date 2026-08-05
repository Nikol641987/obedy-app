const CACHE_NAME =
    "obedy-tmv-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./supabase.js",
    "./manifest.json",
    "./assets/favicon.png"
];

self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        FILES_TO_CACHE
                    );

                })
        );

    }
);

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            caches
                .keys()
                .then(cacheNames => {

                    return Promise.all(
                        cacheNames
                            .filter(
                                cacheName =>
                                    cacheName !==
                                    CACHE_NAME
                            )
                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )
                    );

                })
                .then(() =>
                    self.clients.claim()
                )
        );

    }
);

self.addEventListener(
    "message",
    event => {

        if (
            event.data?.type ===
            "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }

    }
);

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }

        event.respondWith(
            fetch(
                event.request
            )
                .then(response => {

                    if (
                        !response
                        || response.status !== 200
                        || response.type === "opaque"
                    ) {

                        return response;

                    }

                    const responseClone =
                        response.clone();

                    caches
                        .open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                event.request,
                                responseClone
                            );

                        });

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })
        );

    }
);
