const CACHE_NAME = "stockiq-v1"

// Why: cache these files so app loads even with slow connection
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js"
]

// install event - cache all files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE)
        })
    )
})

// fetch event - serve from cache if available
// Why: makes app load faster and work offline for static files
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request)
        })
    )
})
