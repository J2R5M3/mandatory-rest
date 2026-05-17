import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals, redirect }) => {
	const url = new URL(request.url);
	const sessionId = url.searchParams.get('session');
	const email = url.searchParams.get('email');

	if (!sessionId || !email) {
		return new Response('Missing session or email parameter', { status: 400 });
	}

	try {
		const participantId = `participant-${Date.now()}`;
		const tokenId = `token-${Date.now()}`;

		// Insert Participant
		await locals.runtime.env.DB.prepare(
			`INSERT INTO participants (id, session_id, email) VALUES (?, ?, ?)`
		)
		.bind(participantId, sessionId, email)
		.run();

		// Insert Token
		await locals.runtime.env.DB.prepare(
			`INSERT INTO tokens (id, participant_id, provider, refresh_token, is_primary) VALUES (?, ?, ?, ?, ?)`
		)
		.bind(tokenId, participantId, 'mock_provider', 'mock_refresh_token', 1)
		.run();

		// Redirect back to the session page
		return redirect(`/s/${sessionId}`);
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
