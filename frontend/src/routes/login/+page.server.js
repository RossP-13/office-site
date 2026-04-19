import { validateCredentials } from '$lib/server/auth.js';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (await validateCredentials(username, password)) {
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
		return {
			error: 'Invalid credentials'
		};
	}
};
