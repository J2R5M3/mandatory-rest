import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { id, session_id, email } = (await request.json()) as any;
		await locals.runtime.env.DB.prepare(
			`INSERT INTO participants (id, session_id, email)
			 VALUES (?, ?, ?)`,
		)
			.bind(id, session_id, email)
			.run();
		return new Response(JSON.stringify({ success: true }), { status: 201 });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 400 });
	}
};
