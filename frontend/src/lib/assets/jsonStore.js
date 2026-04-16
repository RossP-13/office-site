import { writable } from 'svelte/store';

// Holds the parsed output.json data
export const jsonStore = writable(null);

export const imageStore = writable({});

export function loadJson(data) {
  jsonStore.set(structuredClone(data));
}

export function updateJson(updaterFn) {
  jsonStore.update(current => {
    if (!current) return current;
    const updated = structuredClone(current);
    updaterFn(updated);
    return updated;
  });
}

export function clearJson() {
  jsonStore.set(null);
}

export function loadImages(imageMap) {
  imageStore.set(imageMap);
}

export function clearImages() {
  // Revoke all object URLs to avoid memory leaks before clearing
  imageStore.update(current => {
    Object.values(current).forEach(url => URL.revokeObjectURL(url));
    return {};
  });
}