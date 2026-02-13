import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ZoomIn,
  ZoomOut,
  Filter,
  Download,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';

const MOCK_TIMELINE_DATA = Array.from({ length: 24 }).map((_, i) => {
  const hour = `${i}:00`;
  const count = 500 + Math.floor(Math.random() * 800);
  const avgInterval = (1.8 + Math.random() * 1.5).toFixed(2);
  const rejected = Math.floor(Math.random() * 50);
  return { time: hour, count, interval: parseFloat(avgInterval), rejected };
});

export default function Timeline() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Production Timeline</h1>
          <p className="text-muted-foreground">Historical visual analysis of production cycles and speed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white">
            <Filter className="w-4 h-4" /> Filter Range
          </Button>
          <Button variant="outline" className="gap-2 border-zinc-800 text-white">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Activity className="w-5 h-5 text-orange-500" />
              <span>Production Hourly Distribution (Last 24h)</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 border border-zinc-800 text-zinc-400 hover:text-white"><ZoomIn className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 border border-zinc-800 text-zinc-400 hover:text-white"><ZoomOut className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MOCK_TIMELINE_DATA}>
                <defs>
                  <linearGradient id="colorCountArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(251,191,36,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  cursor={{ stroke: 'rgba(249, 115, 22, 0.2)', strokeWidth: 2 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area yAxisId="left" type="monotone" dataKey="count" fill="url(#colorCountArea)" stroke="none" />
                <Bar yAxisId="left" dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} name="Bags Counted" />
                <Line yAxisId="right" type="monotone" dataKey="interval" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} name="Avg Interval (s)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Peak Analysis</h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-green-400 uppercase">Maximum Load</span>
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">1,312 bags/h</div>
                <div className="text-[10px] text-zinc-500 mt-1">Today at 14:00</div>
              </div>

              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-red-400 uppercase">Minimum Load</span>
                  <ArrowDown className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">520 bags/h</div>
                <div className="text-[10px] text-zinc-500 mt-1">Today at 03:00</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Timeline Filters</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase">Select Date</span>
                <Button variant="outline" className="w-full justify-start text-xs border-zinc-800 bg-zinc-900/50 text-white">
                  <CalendarIcon className="w-3 h-3 mr-2 text-orange-500" />
                  August 27, 2025
                </Button>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase">Quick Select</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="h-7 text-[9px] bg-zinc-800 text-white">LAST 6H</Button>
                  <Button variant="secondary" className="h-7 text-[9px] bg-zinc-800 text-white">LAST 24H</Button>
                  <Button variant="secondary" className="h-7 text-[9px] bg-zinc-800 text-white">SHIFT A</Button>
                  <Button variant="secondary" className="h-7 text-[9px] bg-zinc-800 text-white">SHIFT B</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
