const CACHE_NAME = 'gastos-v1';
const ASSETS = [
    './',
    './index.html',
    './dashboard.html',
    './styles.css',
    './auth.js',
    './gastos.js',
    './dashboard.js',
    './supabase.js',
    './icon.svg'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
