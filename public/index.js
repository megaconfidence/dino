function init() {
	let username = localStorage.getItem('username');
	if (!username) {
		username = window.prompt('Enter a username (for game leaderboard)');
		localStorage.setItem('username', username);
	}
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

setTimeout(showLeaderboard, 1000);
init();
