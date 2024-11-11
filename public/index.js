let installPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
	event.preventDefault();
	installPrompt = event;
	const installBanner = document.getElementById('install-banner');
	installBanner.removeAttribute('hidden');

	installBanner.addEventListener('click', async (e) => {
		if (!installPrompt) return;
		await installPrompt.prompt();
		installPrompt = null;
		installBanner.setAttribute('hidden', '');
	});
});

window.addEventListener('offline', () => {
	document.getElementById('offline-banner').removeAttribute('hidden');
});

window.addEventListener('online', () => {
	document.getElementById('offline-banner').setAttribute('hidden', '');
});

async function init() {
	let username = localStorage.getItem('username');
	if (!username) {
		username = window.prompt('Enter a username (for game leaderboard)');
		localStorage.setItem('username', username);
	}
	await registerServiceWorker();
	await showLeaderboard();
}

async function postHighScore(score) {
	let username = localStorage.getItem('username');
	const res = await fetch('/api/score', { method: 'post', body: JSON.stringify({ username, score }) }).then((r) => r.json());
	await showLeaderboard();
}

async function showLeaderboard() {
	const list = await fetch('/api/score').then((r) => r.json());
	const scores = list.map((i) => `<li>${Object.keys(i)[0]} - ${Object.values(i)[0]}</li>`).join('');
	document.getElementById('leaderboard').innerHTML = scores;
}

const registerServiceWorker = async () => {
	if ('serviceWorker' in navigator) {
		try {
			const registration = await navigator.serviceWorker.register('/sw.js', {
				scope: '/',
			});
			if (registration.installing) {
				console.log('Service worker installing');
			} else if (registration.waiting) {
				console.log('Service worker installed');
			} else if (registration.active) {
				console.log('Service worker active');
			}
		} catch (error) {
			console.error(`Registration failed with ${error}`);
		}
	}
};

init();
