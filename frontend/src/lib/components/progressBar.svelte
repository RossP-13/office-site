<script lang="ts">
	import { Progress, Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state(20);
</script>

<div class="w-full space-y-8">
	<!-- Progress -->
	<Progress {value} class="grid grid-cols-[auto_1fr] items-center gap-4">
		<Progress.Label class="text-sm"></Progress.Label>
		<Progress.Track class="bg-core-blue-600">
			<Progress.Range class="bg-core-blue-100" />
		</Progress.Track>
	</Progress>

</div>