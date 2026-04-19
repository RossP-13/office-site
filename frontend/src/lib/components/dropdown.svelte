<script lang="ts">
	import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
    import { onMount } from 'svelte';

    import { activeBox } from '$lib/assets/boxStore.js';

   let options: number[] = [];
    let selectedOption: string | null = null;
    let loading = true;
    let error = false;

    // Fetch boxes from API
    async function fetchBoxes() {
        try {
            console.log('Dropdown: Fetching boxes from /api/dataApiRoutes/birdBox/getBoxes');
            const response = await fetch('/api/dataApiRoutes/birdBox/getBoxes');
            console.log('Dropdown: Response status:', response.status);
            console.log('Dropdown: Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Dropdown: Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const boxes = await response.json();
            console.log('Dropdown: Fetched boxes:', boxes);
            options = boxes.map((box: any) => box.boxID);
            console.log('Dropdown: Mapped options:', options);
            selectedOption = options.length > 0 ? `Box ${options[0]}` : null;
            console.log('Dropdown: Selected option:', selectedOption);

            if (selectedOption !== null) {
                activeBox.set(selectedOption);
            }
        } catch (err) {
            console.error('Dropdown: Error fetching boxes:', err);
            error = true;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchBoxes();
    });

    function changeSelectedOption(option: number) {
        const boxLabel = `Box ${option}`;
        selectedOption = boxLabel;
        activeBox.set(boxLabel); // sync store on every selection change
    }


</script>

<Menu>
	<Menu.Trigger class="btn bg-navbar! text-black" style="background-color: #D9D9D9; color: black;">
        {selectedOption}
        <img src="/icons/downarrowgreen.svg" alt="A green down arrow icon"/>
    </Menu.Trigger>
	<Portal>
		<Menu.Positioner>
			<Menu.Content class="bg-navbar! text-black">
                {#each options as option}
				<Menu.Item value={option.toString()} class="text-black">
                    <button
                        class="w-full text-left"
                        on:click={() => changeSelectedOption(option)}
                    >
                        {option}
                    </button>
                </Menu.Item>
                {/each}
			</Menu.Content>
		</Menu.Positioner>
	</Portal>
</Menu>