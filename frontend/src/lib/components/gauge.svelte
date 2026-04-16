<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';

    export let value = 78;
</script>

<Progress {value} class="w-fit relative">
	<div class="absolute inset-0 flex items-center justify-center">
		<Progress.ValueText class="text-black text-2xl"/>
	</div>
	<Progress.Circle class="[--size:--spacing(50)]">
		<Progress.CircleTrack class="stroke-core-green-500"/>
		<Progress.CircleRange class="stroke-core-green-100"/>
	</Progress.Circle>
</Progress>