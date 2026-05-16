import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { id, participant_id, provider, refresh_token, is_primary } = (await request.json()) as any;
		await locals.runtime.env.DB.prepare(
			`INSERT INTO tokens (id, participant_id, provider, refresh_token, is_primary)
			 VALUES (?, ?, ?, ?, ?)`,
		)
			.bind(id, participant_id, provider, refresh_token, is_primary)
			.run();
		return new Response(JSON.stringify({ success: true }), { status: 201 });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 400 });
	}
};
