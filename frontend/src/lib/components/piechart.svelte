<script lang="ts">
  import { browser } from '$app/environment';
  import { Pie } from 'svelte-chartjs';
  import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

  Chart.register(ArcElement, Tooltip, Legend);

  type PieResponse = {
    kestrelCount: number;
    otherCount: number;
    totalCount: number;
  };

  let { boxID = null }: { boxID?: string | null } = $props();
  let lastFetchedBoxID = $state<string | null | undefined>(undefined);

  let chartData = $state<PieResponse | null>(null);

  let data = $derived({
  labels: ['Kestrels', 'Non-Kestrels'],

  datasets: chartData
    ? [
        {
          data: [chartData.kestrelCount, chartData.otherCount],
          backgroundColor: [
            getComputedStyle(document.documentElement)
              .getPropertyValue('--color-core-green-100')
              .trim(),
            getComputedStyle(document.documentElement)
              .getPropertyValue('--color-core-blue-100')
              .trim(),
          ],
          borderColor: [
            getComputedStyle(document.documentElement)
              .getPropertyValue('--color-core-green-100')
              .trim(),
            getComputedStyle(document.documentElement)
              .getPropertyValue('--color-core-blue-100')
              .trim(),
          ],
          borderWidth: 1,
        },
      ]
    : [],
});

  async function fetchPieData(id: string | null) {
    const url = id
      ? `/api/graphCalcRoutes/pieChart/?boxID=${encodeURIComponent(id)}`
      : '/api/graphCalcRoutes/pieChart/';
    const res = await fetch(url);
    chartData = await res.json();
  }

  $effect(() => {
    if (!browser) return;
    if (lastFetchedBoxID === boxID) return;
    lastFetchedBoxID = boxID;
    fetchPieData(boxID);
  });

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  };
</script>

<div class="w-[400px]">
  <Pie {data} {options} />
</div>