import type { APIRoute } from 'astro';
import { encrypt } from '../../../lib/crypto';

export const GET: APIRoute = async ({ request, locals, redirect, cookies }) => {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const stateBase64 = url.searchParams.get('state');

	if (!code || !stateBase64) {
		return new Response('Missing code or state parameter', { status: 400 });
	}

	let stateObj: { sessionId: string; provider: string; isPrimary: number };
	try {
		stateObj = JSON.parse(atob(stateBase64));
	} catch (e) {
		return new Response('Invalid state parameter', { status: 400 });
	}

	const { sessionId, provider, isPrimary } = stateObj;
	const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
	const protocol = request.headers.get('x-forwarded-proto') || (url.protocol.includes('https') ? 'https' : 'http');
	const origin = `${protocol}://${host}`;
	const redirectUri = new URL('/api/auth/callback', origin).toString();

	let refreshToken = '';
	let email = '';

	try {
		if (provider === 'google') {
			const clientId = locals.runtime.env.GOOGLE_CLIENT_ID;
			const clientSecret = locals.runtime.env.GOOGLE_CLIENT_SECRET;

			if (!clientId || !clientSecret) return new Response('Google OAuth not configured', { status: 500 });

			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: clientId,
					client_secret: clientSecret,
					redirect_uri: redirectUri,
					grant_type: 'authorization_code',
				}),
			});

			const tokenData = await tokenResponse.json() as any;
			if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

			refreshToken = tokenData.refresh_token;

			// We might not get a refresh token if the user already granted consent previously
			// and we didn't force the consent screen.
			// In production we forced it via prompt='consent' in login.ts

			if (!refreshToken) {
				console.warn('No refresh token returned from Google. This usually means the user previously authorized the app and did not re-consent.');
			}

			// Get user info to find email
			const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userInfo = await userInfoResponse.json() as any;
			email = userInfo.email;

		} else if (provider === 'microsoft') {
			const clientId = locals.runtime.env.MS_CLIENT_ID;
			const clientSecret = locals.runtime.env.MS_CLIENT_SECRET;

			if (!clientId || !clientSecret) return new Response('Microsoft OAuth not configured', { status: 500 });

			const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					client_id: clientId,
					client_secret: clientSecret,
					code,
					redirect_uri: redirectUri,
					grant_type: 'authorization_code',
				}),
			});

			const tokenData = await tokenResponse.json() as any;
			if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

			refreshToken = tokenData.refresh_token;

			// Microsoft user info via Graph API
			const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userInfo = await userInfoResponse.json() as any;
			email = userInfo.userPrincipalName || userInfo.mail || userInfo.email;
		}

		if (!email) {
			throw new Error('Failed to retrieve user email');
		}

		// Encrypt the refresh token before storing it
		// If there's no refresh token, we just store what we have or 'none' (though it defeats the purpose of the cron job)
		const encryptionKey = locals.runtime.env.ENCRYPTION_KEY || 'default_dev_encryption_key_32_chars!';
		const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken, encryptionKey) : 'none';

		// Handle Participant Tracking using cookies
		const participantCookieName = `participant_${sessionId}`;
		let participantId = cookies.get(participantCookieName)?.value;

		if (!participantId) {
			participantId = `participant-${Date.now()}`;
			// Insert new Participant
			await locals.runtime.env.DB.prepare(
				`INSERT INTO participants (id, session_id, email) VALUES (?, ?, ?)`
			)
			.bind(participantId, sessionId, email)
			.run();

			// Set cookie for 90 days to track this participant for this session
			cookies.set(participantCookieName, participantId, {
				path: '/',
				maxAge: 60 * 60 * 24 * 90,
				httpOnly: true,
				secure: true,
				sameSite: 'lax'
			});
		} else {
			// Update email if it changed? Probably not necessary, but good measure.
			await locals.runtime.env.DB.prepare(
				`UPDATE participants SET email = ? WHERE id = ? AND session_id = ?`
			)
			.bind(email, participantId, sessionId)
			.run();
		}

		const tokenId = `token-${Date.now()}`;

		// Insert Token into DB
		await locals.runtime.env.DB.prepare(
			`INSERT INTO tokens (id, participant_id, provider, refresh_token, is_primary) VALUES (?, ?, ?, ?, ?)`
		)
		.bind(tokenId, participantId, provider, encryptedRefreshToken, isPrimary)
		.run();

		// Record that a primary token exists for this user (if true)
		if (isPrimary) {
			cookies.set(`has_primary_${sessionId}`, '1', {
				path: '/',
				maxAge: 60 * 60 * 24 * 90,
				httpOnly: true,
				secure: true,
				sameSite: 'lax'
			});
		}

		// Redirect back to the session page
		return redirect(`/s/${sessionId}`);
	} catch (e: any) {
		console.error("Auth callback error:", e);
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
