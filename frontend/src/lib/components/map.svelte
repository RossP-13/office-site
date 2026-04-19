<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { activeBox } from '$lib/assets/boxStore.js';

  let boxCoords = { latCoord: 43.1566, longCoord: -77.6088 };
  let mapCenter = [43.1566, -77.6088];

   function getBoxID(label) {
    return label?.match(/\d+/)?.[0] ?? null;
  }

  
  onMount(async () => {
    ({ Map, TileLayer, Marker } = await import('sveaflet'));
  });

  onMount(() => {
    //initial load
    getCoords($activeBox);

    const unsubscribe = activeBox.subscribe((val) => {
      getCoords(val);
    });

    return unsubscribe;
  });

  $: mapCenter = [
    Number(boxCoords?.latCoord ?? 43.1566),
    Number(boxCoords?.longCoord ?? -77.6088)
  ];

  async function getCoords(boxLabel){

    if(!browser) return;

    const boxID = getBoxID(boxLabel);
    if (!boxID) return;
    try {

      console.log("fetching location data");
      const res = await fetch(`/api/dataApiRoutes/birdBox/getcoords?boxID=${boxID}`);

      if (!res.ok) throw new Error('Failed fetch');

      boxCoords = await res.json();
      console.log("fetched location data:", boxCoords);
    }catch (err) {
      console.error('Error fetching location data:', err);
      boxCoords = { latCoord: 43.1566, longCoord: -77.6088 };
    }
  }
  let Map, TileLayer, Marker;
  

</script>

<div style="width: 100%; height: 500px; position: relative; z-index: 0;">
  {#if Map}
    {#key `${mapCenter[0]},${mapCenter[1]}`}
      <Map options={{ center: mapCenter, zoom: 11 }}>
        <TileLayer url={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'} />
      </Map>
    {/key}
  {/if}
</div>