import { useState } from 'react';
import { Package, Clock, Play, Square, History, BarChart2, Calendar, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MOCK_SESSIONS = [
  { id: 'S-20250827-01', start: '10:45 AM', end: '-', duration: '02:15:22', count: 142, rate: '28.4 b/m', status: 'Running' },
  { id: 'S-20250826-03', start: '02:30 PM', end: '06:00 PM', duration: '03:30:00', count: 4820, rate: '22.9 b/m', status: 'Completed' },
  { id: 'S-20250826-02', start: '09:00 AM', end: '01:00 PM', duration: '04:00:00', count: 5120, rate: '21.3 b/m', status: 'Completed' },
  { id: 'S-20250826-01', start: '06:00 AM', end: '08:45 AM', duration: '02:45:00', count: 3200, rate: '19.4 b/m', status: 'Completed' },
];

export default function SessionManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Session Management</h1>
          <p className="text-muted-foreground">Manage production shifts and monitor session-based performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white">
            <History className="w-4 h-4" /> Reset All
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Play className="w-4 h-4" /> Start New Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-orange-600 text-white space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-lg">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <Badge className="bg-white/20 text-white border-none">ACTIVE SESSION</Badge>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono">142 bags</div>
            <p className="text-sm opacity-80 italic">Session S-20250827-01</p>
          </div>
          <div className="pt-4 border-t border-white/20 flex justify-between">
            <div className="text-xs font-mono">02:15:22</div>
            <Button size="sm" variant="secondary" className="h-7 text-[10px] bg-white text-orange-600 hover:bg-zinc-100">
              <Square className="w-3 h-3 mr-1 fill-current" /> STOP SESSION
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-semibold uppercase text-xs tracking-wider">
            <Clock className="w-4 h-4" /> Current Pace
          </div>
          <div className="text-3xl font-bold text-white font-mono">28.4 <span className="text-sm font-normal text-zinc-500">bags / min</span></div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: '85%' }} />
          </div>
          <p className="text-[10px] text-zinc-500">Optimized performance - Above target of 22 b/m</p>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-semibold uppercase text-xs tracking-wider">
            <BarChart2 className="w-4 h-4" /> Shift Total
          </div>
          <div className="text-3xl font-bold text-white font-mono">13,282 <span className="text-sm font-normal text-zinc-500">bags today</span></div>
          <p className="text-[10px] text-green-400">+15% from yesterday's morning shift</p>
        </Card>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-white">Recent Sessions History</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input placeholder="Search sessions..." className="h-9 pl-9 w-[200px] bg-zinc-900 border-zinc-800" />
            </div>
            <Button variant="outline" size="icon" className="border-zinc-800 text-zinc-400"><Calendar className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="rounded-md border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-500">Session ID</TableHead>
                <TableHead className="text-zinc-500">Started</TableHead>
                <TableHead className="text-zinc-500">Ended</TableHead>
                <TableHead className="text-zinc-500">Duration</TableHead>
                <TableHead className="text-zinc-500 text-center">Bags Counted</TableHead>
                <TableHead className="text-zinc-500 text-center">Avg Rate</TableHead>
                <TableHead className="text-zinc-500 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SESSIONS.map((session) => (
                <TableRow key={session.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                  <TableCell className="font-mono font-bold text-white text-xs">{session.id}</TableCell>
                  <TableCell className="text-zinc-300">{session.start}</TableCell>
                  <TableCell className="text-zinc-500">{session.end}</TableCell>
                  <TableCell className="text-zinc-400 text-xs">{session.duration}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-orange-400">{session.count.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-zinc-400 text-xs">{session.rate}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={session.status === 'Running' ? 'default' : 'outline'}
                      className={session.status === 'Running' ? 'bg-green-600 hover:bg-green-600' : 'border-zinc-700 text-zinc-500'}
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
