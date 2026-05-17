import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect }) => {
	const url = new URL(request.url);
	const sessionId = url.searchParams.get('session');

	if (!sessionId) {
		return new Response('Missing session parameter', { status: 400 });
	}

	// This is a placeholder for the actual OAuth flow.
	// For now, we'll just redirect to a mock callback handler.
	const redirectUrl = new URL('/api/auth/callback', url.origin);
	redirectUrl.searchParams.set('session', sessionId);

	// Add a dummy participant for testing
	redirectUrl.searchParams.set('email', `user-${Date.now().toString().slice(-4)}@example.com`);

	return redirect(redirectUrl.toString());
};
