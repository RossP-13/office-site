<script lang="ts">
	import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

    import { activeBox } from '$lib/assets/boxStore.js';

    export let options = ["option 1", "option 2", "option 3"];

    let selectedOption = options[0];

    activeBox.set(selectedOption); // initialize store with default on mount


    function changeSelectedOption(option: string) {
        selectedOption = option;
        activeBox.set(option); // sync store on every selection change
    }


</script>

<Menu>
	<Menu.Trigger class="btn preset-filled">
        {selectedOption}
        <img src="/icons/downarrowgreen.svg" alt="A green down arrow icon"/>
    </Menu.Trigger>
	<Portal>
		<Menu.Positioner>
			<Menu.Content class="bg-navbar">
                {#each options as option}
				<Menu.Item value={option} class="text-black">
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