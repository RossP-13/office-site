<script lang="ts">
  import { onMount } from 'svelte';
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

  Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

  const amHours = ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
                   '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];
  const pmHours = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
                   '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];

  const allData = [
    {
      label: 'AM (12:00 AM - 11:00 AM)',
      hours: amHours,
      kestrel:    [2, 1, 0, 0, 3, 8, 15, 22, 30, 28, 25, 20],
      nonkestrel: [1, 0, 0, 0, 2, 5, 10, 18, 24, 22, 20, 16],
    },
    {
      label: 'PM (12:00 PM - 11:00 PM)',
      hours: pmHours,
      kestrel:    [18, 22, 25, 28, 30, 35, 28, 20, 15, 10, 6, 3],
      nonkestrel: [14, 18, 20, 22, 25, 30, 22, 16, 12, 8,  4, 2],
    },
  ];

  let currentIndex = $state(0);
  let kestrelColor = $state('');
  let nonkestrelColor = $state('');

  let data = $derived({
    labels: allData[currentIndex].hours,
    datasets: [
      {
        label: 'Kestrel Visits',
        data: allData[currentIndex].kestrel,
        borderColor: kestrelColor,
        backgroundColor: kestrelColor + '33',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Non-Kestrel Visits',
        data: allData[currentIndex].nonkestrel,
        borderColor: nonkestrelColor,
        backgroundColor: nonkestrelColor + '33',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
        fill: false,
      },
    ],
  });

  onMount(() => {
    const style = getComputedStyle(document.documentElement);
    kestrelColor = style.getPropertyValue('--color-core-green-100').trim();
    nonkestrelColor = style.getPropertyValue('--color-core-blue-100').trim();
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
      {allData[currentIndex].label}
    </span>

    <button
      class="px-3 py-1 rounded-md text-sm border border-border bg-background
        text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40
        disabled:cursor-not-allowed"
      onclick={() => currentIndex++}
      disabled={currentIndex === allData.length - 1}
    >
      PM →
    </button>
  </div>

  <Line {data} {options} />
</div>