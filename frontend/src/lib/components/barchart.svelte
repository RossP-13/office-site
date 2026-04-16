<script lang="ts">
  import { onMount } from 'svelte';
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

  const allWeeks = [
    {
      label: 'Week 1 (Jan 5 - Jan 11)',
      kestrel:    [12, 20, 15, 18, 22, 30, 10],
      nonkestrel: [8,  14, 10, 12, 18, 25, 6 ],
    },
    {
      label: 'Week 2 (Jan 12 - Jan 18)',
      kestrel:    [18, 22, 19, 25, 28, 35, 14],
      nonkestrel: [10, 16, 13, 20, 22, 30, 9 ],
    },
    {
      label: 'Week 3 (Jan 19 - Jan 25)',
      kestrel:    [10, 18, 22, 20, 24, 28, 12],
      nonkestrel: [6,  12, 15, 14, 18, 22, 8 ],
    },
    {
      label: 'Week 4 (Jan 26 - Feb 1)',
      kestrel:    [14, 24, 18, 22, 26, 32, 16],
      nonkestrel: [9,  18, 12, 16, 20, 28, 11],
    },
  ];

  let currentWeekIndex = $state(0);

  let kestrelColor = $state('');
  let nonkestrelColor = $state('');

  let data = $derived({
    labels: days,
    datasets: [
      {
        label: 'Kestrel Visits',
        data: allWeeks[currentWeekIndex].kestrel,
        borderColor: kestrelColor,
        backgroundColor: kestrelColor + '33',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Non-Kestrel Visits',
        data: allWeeks[currentWeekIndex].nonkestrel,
        borderColor: nonkestrelColor,
        backgroundColor: nonkestrelColor + '33',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  });

  onMount(() => {
    const style = getComputedStyle(document.documentElement);
    kestrelColor = style.getPropertyValue('--color-core-green-100').trim();
    nonkestrelColor = style.getPropertyValue('--color-core-blue-100').trim();
  });

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
      {allWeeks[currentWeekIndex].label}
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