<script>
  import { onMount } from 'svelte';

  let Map, TileLayer, Marker;

  onMount(async () => {
    ({ Map, TileLayer, Marker } = await import('sveaflet'));
  });
</script>

<div style="width: 100%; height: 500px; position: relative; z-index: 0;">
  {#if Map}
    <Map options={{ center: [43.1566, -77.6088], zoom: 11 }}>
      <TileLayer url={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'} />
    </Map>
  {/if}
</div>