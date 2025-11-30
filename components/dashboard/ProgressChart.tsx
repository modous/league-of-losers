'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ProgressData {
  date: string;
  exerciseCount: number;
  maxWeight: number;
}

interface ProgressChartProps {
  data: ProgressData[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Progress deze maand</h2>
        <div className="text-center text-slate-400 py-8">
          Nog geen trainingen deze maand
        </div>
      </div>
    );
  }

  const categories = data.map(d => {
    const date = new Date(d.date);
    return `${date.getDate()} ${date.toLocaleDateString('nl-NL', { month: 'short' })}`;
  });

  const series = [
    {
      name: 'Oefeningen',
      data: data.map(d => d.exerciseCount)
    },
    {
      name: 'Sterkte (kg)',
      data: data.map(d => d.maxWeight)
    }
  ];

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      background: 'transparent',
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: [5, 5],
      curve: 'smooth',
      dashArray: [0, 5]
    },
    title: {
      text: 'Progress deze maand',
      align: 'left',
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#fff'
      }
    },
    colors: ['#eab308', '#22c55e'],
    markers: {
      size: 6,
      colors: ['#eab308', '#22c55e'],
      strokeColors: '#18181b',
      strokeWidth: 2,
      hover: {
        size: 8
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#94a3b8'
      }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '12px'
        }
      },
      axisBorder: {
        color: '#374151'
      },
      axisTicks: {
        color: '#374151'
      }
    },
    yaxis: [
      {
        title: {
          text: 'Aantal oefeningen',
          style: {
            color: '#94a3b8',
            fontSize: '12px'
          }
        },
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '12px'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Sterkte (kg)',
          style: {
            color: '#94a3b8',
            fontSize: '12px'
          }
        },
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '12px'
          },
          formatter: function (val) {
            return val.toFixed(0) + ' kg';
          }
        }
      }
    ],
    tooltip: {
      theme: 'dark',
      y: [
        {
          formatter: function (val) {
            return val + ' oefeningen';
          }
        },
        {
          formatter: function (val) {
            return val.toFixed(0) + ' kg';
          }
        }
      ]
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <Chart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    </div>
  );
}
