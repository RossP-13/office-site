<script>
	import './app.css';
	import './layout.css';
	import favicon from '$lib/assets/glt_favicon.png';
	import Nav from '$lib/components/nav.svelte';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div>
	{#if $page.url.pathname !== '/login'}
		<Nav/>
	{/if}
	<div class="mx-auto max-w-[90rem] text-[18px] px-10 pt-8">
		{@render children()}
	</div>
</div>
