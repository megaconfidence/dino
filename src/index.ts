interface Env {
	leaderboard: KVNamespace;
}
interface Payload {
	username: string;
	score: number;
}
export default {
	async fetch(request, env, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const reqStr = `${request.method}:${url.pathname}`;
		switch (reqStr) {
			case 'POST:/api/score':
				const { username, score } = await request.json<Payload>();
				await env.leaderboard.put(username, '', { metadata: { username, score } });
				return Response.json({ ok: true });
			case 'GET:/api/score':
				const list = await env.leaderboard.list();
				const sorted = list.keys
					.map((i) => i.metadata)
					.sort((a: any, b: any) => b.score - a.score)
					.map((i: any) => ({ [i.username]: i.score }));
				return Response.json(sorted);
			default:
				return new Response('not found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
