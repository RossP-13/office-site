import { updateUsername, updatePassword } from '$lib/server/auth.js';
import { redirect, fail } from '@sveltejs/kit';

export const actions = {
	updateUsername: async ({ request, cookies }) => {
		const formData = await request.formData();
		const newUsername = formData.get('newUsername');
		const currentUsername = cookies.get('auth_user');

		if (!currentUsername) {
			return fail(401, { error: 'Not authenticated' });
		}

		if (!newUsername) {
			return fail(400, { error: 'New username is required' });
		}

		try {
			const success = updateUsername(currentUsername, newUsername);
			if (success) {
				// Update the cookie with new username
				cookies.set('auth_user', newUsername, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					maxAge: 60 * 60 * 24 * 7 // 7 days
				});
				return { success: true, message: 'Username updated successfully' };
			} else {
				return fail(500, { error: 'Failed to update username' });
			}
		} catch (error) {
			console.error('Error updating username:', error);
			return fail(500, { error: 'Internal server error' });
		}
	},

	updatePassword: async ({ request, cookies }) => {
		const formData = await request.formData();
		const newPassword = formData.get('newPassword');
		const currentUsername = cookies.get('auth_user');

		if (!currentUsername) {
			return fail(401, { error: 'Not authenticated' });
		}

		if (!newPassword) {
			return fail(400, { error: 'New password is required' });
		}

		try {
			const success = updatePassword(currentUsername, newPassword);
			if (success) {
				return { success: true, message: 'Password updated successfully' };
			} else {
				return fail(500, { error: 'Failed to update password' });
			}
		} catch (error) {
			console.error('Error updating password:', error);
			return fail(500, { error: 'Internal server error' });
		}
	}
};