<script>
    import { jsonStore } from '$lib/assets/jsonStore.js';
    import { activeBox } from '$lib/assets/boxStore.js';

    let currentPage = 1;
    const rowsPerPage = 4;

    // Get only the values for the selected box
    $: tableData = $jsonStore && $activeBox
        ? [1, 2, 3, 4, 5, 6]
            .flatMap(n => $jsonStore[`box${n}Values`] ?? [])
            .filter(row => row.box === $activeBox.toLowerCase())
        : [];

    $: totalPages = Math.ceil(tableData.length / rowsPerPage);
    $: paginatedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Reset to page 1 when box selection changes
    $: $activeBox, currentPage = 1;

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
                <th class="text-center! font-bold! text-black">Confidence</th>
                <th class="text-right! font-bold! text-black">Time</th>
            </tr>
        </thead>
        <tbody class="[&>tr]:hover:bg-navbar">
            {#each paginatedData as row}
                <tr>
                    <td class="text-black">{row.species}</td>
                    <td class="text-black">
                        {#if row.accuracy >= 80 && row.accuracy <= 100}
                            <span style="background-color: #4E801F; padding: 0.5em; padding-left: 1em; padding-right: 1em; border-radius: 5px; color: white;">
                                {parseFloat(row.accuracy).toFixed(2)}%
                            </span>
                        {:else if row.accuracy >= 70 && row.accuracy < 80}
                            <span style="background-color: #F0B100; padding: 0.5em; padding-left: 1em; padding-right: 1em; border-radius: 5px">
                                {parseFloat(row.accuracy).toFixed(2)}%
                            </span>
                        {:else if row.accuracy < 70}
                            <span style="background-color: #D4183D; padding: 0.5em; padding-left: 1em; padding-right: 1em; border-radius: 5px; color: white;">
                                {parseFloat(row.accuracy).toFixed(2)}%
                            </span>
                        {/if}
                    </td>
                </tr>
            {/each}
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