<script lang="ts">
   import * as Carousel from "$lib/components/ui/carousel/index.js";
   import { onMount } from "svelte";
   import { derived } from "svelte/store";
   import { activeBox } from "$lib/assets/boxStore.js";
   import { browser } from '$app/environment';

   
   type CarouselImage = {
    src: string;
    alt: string;
};

   let images: CarouselImage[] = [];

   async function fetchImages(boxLabel: string) {
      if (!boxLabel) return;

      const boxID = boxLabel.match(/\d+/)?.[0];
      if (!boxID) return;

      try {
         const res = await fetch(
            `/api/dataApiRoutes/images/imageByBox/?boxID=${boxID}`
         );

         if (!res.ok) throw new Error("Failed to fetch images");

         const data = await res.json();

         // convert DB rows → carousel format
         images = data.map((img: any): CarouselImage => ({
            src: img.src ?? img.filePath,
            alt: img.originalName ?? `Image ${img.imageID}`
         }));
      } catch (err) {
         console.error("Carousel image fetch error:", err);
         images = [];
      }
   }

   onMount(() => {
      const unsubscribe = activeBox.subscribe((boxLabel) => {
         fetchImages(boxLabel);
      });
      return () => unsubscribe();
   });

   let fullscreenSrc: string | null = null;
   let fullscreenAlt: string = "";

   function openFullscreen(imageSrc: string, imageAlt: string) {
      fullscreenSrc = imageSrc;
      fullscreenAlt = imageAlt;
   }

   function closeFullscreen() {
      fullscreenSrc = null;
      fullscreenAlt = "";
   }

   function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") closeFullscreen();
   }

   async function downloadImage(imageSrc: string, filename: string = "download") {
      try {
         // Fetch the blob (works for both blob: URLs and remote URLs)
         const response = await fetch(imageSrc);
         const blob = await response.blob();
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
      } catch (e) {
         console.error("Download failed", e);
      }
   }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if images.length > 0}
   <Carousel.Root opts={{ align: "start" }} class="w-full">
      <Carousel.Content class="items-center">
         {#each images as image, i}
            <Carousel.Item class="ps-1 md:basis-1/2 lg:basis-1/3">
               <button
                  class="w-full cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
                  on:click={() => openFullscreen(String(image.src), String(image.alt))}
                  aria-label="View image fullscreen"
               >
                  <img
                     src={String(image.src)}
                     alt={String(image.alt) || `Image ${i + 1}`}
                     class="w-full object-contain block"
                  />
               </button>
            </Carousel.Item>
         {/each}
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
   </Carousel.Root>
{:else}
   <div class="w-full py-10 text-center text-muted-foreground">
      No images available for this box.
   </div>
{/if}

{#if fullscreenSrc}
   <!-- Backdrop -->
   <button
      class="fixed inset-0 z-50 bg-black/80 w-full h-full border-none cursor-default"
      on:click={closeFullscreen}
      aria-label="Close fullscreen"
   ></button>

   <!-- Fullscreen image container -->
   <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <img
         src={fullscreenSrc}
         alt={fullscreenAlt || "Fullscreen view"}
         class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
      />

      <!-- Top-right button group -->
      <div class="absolute top-4 right-4 flex gap-2 pointer-events-auto">

         <!-- Download button -->
         <button
            class="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors backdrop-blur-sm"
            on:click={() => downloadImage(fullscreenSrc!, fullscreenAlt || "download")}
            aria-label="Download image"
         >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
               <polyline points="7 10 12 15 17 10"/>
               <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
         </button>

         <!-- Close button -->
         <button
            class="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white text-2xl font-bold transition-colors backdrop-blur-sm"
            on:click={closeFullscreen}
            aria-label="Close"
         >
            ✕
         </button>

      </div>
   </div>
{/if}