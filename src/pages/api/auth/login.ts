import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect, locals }) => {
	const url = new URL(request.url);
	const sessionId = url.searchParams.get('session');
	const provider = url.searchParams.get('provider'); // 'google' or 'microsoft'
	const isPrimary = url.searchParams.get('is_primary') === '1' ? 1 : 0;

	if (!sessionId || !provider) {
		return new Response('Missing session or provider parameter', { status: 400 });
	}

	// Handle proxied requests in production where url.origin might be incorrect
	const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
	const protocol = request.headers.get('x-forwarded-proto') || (url.protocol.includes('https') ? 'https' : 'http');
	const origin = `${protocol}://${host}`;
	const redirectUri = new URL('/api/auth/callback', origin).toString();

	// Create state object to pass context to the callback
	const stateObj = {
		sessionId,
		provider,
		isPrimary
	};
	// Encode state to Base64 to safely pass through OAuth
	const state = btoa(JSON.stringify(stateObj));

	let authUrl = '';

	if (provider === 'google') {
		const clientId = locals.runtime.env.GOOGLE_CLIENT_ID;
		if (!clientId) return new Response('Google OAuth not configured', { status: 500 });

		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
			access_type: 'offline', // Request refresh token
			prompt: 'consent', // Force consent screen to guarantee refresh token is provided
			state: state
		});
		authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	} else if (provider === 'microsoft') {
		const clientId = locals.runtime.env.MS_CLIENT_ID;
		if (!clientId) return new Response('Microsoft OAuth not configured', { status: 500 });

		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			scope: 'openid email profile offline_access Calendars.Read Calendars.ReadWrite',
			response_mode: 'query',
			state: state
		});
		authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
	} else {
		return new Response('Invalid provider', { status: 400 });
	}

	return redirect(authUrl);
};
