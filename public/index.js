function init() {
	let username = localStorage.getItem('username');
	if (!username) {
		username = window.prompt('Enter a username (for game leaderboard)');
		localStorage.setItem('username', username);
	}

	registerServiceWorker();
	setTimeout(showLeaderboard, 1000);
}

async function postHighScore(score) {
	let username = localStorage.getItem('username');
	const res = await fetch('/api/score', { method: 'post', body: JSON.stringify({ username, score }) }).then((r) => r.json());
	await showLeaderboard();
}

async function showLeaderboard() {
	const ol = document.getElementById('leaderboard');
	const list = await fetch('/api/score').then((r) => r.json());
	ol.innerHTML = list.map((i) => `<li>${Object.keys(i)[0]} - ${Object.values(i)[0]}</li>`).join('');
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
