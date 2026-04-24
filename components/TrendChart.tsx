import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Payoff, MetricType } from '../types';

interface Props {
  payoff: Payoff;
  metric: MetricType;
}

export const TrendChart: React.FC<Props> = ({ payoff, metric }) => {
  const config = useMemo(() => {
    switch (metric) {
      case 'pts_tech':
        return {
          baseColor: '#1971c2',
          forecastColor: '#74c0fc',
          baseline: payoff.sectors.TECH.points,
          volatility: 1,
          label: 'Technology & AI'
        };
      case 'pts_manufacturing':
        return {
          baseColor: '#e03131',
          forecastColor: '#ff8787',
          baseline: payoff.sectors.MANUFACTURING.points,
          volatility: 1.5,
          label: 'Global Manufacturing'
        };
      case 'pts_energy':
        return {
          baseColor: '#e8590c',
          forecastColor: '#ffa94d',
          baseline: payoff.sectors.ENERGY.points,
          volatility: 2,
          label: 'Energy & Resources'
        };
      case 'pts_finance':
        return {
          baseColor: '#2b8a3e',
          forecastColor: '#69db7c',
          baseline: payoff.sectors.FINANCE.points,
          volatility: 1.2,
          label: 'Financial Markets'
        };
      case 'inflation_index':
        return {
          baseColor: '#495057',
          forecastColor: '#adb5bd',
          baseline: (payoff.sectors.TECH.inflation + payoff.sectors.MANUFACTURING.inflation + payoff.sectors.ENERGY.inflation + payoff.sectors.FINANCE.inflation) / 4,
          volatility: 5,
          label: 'Global Average Inflation'
        };
    }
  }, [metric, payoff]);

  const data = useMemo(() => {
    const pointsData = [];
    const currentYear = new Date().getFullYear();
    const months = [`${currentYear}`, 'Q2', 'Q3', 'Q4'];
    const cycles = 4;
    const stepsPerCycle = 10;

    let timeIndex = 0;
    for (let c = 0; c < cycles; c++) {
      for (let s = 0; s < stepsPerCycle; s++) {
        const base = config.baseline + (Math.random() * 1.5);
        let demand, forecast;

        if (metric === 'inflation_index') {
          demand = base + (Math.random() * config.volatility * 2);
          forecast = demand + (Math.random() * 4);
        } else {
          demand = Math.max(0, base + Math.sin(timeIndex * (config.volatility * 0.1)) * (config.volatility * 0.5) + (s * 0.05));
          forecast = demand + (Math.random() * 0.5);
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
              <stop offset="5%" stopColor={config.baseColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={config.baseColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.forecastColor} stopOpacity={0.1} />
              <stop offset="95%" stopColor={config.forecastColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
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
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="demand"
            stroke={config.baseColor}
            strokeWidth={2.5}
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
