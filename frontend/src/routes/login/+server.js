import { validateCredentials } from '$lib/server/auth.js';
import { redirect } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
	const formData = await request.formData();
	const username = formData.get('username');
	const password = formData.get('password');

	if (validateCredentials(username, password)) {
		// Create a session cookie
		cookies.set('auth_user', username, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		redirect(303, '/dashboard');
	}

	// Return error - username/password combination doesn't exist
	return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json' }
	});
}
