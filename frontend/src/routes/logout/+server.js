export async function POST({ cookies }) {
	cookies.delete('auth_user', { path: '/' });
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}
