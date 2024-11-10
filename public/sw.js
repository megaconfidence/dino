const addResourcesToCache = async (resources) => {
	const cache = await caches.open('v1');
	await cache.addAll(resources);
};

self.addEventListener('install', (event) => {
	self.skipWaiting();
	event.addRoutes({
		condition: { urlPattern: '/api/*' },
		source: 'network',
	});
	event.waitUntil(
		addResourcesToCache([
			'/',
			'/images/objects-1x.png',
			'/images/objects-2x.png',
			'/index.html',
			'/index.js',
			'/scripts/engine.js',
			'/scripts/mobile.js',
			'/scripts/page.js',
			'/scripts/state.js',
			'/scripts/template.js',
			'/scripts/time.js',
			'/scripts/utils.js',
			'/sounds/hit.ogx',
			'/sounds/press.ogx',
			'/sounds/reached.ogx',
			'/style.css',
			'/favicon.ico',
		]),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

const putInCache = async (request, response) => {
	const cache = await caches.open('v1');
	await cache.put(request, response);
};

const cacheFirst = async (request) => {
	const responseFromCache = await caches.match(request);
	if (responseFromCache) {
		return responseFromCache;
	}
	const responseFromNetwork = await fetch(request);
	putInCache(request, responseFromNetwork.clone());
	return responseFromNetwork;
};

self.addEventListener('fetch', (event) => {
	event.respondWith(cacheFirst(event.request));
});
