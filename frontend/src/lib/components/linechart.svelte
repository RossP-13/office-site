<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Line } from 'svelte-chartjs';
  import {
    Chart,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
  } from 'chart.js';
  import type { ChartOptions } from 'chart.js';
  import type { ChartData } from 'chart.js';

  let chartJsData = $state<ChartData<'line'>>({
  labels: [],
  datasets: []
});
  

  Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

  const amHours = ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
                   '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];
  const pmHours = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
                   '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];

  type LineChartResponse = {
  kestrelCounts: number[];
  otherCounts: number[];
  };


  let chartData = $state<LineChartResponse | null>(null);
  let currentIndex = $state(0); // 0 = AM, 1 = PM

  let { boxID = null }: { boxID?: string | null } = $props();
  let lastFetchedBoxID = $state<string | null | undefined>(undefined);

  async function fetchData(id: string | null) {
    const url = id
      ? `/api/graphCalcRoutes/lineChart/?boxID=${encodeURIComponent(id)}`
      : '/api/graphCalcRoutes/lineChart/';
    const res = await fetch(url);
    chartData = await res.json();
  }

  onMount(async () => {
    const style = getComputedStyle(document.documentElement);
    kestrelColor = style.getPropertyValue('--color-core-green-100').trim();
    nonkestrelColor = style.getPropertyValue('--color-core-blue-100').trim();
  });

  $effect(() => {
    if (!browser) return;
    if (lastFetchedBoxID === boxID) return;
    lastFetchedBoxID = boxID;
    fetchData(boxID);
  });

  let kestrelColor = $state('');
  let nonkestrelColor = $state('');

$effect(() => {
  if (!chartData) return;

  const isAM = currentIndex === 0;

  chartJsData = {
    labels: isAM
      ? Array.from({ length: 12 }, (_, i) => `${i}:00 AM`)
      : Array.from({ length: 12 }, (_, i) => `${i + 12}:00 PM`),

    datasets: [
      {
        label: 'Kestrel Visits',
        data: isAM
          ? chartData.kestrelCounts.slice(0, 12)
          : chartData.kestrelCounts.slice(12, 24),
        borderColor: kestrelColor,
        backgroundColor: kestrelColor + '33',
        tension: 0.4,
      },
      {
        label: 'Non-Kestrel Visits',
        data: isAM
          ? chartData.otherCounts.slice(0, 12)
          : chartData.otherCounts.slice(12, 24),
        borderColor: nonkestrelColor,
        backgroundColor: nonkestrelColor + '33',
        tension: 0.4,
      },
    ],
  };
});


  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: 0,
        ticks: {
          stepSize: 1,
          precision: 0,
          callback: (value) => Math.floor(Number(value)),
        },
        title: {
          display: true,
          text: 'Number of Visits',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };
</script>

<div class="w-full flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <button
      class="px-3 py-1 rounded-md text-sm border border-border bg-background
        text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40
        disabled:cursor-not-allowed"
      onclick={() => currentIndex--}
      disabled={currentIndex === 0}
    >
      ← AM
    </button>

    <span class="text-sm font-medium">
      {currentIndex === 0 ? 'AM (12:00 AM - 11:00 AM)' : 'PM (12:00 PM - 11:00 PM)'}
    </span>

    <button
      class="px-3 py-1 rounded-md text-sm border border-border bg-background
        text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40
        disabled:cursor-not-allowed"
      onclick={() => currentIndex++}
      disabled={currentIndex === 1}
    >
      PM →
    </button>
  </div>

  <Line data={chartJsData} {options} />
</div>