<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Bar } from 'svelte-chartjs';
  import {
    Chart,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
  } from 'chart.js';
  import type { ChartOptions } from 'chart.js';

  Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  type DayData = {
  date: string;
  kestrel: number;
  other: number;
  };

  let allWeeks = $state<any[]>([]);
  let loading = $state(true);

  let currentWeekIndex = $state(0);

  let kestrelColor = $state('');
  let nonkestrelColor = $state('');

  let { boxID = null }: { boxID?: string | null } = $props();
  let lastFetchedBoxID = $state<string | null | undefined>(undefined);

  //changes data to be within format for chart
  function buildWeeks(data: DayData[]) {
    if (!data.length) return [];

    const weeks: any[] = [];

    let currentWeek: any = null;
    let weekIndex = 1;

    let startDate = new Date(data[0]?.date);

    function startOfWeek(date: Date) {
      const d = new Date(date);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    let currentWeekStart = startOfWeek(startDate);

    function formatLabel(start: Date) {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

      return `Week ${weekIndex++} (${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)})`;
    }

    for (const row of data) {
      const rowDate = new Date(row.date);
      const weekStart = startOfWeek(rowDate);

      if (!currentWeek || weekStart.getTime() !== currentWeekStart.getTime()) {
        currentWeekStart = weekStart;

        currentWeek = {
          label: formatLabel(weekStart),
          kestrel: Array(7).fill(0),
          nonkestrel: Array(7).fill(0),
          _start: weekStart
        };

        weeks.push(currentWeek);
      }

      const dayIndex = rowDate.getDay();

      currentWeek.kestrel[dayIndex] = row.kestrel;
      currentWeek.nonkestrel[dayIndex] = row.other;
    }

  return weeks;
}

onMount(async () => {
  const style = getComputedStyle(document.documentElement);
  kestrelColor = style.getPropertyValue('--color-core-green-100').trim();
  nonkestrelColor = style.getPropertyValue('--color-core-blue-100').trim();
});

async function fetchBarData(id: string | null) {
  try {
    loading = true;
    const url = id
      ? `/api/graphCalcRoutes/barChart/?boxID=${encodeURIComponent(id)}`
      : '/api/graphCalcRoutes/barChart/';
    const res = await fetch(url);
    const raw: DayData[] = await res.json();

    if (!Array.isArray(raw)) {
      console.error('Invalid API response', raw);
      return;
    }

    currentWeekIndex = 0;
    allWeeks = buildWeeks(raw);
  } catch (err) {
    console.error('Failed to fetch chart data', err);
  } finally {
    loading = false;
  }
}

$effect(() => {
  if (!browser) return;
  if (lastFetchedBoxID === boxID) return;
  lastFetchedBoxID = boxID;
  fetchBarData(boxID);
});

let data = $derived(
  (() => {
    const week = allWeeks[currentWeekIndex];

    if (!week) {
      return { labels: days, datasets: [] };
    }

    return {
      labels: days,
      datasets: [
        {
          label: 'Kestrel Visits',
          data: week.kestrel,
          borderColor: kestrelColor,
          backgroundColor: kestrelColor + '33',
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Non-Kestrel Visits',
          data: week.nonkestrel,
          borderColor: nonkestrelColor,
          backgroundColor: nonkestrelColor + '33',
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };
  })()
);

  const options: ChartOptions<'bar'> = {
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
          text: 'Day',
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
      onclick={() => currentWeekIndex--}
      disabled={currentWeekIndex === 0}
    >
      ← Previous
    </button>

    <span class="text-sm font-medium">
      {allWeeks[currentWeekIndex]?.label ?? 'Loading...'}
    </span>
    <button
      class="px-3 py-1 rounded-md text-sm border border-border bg-background
        text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40
        disabled:cursor-not-allowed"
      onclick={() => currentWeekIndex++}
      disabled={currentWeekIndex === allWeeks.length - 1}
    >
      Next →
    </button>
  </div>

  <Bar {data} {options} />
</div>