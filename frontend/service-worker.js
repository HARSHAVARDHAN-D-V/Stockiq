const CACHE_NAME = "stockiq-v4"

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js"
]

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE)
        })
    )
})

self.addEventListener("fetch", event => {
    // Why: only cache static files, never intercept API calls
    if (event.request.url.includes("stockiq200506.mooo.com")) {
        return // let API calls go through normally
    }
    
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request)
        })
    )
})