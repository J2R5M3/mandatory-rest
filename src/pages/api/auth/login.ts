import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect, locals }) => {
	const url = new URL(request.url);
	const sessionId = url.searchParams.get('session');
    const provider = url.searchParams.get('provider') || 'google';

	if (!sessionId) {
		return new Response('Missing session parameter', { status: 400 });
	}

    if (provider === 'google') {
        const GOOGLE_CLIENT_ID = locals.runtime.env.GOOGLE_CLIENT_ID;
        const redirectUrl = new URL(url.origin + '/api/auth/callback');

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUrl.toString(),
            response_type: 'code',
            scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
            access_type: 'offline',
            prompt: 'consent',
            state: sessionId // Pass the session ID in state so we know where they came from
        });

        return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    }

	return new Response('Unsupported provider', { status: 400 });
};
