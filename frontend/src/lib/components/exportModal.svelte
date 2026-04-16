<script>
    import { get } from 'svelte/store';
    import { activeBoxData } from '$lib/assets/boxStore.js';

    export let isOpen = false;

    function closeModal() { isOpen = false; }

    let exportOptions = [
        { id: "species",   label: "Species data",                     checked: false },
        { id: "occupancy", label: "Occupancy data",                    checked: false },
        { id: "visits",    label: "Visits and Activity Timeline data", checked: false },
        { id: "verified",  label: "Verified IDs",                      checked: false },
        { id: "images",    label: "Images",                            checked: false },
    ];

    // Load SheetJS once
    if (typeof window !== 'undefined' && !window.XLSX) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(s);
    }

    function styleSheet(ws, headers) {
        const XLSX = window.XLSX;
        headers.forEach((h, i) => {
            const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
            if (!cell) return;
            cell.s = {
                font:      { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 11 },
                fill:      { fgColor: { rgb: '4A7C2F' } },
                alignment: { horizontal: 'center', vertical: 'center' },
            };
        });
        ws['!cols'] = headers.map(h => ({ wch: Math.min(Math.max(h.length + 6, 14), 40) }));
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    }

    function handleExport() {
        const XLSX = window.XLSX;
        if (!XLSX)   { alert('Export library still loading, please try again.'); return; }

        const boxData = get(activeBoxData);
        if (!boxData) { alert('No data loaded. Please upload a JSON file first.'); return; }

        const selected = exportOptions.filter(o => o.checked);
        if (selected.length === 0) { alert('Please select at least one category.'); return; }

        const wb = XLSX.utils.book_new();

        selected.forEach(({ id, label }) => {
            let rows = [];

            if (id === 'species') {
                // Deduplicated species list with sighting count
                const counts = {};
                boxData.values.forEach(r => {
                    const name = r.species?.trim();
                    counts[name] = (counts[name] ?? 0) + 1;
                });
                rows = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([species, count]) => ({ Species: species, Sightings: count }));
            }

            else if (id === 'occupancy') {
                rows = [
                    { Field: 'Box Name',     Value: boxData.name },
                    { Field: 'Total Visits', Value: boxData.contains },
                ];
            }

            else if (id === 'visits') {
                rows = boxData.values.map(r => ({
                    Box:      r.box,
                    Species:  r.species?.trim(),
                    Date:     r.date,
                    Time:     r.time,
                    Accuracy: `${r.accuracy}%`,
                }));
            }

            else if (id === 'verified') {
                rows = boxData.values
                    .filter(r => Number(r.accuracy) >= 80)
                    .map(r => ({
                        Species:       r.species?.trim(),
                        Date:          r.date,
                        Time:          r.time,
                        'Accuracy (%)': Number(r.accuracy),
                    }));
            }

            else if (id === 'images') {
                rows = [{ Note: 'Image export is not yet supported in this version.' }];
            }

            const ws = rows.length > 0
                ? XLSX.utils.json_to_sheet(rows)
                : XLSX.utils.aoa_to_sheet([['No data available for this category']]);

            if (rows.length > 0) styleSheet(ws, Object.keys(rows[0]));
            XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31));
        });

        XLSX.writeFile(wb, `${boxData.name.replace(' ', '_')}_report.xlsx`);
        closeModal();
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        on:click={closeModal}
        role="presentation"
    >
        <!-- Modal Box -->
        <div
            class="bg-white rounded-xl p-8 w-full max-w-lg mx-4 relative"
            on:click|stopPropagation
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
        >
            <!-- Close Button -->
            <button
                on:click={closeModal}
                class="absolute top-3 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer text-2xl leading-none"
                aria-label="Close modal"
            >
                &times;
            </button>

            <!-- Title -->
            <h2 id="export-modal-title" class="text-3xl font-bold text-black mb-6">Export Report</h2>

            <!-- Subtitle -->
            <h3 class="text-xl font-bold text-black mb-4">Select the data you want to include:</h3>

            <!-- Checkboxes -->
            <div class="flex flex-col gap-4 mb-8">
                {#each exportOptions as option}
                    <label class="flex items-center gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={option.checked}
                            class="hidden"
                            id={option.id}
                        />
                        <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                {option.checked ? 'bg-green-600' : 'bg-gray-200'}"
                        >
                            {#if option.checked}
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd"/>
                                </svg>
                            {/if}
                        </div>
                        <span class="text-lg text-black">{option.label}</span>
                    </label>
                {/each}
            </div>

            <!-- Export Button -->
            <button
                on:click={handleExport}
                class="bg-green-500 hover:bg-green-700 transition-colors text-white font-bold text-lg px-8 py-3 rounded-lg"
            >
                Export Report
            </button>
        </div>
    </div>
{/if}