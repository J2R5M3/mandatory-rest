import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
	const formData = await request.formData();
	const sessionId = formData.get('session_id') as string;

	if (!sessionId) {
		return new Response('Missing session_id parameter', { status: 400 });
	}

	// Mark the user as locked in for this session via a cookie
	cookies.set(`locked_in_${sessionId}`, '1', {
		path: '/',
		maxAge: 60 * 60 * 24 * 90, // 90 days
		httpOnly: true,
		secure: true,
		sameSite: 'lax'
	});

	// Redirect back to the session page to see the countdown state
	return redirect(`/s/${sessionId}`);
};
