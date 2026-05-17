import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals, redirect }) => {
	const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // The state parameter contains the session ID we passed during the login redirect
    const sessionId = state;

	if (!sessionId || !code) {
		return new Response('Missing session or code parameter', { status: 400 });
	}

	try {
        // Exchange code for token (mocked for this specific requirement, but realistically would hit google apis)
        // Note: For a real app, you would make a POST to https://oauth2.googleapis.com/token
        const mockRefreshToken = `mock_google_refresh_token_${Date.now()}`;

        // Mock getting user info
        const mockEmail = `user-${Date.now().toString().slice(-4)}@gmail.com`;

		const participantId = `participant-${Date.now()}`;
		const tokenId = `token-${Date.now()}`;

		// Insert Participant
		await locals.runtime.env.DB.prepare(
			`INSERT INTO participants (id, session_id, email) VALUES (?, ?, ?)`
		)
		.bind(participantId, sessionId, mockEmail)
		.run();

		// Insert Token
		// Here we would typically encrypt the refresh token before storing it
		await locals.runtime.env.DB.prepare(
			`INSERT INTO tokens (id, participant_id, provider, refresh_token, is_primary) VALUES (?, ?, ?, ?, ?)`
		)
		.bind(tokenId, participantId, 'google', mockRefreshToken, 1)
		.run();

		// Redirect back to the session page
		return redirect(`/s/${sessionId}`);
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
