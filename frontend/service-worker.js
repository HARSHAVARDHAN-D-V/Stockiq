// service worker disabled - was causing caching issues with API calls
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", () => self.clients.claim())