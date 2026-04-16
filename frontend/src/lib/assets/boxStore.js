import { writable, derived } from 'svelte/store';
import { jsonStore } from './jsonStore.js';

// Tracks which box is currently selected (e.g. "Box 1")
export const activeBox = writable("Box 1");

// Derives the box number from the label (e.g. "Box 1" → 1)
function boxNumber(label) {
    const match = label?.match(/\d+/);
    return match ? match[0] : null;
}

// Automatically pulls the correct boxNValues from jsonStore
export const activeBoxData = derived(
    [jsonStore, activeBox],
    ([$json, $active]) => {
        if (!$json || !$active) return null;
        const num = boxNumber($active);
        return {
            name:     $json[`box${num}Name`]     ?? $active,
            contains: $json[`box${num}Contains`] ?? '0',
            values:   $json[`box${num}Values`]   ?? [],
        };
    }
);