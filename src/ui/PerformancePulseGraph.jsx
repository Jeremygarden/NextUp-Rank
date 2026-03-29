import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * NextUp-Rank: PerformancePulseGraph
 * 核心逻辑：展示最近 25 场比赛的 Rating 波动，并根据 BG-1 权重 lambda 进行视觉加权。
 * 特色：越近的比赛颜色越亮（发光），暗示对手感/波动的敏感度。
 */

// 模拟最近 25 场比赛数据
const generateMockData = () => {
  let currentRating = 500;
  return Array.from({ length: 25 }, (_, i) => {
    const change = Math.floor(Math.random() * 20 - 8); // 模拟波动
    currentRating += change;
    return {
      matchIndex: i + 1,
      rating: currentRating,
      // 计算时间权重 omega = e^(-0.1 * (25 - i))
      weight: Math.exp(-0.1 * (25 - (i + 1)))
    };
  });
};

const PerformancePulseGraph = ({ data: propData }) => {
  const mockData = useMemo(() => generateMockData(), []);
  const data = propData || mockData;

  // 自定义点渲染：根据权重调整发光强度和大小
  const RenderCustomizedDot = (props) => {
    const { cx, cy, payload } = props;
    const { weight } = payload;
    
    // 权重越大（越近），点越亮，半径越大
    const radius = 2 + weight * 4;
    const opacity = 0.3 + weight * 0.7;
    const glowColor = weight > 0.8 ? '#fbbf24' : '#60a5fa'; // 近期橙色，远期蓝色

    return (
      <g>
        <circle 
          cx={cx} cy={cy} r={radius + 4} 
          fill={glowColor} fillOpacity={opacity * 0.2} 
        />
        <circle 
          cx={cx} cy={cy} r={radius} 
          fill={glowColor} fillOpacity={opacity} 
          stroke="#fff" strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <div className="w-full h-80 bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-slate-100 font-bold text-lg">Performance Pulse</h3>
          <p className="text-slate-400 text-xs">Based on BG-1 Weighted Algorithm (Recent 25)</p>
        </div>
        <div className="text-right">
          <span className="text-amber-400 font-mono text-2xl font-black">
            {data[data.length - 1]?.rating ?? '--'}
          </span>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">Current Rating</p>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="70%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            
            <XAxis 
              dataKey="matchIndex" 
              hide 
            />
            
            <YAxis 
              domain={['dataMin - 20', 'dataMax + 20']} 
              hide 
            />

            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: '#334155', strokeWidth: 1 }}
            />

            <Line 
              type="monotone" 
              dataKey="rating" 
              stroke="url(#lineGradient)" 
              strokeWidth={3}
              dot={<RenderCustomizedDot />}
              activeDot={{ r: 8, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between mt-4 text-[10px] text-slate-500 uppercase tracking-tighter">
        <span>25 Matches Ago</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
          <span>Stable</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Hot Streak</span>
        </div>
        <span>Latest</span>
      </div>
    </div>
  );
};

export default PerformancePulseGraph;
