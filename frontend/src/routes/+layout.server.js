import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
	const authUser = cookies.get('auth_user');
	const isLoginPage = url.pathname === '/login';
	
	// Redirect to login if not authenticated and not already on login page
	if (!authUser && !isLoginPage) {
		redirect(303, '/login');
	}
	
	return {
		user: authUser ? { username: authUser } : null,
		isLoginPage
	};
}

