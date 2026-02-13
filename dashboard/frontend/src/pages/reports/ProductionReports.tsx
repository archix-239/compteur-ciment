import { useState } from 'react';
import {
  FileText,
  Download,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  Clock,
  Zap,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

const MOCK_TREND_DATA = [
  { day: 'Mon', current: 1240, previous: 1100 },
  { day: 'Tue', current: 1180, previous: 1250 },
  { day: 'Wed', current: 1350, previous: 1200 },
  { day: 'Thu', current: 1420, previous: 1300 },
  { day: 'Fri', current: 1290, previous: 1350 },
  { day: 'Sat', current: 850, previous: 900 },
  { day: 'Sun', current: 720, previous: 650 },
];

const MOCK_EFFICIENCY_DATA = [
  { name: 'Uptime', value: 92, color: '#22c55e' },
  { name: 'Maintenance', value: 5, color: '#eab308' },
  { name: 'Downtime', value: 3, color: '#ef4444' },
];

export default function ProductionReports() {
  const [period, setPeriod] = useState('week');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Production Reports</h1>
          <p className="text-muted-foreground">Generate and analyze periodic production data</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900">
            <Download className="w-4 h-4" /> Export Data
          </Button>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
            <FileText className="w-4 h-4" /> Full PDF Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Output</div>
          <div className="text-2xl font-bold font-mono text-white">8,050 <span className="text-xs font-normal text-zinc-500">bags</span></div>
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <ArrowUpRight className="w-3 h-3" /> +12.4% <span className="text-zinc-500 ml-1">vs prev. period</span>
          </div>
        </Card>
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Production Rate</div>
          <div className="text-2xl font-bold font-mono text-white">28.4 <span className="text-xs font-normal text-zinc-500">b/m</span></div>
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <ArrowDownRight className="w-3 h-3" /> -1.2% <span className="text-zinc-500 ml-1">vs prev. period</span>
          </div>
        </Card>
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Detection Yield</div>
          <div className="text-2xl font-bold font-mono text-white">99.1%</div>
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <TrendingUp className="w-3 h-3" /> +0.5% <span className="text-zinc-500 ml-1">optimization gain</span>
          </div>
        </Card>
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Uptime</div>
          <div className="text-2xl font-bold font-mono text-white">164 <span className="text-xs font-normal text-zinc-500">hours</span></div>
          <div className="flex items-center gap-1 text-zinc-400 text-xs">
            <Clock className="w-3 h-3" /> 99.9% availability
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Activity className="w-5 h-5 text-orange-500" />
              <span>Production Comparison (Current vs Previous)</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TREND_DATA}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="previous" stroke="#71717a" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrev)" name="Previous Period" />
                <Area type="monotone" dataKey="current" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" name="Current Period" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="font-semibold flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-orange-500" />
            <span>OEE / Efficiency</span>
          </div>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_EFFICIENCY_DATA} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="white" fontSize={12} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {MOCK_EFFICIENCY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Overall Equipment Effectiveness</span>
              <span className="text-green-400 font-bold">91.4%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Downtime</span>
              <span className="text-red-400">04:22:15</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <h3 className="font-semibold text-white">Key Insights</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-sm font-medium text-white">Peak Production Hour</div>
              <div className="text-xs text-muted-foreground">Wednesday at 14:00 - 152 bags counted.</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-sm font-medium text-white">Highest Consistency</div>
              <div className="text-xs text-muted-foreground">Shift A maintainted 94% consistency score.</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white">Quick Export</h3>
            <p className="text-xs text-muted-foreground">Download instant reports in common formats.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-zinc-800 text-white gap-2">
              <Download className="w-4 h-4" /> CSV History
            </Button>
            <Button variant="outline" className="border-zinc-800 text-white gap-2">
              <Download className="w-4 h-4" /> Excel Trends
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
