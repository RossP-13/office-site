<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { onMount } from 'svelte';
	import { activeBox } from '$lib/assets/boxStore.js';
    import { browser } from '$app/environment';


    let value = 78;
    let loading = true;

    // Function to fetch average confidence for the selected box
    async function fetchAverageConfidence(boxLabel: string) {
        try {
            // Extract box number from "Box X" format
            const boxNumber = boxLabel.replace('Box ', '');
            console.log('Gauge: Fetching average confidence for box:', boxNumber);

            const response = await fetch(`/api/dataApiRoutes/observations/averageConfidence?boxID=${boxNumber}`);
            console.log('Gauge: Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Gauge: Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Gauge: Fetched average confidence:', data.averageConfidence);
            value = data.averageConfidence;
        } catch (err) {
            console.error('Gauge: Error fetching average confidence:', err);
            value = 0; // Default to 0 on error
        } finally {
            loading = false;
        }
    }

    // React to changes in activeBox
    $: if (browser && $activeBox) {
        loading = true;
        fetchAverageConfidence($activeBox);
    }

    onMount(() => {
        if (browser && $activeBox) {
            fetchAverageConfidence($activeBox);
        }
    });
</script>

<Progress {value} class="w-fit relative">
	<div class="absolute inset-0 flex items-center justify-center">
		{#if loading}
			<span class="text-black text-2xl">...</span>
		{:else}
			<Progress.ValueText class="text-black text-2xl"/>
		{/if}
	</div>
	<Progress.Circle class="[--size:--spacing(50)]">
		<Progress.CircleTrack class="stroke-core-green-500"/>
		<Progress.CircleRange class="stroke-core-green-100"/>
	</Progress.Circle>
</Progress>