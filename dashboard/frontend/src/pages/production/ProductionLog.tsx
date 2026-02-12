import { useState } from 'react';
import { Search, Download, CheckCircle2, XCircle, Clock, Eye, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MOCK_LOGS = Array.from({ length: 20 }).map((_, i) => ({
  id: `B-${1000 + i}`,
  timestamp: new Date(Date.now() - i * 5000).toLocaleTimeString(),
  detectionScore: (0.85 + Math.random() * 0.14).toFixed(2),
  logoScore: (0.75 + Math.random() * 0.2).toFixed(2),
  colorScore: (0.8 + Math.random() * 0.15).toFixed(2),
  status: Math.random() > 0.1 ? 'Verified' : 'Rejected',
  interval: (2.1 + Math.random() * 0.5).toFixed(1) + 's',
  uuid: Math.random() > 0.2 ? `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : 'MISSING'
}));

export default function ProductionLog() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Production Log</h1>
          <p className="text-muted-foreground">Historical record of all detected and counted bags</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Export CSV</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export Excel</Button>
        </div>
      </div>
      <Card className="p-4 bg-card/50">
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Bag ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono font-bold text-orange-400">{log.id}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Verified' ? 'default' : 'destructive'}>{log.status}</Badge>
                  </TableCell>
                  <TableCell>{log.interval}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
