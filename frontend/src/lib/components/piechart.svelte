<script lang="ts">
    import { onMount } from 'svelte';
  import { Pie } from 'svelte-chartjs';
  import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
  Chart.register(ArcElement, Tooltip, Legend);

  let data = $state({
    labels: ['Kestrels', 'Non-Kestrels'],
    datasets: [] as any[],
  });

  onMount(() => {
    const style = getComputedStyle(document.documentElement);
    const kestrelColor = style.getPropertyValue('--color-core-green-100').trim();
    const nonkestrelColor = style.getPropertyValue('--color-core-blue-100').trim();

    data.datasets = [
      {
        data: [275, 200],
        backgroundColor: [kestrelColor, nonkestrelColor],
        borderColor: [kestrelColor, nonkestrelColor],
        borderWidth: 1,
      },
    ];
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
  <Pie {data} {options}/>
</div>