<script>
    import { get } from 'svelte/store';
    import { activeBox, activeBoxData } from '$lib/assets/boxStore.js';

    export let isOpen = false;

    function closeModal() { isOpen = false; }

    let isExporting = false;

    let exportOptions = [
        { id: "species",   label: "Species data",                     checked: false },
        { id: "occupancy", label: "Occupancy data",                    checked: false },
        { id: "visits",    label: "Visits and Activity Timeline data", checked: false },
        { id: "verified",  label: "Verified IDs",                      checked: false },
        { id: "images",    label: "Images",                            checked: false },
    ];

    async function buildExportData() {
        const selectedBoxLabel = get(activeBox);
        const selectedBoxId = selectedBoxLabel?.match(/\d+/)?.[0];

        if (selectedBoxId) {
            try {
                const response = await fetch(`/api/dataApiRoutes/observations/observationByBox/?boxID=${selectedBoxId}`);
                if (response.ok) {
                    const observations = await response.json();
                    if (Array.isArray(observations)) {
                        const values = observations.map((obs) => {
                            const observedAt = obs?.observationTime ? new Date(obs.observationTime) : null;
                            const hasValidDate = observedAt && !Number.isNaN(observedAt.valueOf());

                            return {
                                box: selectedBoxLabel,
                                species: obs?.observationSpecies || 'Unknown',
                                date: hasValidDate ? observedAt.toLocaleDateString() : '',
                                time: hasValidDate ? observedAt.toLocaleTimeString() : '',
                                accuracy: Number(obs?.confidence) || 0,
                                verification: obs?.verification ?? null,
                                observationID: obs?.observationID ?? null,
                            };
                        });

                        return {
                            name: selectedBoxLabel,
                            boxID: Number(selectedBoxId) || null,
                            contains: values.length,
                            values,
                        };
                    }
                }
            } catch (error) {
                console.error('Failed to fetch table-backed observation data for export', error);
            }
        }

        const storeBoxData = get(activeBoxData);
        if (storeBoxData && Array.isArray(storeBoxData.values)) {
            return {
                ...storeBoxData,
                boxID: Number(selectedBoxId) || null,
            };
        }

        return null;
    }

    async function handleExport() {
        const boxData = await buildExportData();
        if (!boxData) {
            alert('No data is available for the currently selected box.');
            return;
        }

        const selected = exportOptions.filter(o => o.checked).map(o => o.id);
        if (selected.length === 0) { alert('Please select at least one category.'); return; }

        isExporting = true;
        try {
            const response = await fetch('/api/dataApiRoutes/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boxData,
                    selectedOptions: selected,
                }),
            });

            if (!response.ok) {
                let message = 'Export failed.';
                try {
                    const errorBody = await response.json();
                    message = errorBody?.error || message;
                } catch {
                    // Keep fallback message when server does not return JSON.
                }
                alert(message);
                return;
            }

            const blob = await response.blob();
            const fallbackName = `${String(boxData.name || 'report').replace(/\s+/g, '_')}_report.zip`;
            const contentDisposition = response.headers.get('content-disposition') || '';
            const match = contentDisposition.match(/filename="?([^";]+)"?/i);
            const fileName = match?.[1] || fallbackName;

            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);

            closeModal();
        } catch (error) {
            console.error('Export request failed', error);
            alert('Unable to reach the export endpoint. Please try again.');
        } finally {
            isExporting = false;
        }
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
            on:keydown|stopPropagation
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            tabindex="-1"
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
                disabled={isExporting}
                class="bg-green-500 hover:bg-green-700 transition-colors text-white font-bold text-lg px-8 py-3 rounded-lg"
            >
                {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
        </div>
    </div>
{/if}