<script>
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let data;
	export let form;

	let showPassword = false;
	let usernameForm;
	let passwordForm;

	async function handleLogout() {
		// Clear the auth cookie by redirecting to a logout endpoint
		await fetch('/logout', { method: 'POST' });
		goto('/login');
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	// Handle successful username update by reloading the page to update the displayed username
	$: if (form?.success && form?.message?.includes('Username')) {
		// Reload the page to get updated user data
		window.location.reload();
	}
</script>

<div class="min-h-screen">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Account</h1>
		<button
			on:click={handleLogout}
			class="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
		>
			Logout
		</button>
	</div>

	<div class="space-y-6">
		<div class="rounded-lg border border-gray-300 bg-white p-6">
			<p class="text-lg">
				<strong>Logged in as:</strong> {data.user.username}
			</p>
		</div>

		<!-- Change Username Section -->
		<div class="rounded-lg border border-gray-300 bg-white p-6">
			<h2 class="text-xl font-semibold mb-4">Change Username</h2>
			{#if form?.success && form?.message?.includes('Username')}
				<div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
					{form.message}
				</div>
			{:else if form?.error}
				<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{form.error}
				</div>
			{/if}
			<form method="POST" action="?/updateUsername" use:enhance bind:this={usernameForm}>
				<input type="hidden" name="action" value="updateUsername" />
				<div class="mb-4">
					<label for="newUsername" class="block text-sm font-medium text-gray-700 mb-2">
						New Username
					</label>
					<input
						type="text"
						id="newUsername"
						name="newUsername"
						required
						class="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Enter new username"
					/>
				</div>
				<button
					type="submit"
					class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
				>
					Update Username
				</button>
			</form>
		</div>

		<!-- Change Password Section -->
		<div class="rounded-lg border border-gray-300 bg-white p-6">
			<h2 class="text-xl font-semibold mb-4">Change Password</h2>
			{#if form?.success && form?.message?.includes('Password')}
				<div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
					{form.message}
				</div>
			{:else if form?.error}
				<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{form.error}
				</div>
			{/if}
			<form method="POST" action="?/updatePassword" use:enhance bind:this={passwordForm}>
				<input type="hidden" name="action" value="updatePassword" />
				<div class="mb-4">
					<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
						New Password
					</label>
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							id="newPassword"
							name="newPassword"
							required
							class="w-full px-3 text-gray-700 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Enter new password"
						/>
						<button
							type="button"
							on:click={togglePasswordVisibility}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
						>
							{#if showPassword}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
				</div>
				<button
					type="submit"
					class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
				>
					Update Password
				</button>
			</form>
		</div>
	</div>
</div>
