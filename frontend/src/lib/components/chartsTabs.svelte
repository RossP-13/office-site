<script lang="ts">
 import * as Tabs from "$lib/components/ui/tabs/index.js";
	import Barchart from "./barchart.svelte";
	import Linechart from "./linechart.svelte";
	import Piechart from "./piechart.svelte";
	import { activeBox } from "$lib/assets/boxStore.js";

    let boxID: string | null = null;

	// Derive the numeric box ID from the label (e.g. "Box 1" → "1")
	$: boxID = $activeBox?.match(/\d+/)?.[0] ?? null;
</script>
 
<div class="flex w-full flex-col gap-6">
 <Tabs.Root value="distribution">
  <Tabs.List class="bg-white">
   <Tabs.Trigger value="occupancy">Occupancy</Tabs.Trigger>
   <Tabs.Trigger value="comparison">Comparison</Tabs.Trigger>
   <Tabs.Trigger value="distribution">Distribution</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="occupancy" class="w-full">
    <div class=" bg-white rounded-md pt-10 pb-10 pl-30 pr-30">
    <h3>
        Occupancy Over Time
    </h3>
    <h4 class="text-sm text-gray-500">
        Average hourly visits for Kestrels vs. Non-Kestrels
    </h4>
        <div class="flex justify-center mt-4 pl-15 pr-15">
            <Linechart {boxID}/>
        </div>
    </div>
  </Tabs.Content>
  <Tabs.Content value="comparison" class="w-full">
    <div class=" bg-white rounded-md pt-10 pb-10 pl-30 pr-30">
    <h3>
        Species Visit Comparison
    </h3>
    <h4 class="text-sm text-gray-500">
        Daily visit counts by species
    </h4>
        <div class="flex justify-center mt-4 pl-15 pr-15">
            <Barchart {boxID}/>
        </div>
    </div>
  </Tabs.Content>
  <Tabs.Content value="distribution" class="w-full">
    <div class=" bg-white rounded-md pt-10 pb-10 pl-30 pr-30">
    <h3>
        Species Distribution
    </h3>
    <h4 class="text-sm text-gray-500">
        Overall visit percentage by species
    </h4>
        <div class="flex justify-center">
            <Piechart {boxID}/>
        </div>
    </div>
  </Tabs.Content>
 </Tabs.Root>
</div>