<script>
    import { browser } from '$app/environment';
    import { activeBox } from '$lib/assets/boxStore.js';

    let tableData = [];
    let loading = true;
    let error = null;
    let lastFetchedBox = null;

    let currentPage = 1;
    const rowsPerPage = 4;

    $: totalPages = Math.max(1, Math.ceil(tableData.length / rowsPerPage));
    $: paginatedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Reset to page 1 when box selection changes
    $: $activeBox, currentPage = 1;

    async function fetchObservations(boxLabel) {
        if (!boxLabel) return;

        // Extract box number from "Box X" format
        const boxId = boxLabel.match(/\d+/)?.[0];
        if (!boxId) return;

        try {
            loading = true;
            error = null;
            const response = await fetch(`/api/dataApiRoutes/observations/observationByBox/?boxID=${boxId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch observations');
            }
            const data = await response.json();
            tableData = data.map(obs => ({
                species: obs.observationSpecies,
                confidence: obs.confidence,
                time: new Date(obs.observationTime).toLocaleTimeString(),
                observationID: obs.observationID,
                verification: obs.verification
            }));
        } catch (err) {
            console.error('Error fetching observations:', err);
            error = err.message;
            tableData = [];
        } finally {
            loading = false;
        }
    }

    $: if (browser && $activeBox) {
        if (lastFetchedBox !== $activeBox) {
            lastFetchedBox = $activeBox;
            fetchObservations($activeBox);
        }
    }

    function prevPage() {
        if (currentPage > 1) currentPage--;
    }

    function nextPage() {
        if (currentPage < totalPages) currentPage++;
    }
</script>

<div class="table-wrap bg-white rounded-md pt-10 pb-10 pl-30 pr-30">
	<table class="table caption-bottom">
		<thead>
			<tr>
				<th class="font-bold! text-black">Species</th>
				<th class="font-bold! text-black">Confidence</th>
				<th class="text-right! font-bold! text-black">Time</th>
			</tr>
		</thead>
		<tbody class="[&>tr]:hover:bg-navbar">
			{#if loading}
				<tr>
					<td colspan="3" class="text-center text-black py-4">Loading observations...</td>
				</tr>
			{:else if error}
				<tr>
					<td colspan="3" class="text-center text-red-600 py-4">Error: {error}</td>
				</tr>
			{:else if paginatedData.length === 0}
				<tr>
					<td colspan="3" class="text-center text-black py-4">No observations found for this box.</td>
				</tr>
			{:else}
				{#each paginatedData as row}
					<tr>
						<td class="text-black">{row.species}</td>
						<td class="text-black">
							{#if row.confidence >= 80 && row.confidence <= 100}
								<span style="background-color: #4E801F; padding: 0.5em; padding-left: 1em; padding-right: 1em; border-radius: 5px; color: white;">
									{row.confidence}%
								</span>
							{:else if row.confidence >= 70 && row.confidence < 80}
								<span style="background-color: #F0B100; padding: 0.5em; padding-left: 1em; padding-right: 1em; border-radius: 5px">
									{row.confidence}%
								</span>
							{:else}
								<span style="background-color: #D4183D; padding: 0.5em; padding-left: 1em; padding-right: 1em; border-radius: 5px; color: white;">
									{row.confidence}%
								</span>
							{/if}
						</td>
						<td class="text-right text-black">{row.time}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	<!-- Pagination controls -->
	<div class="flex items-center justify-between" style="margin-top: 1rem;">
		<button
			class="px-3 py-1 rounded-md text-sm border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			on:click={prevPage}
			disabled={currentPage === 1}
		>
			← Previous
		</button>

		<span class="text-sm font-medium text-black">Page {currentPage} of {totalPages}</span>

		<button
			class="px-3 py-1 rounded-md text-sm border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			on:click={nextPage}
			disabled={currentPage === totalPages}
		>
			Next →
		</button>
	</div>
</div>