export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'POST' && url.pathname === '/api/sessions') {
			try {
				const { id, title, duration_mins, window_start, window_end, timer_deadline } = await request.json() as any;
				await env.DB.prepare(
					`INSERT INTO sessions (id, title, duration_mins, window_start, window_end, timer_deadline)
					 VALUES (?, ?, ?, ?, ?, ?)`
				).bind(id, title, duration_mins, window_start, window_end, timer_deadline).run();
				return new Response(JSON.stringify({ success: true }), { status: 201 });
			} catch (e: any) {
				return new Response(JSON.stringify({ error: e.message }), { status: 400 });
			}
		}

		if (request.method === 'POST' && url.pathname === '/api/participants') {
			try {
				const { id, session_id, email } = await request.json() as any;
				await env.DB.prepare(
					`INSERT INTO participants (id, session_id, email)
					 VALUES (?, ?, ?)`
				).bind(id, session_id, email).run();
				return new Response(JSON.stringify({ success: true }), { status: 201 });
			} catch (e: any) {
				return new Response(JSON.stringify({ error: e.message }), { status: 400 });
			}
		}

		if (request.method === 'POST' && url.pathname === '/api/tokens') {
			try {
				const { id, participant_id, provider, refresh_token, is_primary } = await request.json() as any;
				await env.DB.prepare(
					`INSERT INTO tokens (id, participant_id, provider, refresh_token, is_primary)
					 VALUES (?, ?, ?, ?, ?)`
				).bind(id, participant_id, provider, refresh_token, is_primary).run();
				return new Response(JSON.stringify({ success: true }), { status: 201 });
			} catch (e: any) {
				return new Response(JSON.stringify({ error: e.message }), { status: 400 });
			}
		}

		return new Response('Not Found', { status: 404 });
	},

	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log(`Cron fired at ${event.cron}, time: ${event.scheduledTime}`);

		try {
			// 1. Scan for expired sessions
			const { results: expiredSessions } = await env.DB.prepare(
				`SELECT * FROM sessions WHERE timer_deadline <= datetime('now')`
			).all();

			if (!expiredSessions || expiredSessions.length === 0) {
				console.log('No expired sessions found.');
				return;
			}

			for (const session of expiredSessions) {
				console.log(`Processing expired session: ${session.id}`);

				// 2. Fetch tokens for active participants in this session
				const { results: sessionTokens } = await env.DB.prepare(
					`SELECT t.*, p.email
					 FROM tokens t
					 JOIN participants p ON t.participant_id = p.id
					 WHERE p.session_id = ?`
				).bind(session.id).all();

				// 3. Algorithm Placeholder: Find intersection
				console.log(`[Algorithm Placeholder] Executing intersection logic for session ${session.id} with ${sessionTokens.length} tokens.`);

				// Simulate finding intersection or failing
				const isSuccess = Math.random() > 0.5;

				if (isSuccess) {
					console.log(`[Success Path] Found compliant time window. Injecting events to primary calendars.`);
				} else {
					console.log(`[Failure Path] Hit 90-Day Wall. Dispatching cheerful despair mail to participants.`);
				}

				// 4. Complete Ephemeral Purge (Cascade delete will remove participants and tokens)
				console.log(`Purging session: ${session.id}`);
				await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(session.id).run();
			}
		} catch (error) {
			console.error('Error executing cron trigger:', error);
		}
	},
};
