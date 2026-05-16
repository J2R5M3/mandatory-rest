import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { id, title, duration_mins, window_start, window_end, timer_deadline, interval_days = 7 } = (await request.json()) as any;
		await locals.runtime.env.DB.prepare(
			`INSERT INTO sessions (id, title, duration_mins, window_start, window_end, timer_deadline, interval_days)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(id, title, duration_mins, window_start, window_end, timer_deadline, interval_days)
			.run();
		return new Response(JSON.stringify({ success: true }), { status: 201 });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 400 });
	}
};
