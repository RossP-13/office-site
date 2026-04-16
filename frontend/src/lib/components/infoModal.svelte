<script>
    export let isOpen = false;
    export let title = "";
    export let body = "";
    function closeModal() {
        isOpen = false;
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
            class="bg-white rounded-lg p-6 w-full max-w-sm mx-4 relative"
            on:click|stopPropagation
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <!-- Close Button -->
            <button
                on:click={closeModal}
                class="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer text-2xl leading-none"
                aria-label="Close modal"
            >
                &times;
            </button>
            <!-- Title -->
            <h2 id="modal-title" class="text-lg font-bold text-black mb-4">{title}</h2>
            <!-- Body -->
            <p class="text-gray-800 text-sm leading-relaxed">{body}</p>
        </div>
    </div>
{/if}