<script>
	import Dropdown from "$lib/components/dropdown.svelte";
    import SpeciesVerification from "$lib/components/speciesVerification.svelte";
    import Gauge from "$lib/components/gauge.svelte";
    import VideoCarousel from "$lib/components/videoCarousel.svelte";
	import Datatable from "$lib/components/datatable.svelte";
	import ChartsTabs from "$lib/components/chartsTabs.svelte";
	import Linechart from "$lib/components/linechart.svelte";
    import InfoModal from "$lib/components/infoModal.svelte";
    import ExportModal from "$lib/components/exportModal.svelte";
    import { jsonStore } from '$lib/assets/jsonStore.js';
    import { activeBox } from '$lib/assets/boxStore.js';
	import Map from "$lib/components/map.svelte";

    export let boxOptions = ["Arc", "Renwood", "Box 3", "Box 4", "Box 5"];

    export let numVerify = 3;
    export let accuracyPercent = 80;

    let isModalOpen = false;
    let isExportModalOpen = false;
    let isVerificationModalOpen = false;
</script>

<div>
    <div class="flex justify-between items-center">
        <div class="flex gap-4 items-center">
            <h1 class="pt-3">Viewing Data for Box:</h1>
            <Dropdown options={boxOptions}/>
        </div>

        <button on:click={() => isExportModalOpen = true} class="flex bg-core-blue-100 p-2 px-4 gap-2 rounded-sm">
            <span class="font-sans text-[16px] text-nowrap text-white">Export Report</span>
            <img src="/icons/export.svg" alt="Export Icon" class="w-1/5"/>
        </button>
        <ExportModal bind:isOpen={isExportModalOpen} />
    </div>

    <div class="flex flex-wrap mt-6">
        <div class="w-1/2">
            <Map/>
        </div>

        <div class="w-1/4">
            <div class="relative flex flex-col items-center justify-center gap-6 mt-6">
                <img
                    src="/icons/circle_exclamation.svg"
                    alt="Question Mark Icon"
                    class="self-end top-0 right-0 w-6 h-6"
                />
                <p class="text-8xl">{numVerify}</p>
                <p class="text-4xl text-center">Data Points<br/>Needing<br/>Verification</p>
                <button
                    on:click={() => isVerificationModalOpen = true}
                    class="flex bg-core-blue-100 p-2 px-4 gap-2 rounded-sm"
                >
                    <span class="font-sans text-[16px] text-nowrap text-white">Verify Data Points</span>
                    <img src="/icons/rightarrow.svg" alt="Export Icon" class="w-1/5"/>
                </button>
            </div>
        </div>
        <SpeciesVerification bind:open={isVerificationModalOpen} />

        <div class="w-1/4 flex flex-col">
            <div class="flex justify-center items-center flex-wrap gap-2 mt-4">
                <Gauge value={accuracyPercent}/>
                <h3 class="text-center mt-2">Accuracy of Identification</h3>
                <div class="flex gap-2 items-center">
                    <button
                        on:click={() => isModalOpen = true}
                        class="cursor-pointer bg-transparent border-none p-0"
                        aria-label="More information"
                    >
                        <img src="/icons/question.svg" alt="Question Mark Icon" class=""/>
                    </button>
                    <h4 class="text-center text-[14px] text-black">How do we get this number?</h4>
                </div>
            </div>
        </div>
    </div>

    <div class="ml-2 mr-2 mt-8 mb-6 text-center">
        <h1>Bird Videos</h1>
        <VideoCarousel/>
    </div>

    <div class="ml-2 mr-2 mt-8 mb-6">
        <h1 class="text-center">Species Identification Table</h1>
        <Datatable/>
    </div>

    <div class="ml-2 mr-2 mt-8 mb-6">
        <h1 class="text-center">Bird Monitoring</h1>
        <ChartsTabs/>
    </div>
</div>
<InfoModal
    bind:isOpen={isModalOpen}
    title="What does this percentage mean?"
    body="Our AI analyzes your upload and searches our database for a match. This number indicates how closely your image matches identified samples, the higher it is, the more confident the AI’s identification."
/>