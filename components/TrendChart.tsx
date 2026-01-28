
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Payoff } from '../types';

export type MetricType = 'pts_us' | 'pts_china' | 'inflation_index';

interface Props {
  payoff: Payoff;
  metric: MetricType;
}

export const TrendChart: React.FC<Props> = ({ payoff, metric }) => {
  const config = useMemo(() => {
    switch (metric) {
      case 'pts_us':
        return {
          baseColor: '#1971c2',
          forecastColor: '#74c0fc',
          baseline: 8,
          volatility: 1,
          label: 'US Points'
        };
      case 'pts_china':
        return {
          baseColor: '#e03131',
          forecastColor: '#ff8787',
          baseline: 7,
          volatility: 1.5,
          label: 'China Points'
        };
      case 'inflation_index':
        return {
          baseColor: '#495057',
          forecastColor: '#adb5bd',
          baseline: 50,
          volatility: 5,
          label: 'Inflation Rate'
        };
    }
  }, [metric]);

  const data = useMemo(() => {
    // Generate data based on metric config
    const pointsData = [];
    const currentYear = new Date().getFullYear();
    const months = [`${currentYear}`, 'Q2', 'Q3', 'Q4'];
    const cycles = 4;
    const stepsPerCycle = 10;

    let timeIndex = 0;
    for (let c = 0; c < cycles; c++) {
      for (let s = 0; s < stepsPerCycle; s++) {
        const base = config.baseline + (Math.random() * 2);
        // Vary shape based on metric
        let demand, forecast;

        if (metric === 'pts_us') {
          // Stable high points
          demand = Math.min(10, base + Math.sin(timeIndex * 0.1) * 0.5 + (s * 0.05));
          forecast = Math.min(10, demand + 0.5);
        } else if (metric === 'pts_china') {
          // Scaled points
          demand = Math.min(10, base + Math.sin(timeIndex * 0.15) * 0.8 + (s * 0.08));
          forecast = Math.min(10, demand + 0.6);
        } else {
          // Volatile spike for inflation
          demand = base + (Math.random() * config.volatility * 5);
          forecast = demand + (Math.random() * 10);
        }

        pointsData.push({
          time: timeIndex++,
          label: s === 0 ? months[c] : '',
          demand: demand,
          forecast: forecast
        });
      }
    }
    return pointsData;
  }, [payoff, metric, config]);

  return (
    <div className="h-full w-full flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.baseColor} stopOpacity={0.1} />
              <stop offset="95%" stopColor={config.baseColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.forecastColor} stopOpacity={0.1} />
              <stop offset="95%" stopColor={config.forecastColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="1 1" vertical={true} stroke="#f1f3f5" />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: '#dee2e6' }}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#868e96', fontWeight: 600 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: '#adb5bd' }}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="demand"
            stroke={config.baseColor}
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorDemand)"
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke={config.forecastColor}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorForecast)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 py-1 border-t border-[#f1f3f5]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5" style={{ backgroundColor: config.baseColor }} />
          <span className="text-[8px] font-bold text-[#868e96] uppercase">{config.label} (Actual)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5" style={{ backgroundColor: config.forecastColor }} />
          <span className="text-[8px] font-bold text-[#868e96] uppercase">{config.label} (Proj)</span>
        </div>
      </div>
    </div>
  );
};
