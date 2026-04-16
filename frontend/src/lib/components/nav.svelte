<script>
	import MediaQuery from '$lib/components/mediaQuery.svelte';
	let mobileMenuOpen = false;
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
	const navLinks = [
		{ label: 'Dashboard', href: '../' },
		{ label: 'Files', href: '../files' },
		{ label: 'Account', href: '../account', icon: true },
	];
</script>
<div class="sticky bg-navbar top-0 z-50 border-b border-gray-200">
	<nav class="w-full px-4 sm:px-6 lg:px-10 py-4">
		<div class="flex items-center justify-between">
			<!-- Logo Section -->
			<div class="flex-shrink-0">
				<MediaQuery query="(min-width: 768px)" let:matches>
					{#if matches}
						<a href="../" class="flex items-center">
							<img 
								src="/images/glt_logo.png" 
								alt="Genesee Land Trust Logo" 
								class="h-20 w-auto"
							/>
						</a>
					{/if}
				</MediaQuery>
				<MediaQuery query="(max-width: 767px)" let:matches>
					{#if matches}
						<a href="../" class="flex items-center">
							<img 
								src="/images/mobile_glt_logo.png" 
								alt="Genesee Land Trust Logo" 
								class="h-10 w-auto"
							/>
						</a>
					{/if}
				</MediaQuery>
			</div>
			<!-- Desktop Navigation -->
			<MediaQuery query="(min-width: 768px)" let:matches>
				{#if matches}
					<ul class="flex items-center gap-2">
						{#each navLinks as link}
							<li>
								<a 
									href={link.href} 
									class="text-sm font-medium text-gray-700 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 hover:bg-core-green-400 group relative"
								>
									{link.label}
									{#if link.icon}
										<img 
											src="/icons/user_icon.svg" 
											alt="Profile" 
											class="w-5 h-5"
										/>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</MediaQuery>
			<!-- Mobile Menu Button -->
			<MediaQuery query="(max-width: 767px)" let:matches>
				{#if matches}
					<button 
						on:click={toggleMobileMenu}
						class="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
						aria-label="Toggle menu"
						aria-expanded={mobileMenuOpen}
					>
						<svg 
							class="w-6 h-6 transition-transform duration-300 {mobileMenuOpen ? 'rotate-90' : ''}"
							fill="none" 
							stroke="currentColor" 
							viewBox="0 0 24 24"
						>
							{#if !mobileMenuOpen}
								<path 
									stroke-linecap="round" 
									stroke-linejoin="round" 
									stroke-width="2" 
									d="M4 6h16M4 12h16M4 18h16"
								/>
							{:else}
								<path 
									stroke-linecap="round" 
									stroke-linejoin="round" 
									stroke-width="2" 
									d="M6 18L18 6M6 6l12 12"
								/>
							{/if}
						</svg>
					</button>
				{/if}
			</MediaQuery>
		</div>
		<!-- Mobile Navigation Menu -->
		<MediaQuery query="(max-width: 767px)" let:matches>
			{#if matches && mobileMenuOpen}
				<div class="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
					<ul class="flex flex-col gap-2">
						{#each navLinks as link}
							<li>
								<a 
									href={link.href}
									on:click={closeMobileMenu}
									class="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-white hover:bg-core-green-400 transition-all duration-200 flex items-center gap-3"
								>
									{link.label}
									{#if link.icon}
										<img 
											src="/icons/user_icon.svg" 
											alt="Profile" 
											class="w-5 h-5"
										/>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</MediaQuery>
	</nav>
</div>
<style>
	:global(.animate-in) {
		animation: slideDown 0.3s ease-out;
	}
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
