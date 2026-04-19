<script>
	import Dropdown from "$lib/components/dropdown.svelte";
	import SpeciesVerification from "$lib/components/speciesVerification.svelte";
	import Gauge from "$lib/components/gauge.svelte";
	import VideoCarousel from "$lib/components/videoCarousel.svelte";
	import Datatable from "$lib/components/datatable.svelte";
	import ChartsTabs from "$lib/components/chartsTabs.svelte";
	import InfoModal from "$lib/components/infoModal.svelte";
	import ExportModal from "$lib/components/exportModal.svelte";
	import Map from "$lib/components/map.svelte";
	import { activeBox } from "$lib/assets/boxStore.js";

	let isModalOpen = false;
	let isExportModalOpen = false;
	let isVerificationModalOpen = false;

	let unvalidatedCount = 0;
	let countLoading = true;

	let unvalidatedObservations = [];
	let observationsLoading = false;

	// 🔹 Fetch count
	async function fetchUnvalidatedCount(boxLabel) {
		if (!boxLabel) return;

		const boxNumber = boxLabel.match(/\d+/)?.[0];
		if (!boxNumber) return;

		try {
			countLoading = true;

			const response = await fetch(
				`/api/dataApiRoutes/observations/validateSpecies/countUnvalidated/?boxID=${boxNumber}`
			);

			if (!response.ok) throw new Error();

			const data = await response.json();
			unvalidatedCount = data.count;
		} catch (err) {
			console.error(err);
			unvalidatedCount = 0;
		} finally {
			countLoading = false;
		}
	}

	// 🔹 Fetch observations for modal
	async function fetchUnvalidatedObservations(boxLabel) {
		if (!boxLabel) return;

		const boxNumber = boxLabel.match(/\d+/)?.[0];
		if (!boxNumber) return;

		try {
			observationsLoading = true;

			const response = await fetch(
				`/api/dataApiRoutes/observations/validateSpecies/getUnvalidated/?boxID=${boxNumber}`
			);

			if (!response.ok) throw new Error();

			unvalidatedObservations = await response.json();
		} catch (err) {
			console.error(err);
			unvalidatedObservations = [];
		} finally {
			observationsLoading = false;
		}
	}

	// 🔹 React to box changes
	$: if ($activeBox) {
		fetchUnvalidatedCount($activeBox);
	}

	function openVerificationModal() {
		if ($activeBox) {
			fetchUnvalidatedObservations($activeBox);
		}
		isVerificationModalOpen = true;
	}

	function handleVerificationComplete(event) {
		if ($activeBox) {
			fetchUnvalidatedCount($activeBox);
		}
		isVerificationModalOpen = false;
	}
</script>

<div>
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div class="flex gap-4 items-center">
			<h1 class="pt-3">Viewing Data for {$activeBox}:</h1>
			<Dropdown />
		</div>

		<button
			on:click={() => (isExportModalOpen = true)}
			class="flex bg-core-blue-100 p-2 px-4 gap-2 rounded-sm"
		>
			<span class="font-sans text-[16px] text-nowrap text-white">
				Export Report
			</span>
			<img src="/icons/export.svg" alt="Export Icon" class="w-1/5" />
		</button>

		<ExportModal bind:isOpen={isExportModalOpen} />
	</div>

	<!-- Top Section -->
	<div class="flex flex-wrap mt-6">
		<!-- Map -->
		<div class="w-1/2">
			<Map />
		</div>

		<!-- Verification Count -->
		<div class="w-1/4">
			<div class="relative flex flex-col items-center justify-center gap-6 mt-6">
				<img
					src="/icons/circle_exclamation.svg"
					alt="Icon"
					class="self-end top-0 right-0 w-6 h-6"
				/>

				<p class="text-8xl">
					{countLoading ? "..." : unvalidatedCount}
				</p>

				<p class="text-4xl text-center">
					Data Points<br />Needing<br />Verification
				</p>

				<button
					on:click={openVerificationModal}
					class="flex bg-core-blue-100 p-2 px-4 gap-2 rounded-sm"
				>
					<span class="font-sans text-[16px] text-nowrap text-white">
						Verify Data Points
					</span>
					<img src="/icons/rightarrow.svg" alt="Icon" class="w-1/5" />
				</button>
			</div>
		</div>

		<SpeciesVerification
			bind:open={isVerificationModalOpen}
			observations={unvalidatedObservations}
			on:allVerified={handleVerificationComplete}
		/>

		<!-- Accuracy -->
		<div class="w-1/4 flex flex-col">
			<div class="flex justify-center items-center flex-wrap gap-2 mt-4">
				<Gauge />

				<h3 class="text-center mt-2">
					Accuracy of Identification
				</h3>

				<div class="flex gap-2 items-center">
					<button
						on:click={() => (isModalOpen = true)}
						class="cursor-pointer bg-transparent border-none p-0"
					>
						<img src="/icons/question.svg" alt="Info" />
					</button>

					<h4 class="text-center text-[14px] text-black">
						How do we get this number?
					</h4>
				</div>
			</div>
		</div>
	</div>

	<!-- Videos -->
	<div class="ml-2 mr-2 mt-8 mb-6 text-center">
		<h1>Bird Images</h1>
		<VideoCarousel />
	</div>

	<!-- Table -->
	<div class="ml-2 mr-2 mt-8 mb-6">
		<h1 class="text-center">Species Identification Table</h1>
		<Datatable />
	</div>

	<!-- Charts -->
	<div class="ml-2 mr-2 mt-8 mb-6">
		<h1 class="text-center">Bird Monitoring</h1>
		<ChartsTabs />
	</div>
</div>

<InfoModal
	bind:isOpen={isModalOpen}
	title="What does this percentage mean?"
	body="Our AI analyzes your upload and searches our database for a match. This number indicates how closely your image matches identified samples, the higher it is, the more confident the AI’s identification."
/>