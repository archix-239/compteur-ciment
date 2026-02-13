import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Production Log Page
 * Detailed history of all counted bags
 */

// Mock data for production log
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
  const [logs] = useState(MOCK_LOGS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Production Log</h1>
          <p className="text-muted-foreground">Historical record of all detected and counted bags</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-card/50">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by ID or UUID..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" /> Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All Statuses</DropdownMenuItem>
                <DropdownMenuItem>Verified Only</DropdownMenuItem>
                <DropdownMenuItem>Rejected Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input type="date" className="w-auto" />
          </div>
        </div>

        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Bag ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>QR UUID</TableHead>
                <TableHead className="text-center">Detection</TableHead>
                <TableHead className="text-center">Logo</TableHead>
                <TableHead className="text-center">Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold text-orange-400">{log.id}</TableCell>
                  <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="font-mono text-xs">{log.uuid}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">{log.detectionScore}</span>
                      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${parseFloat(log.detectionScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs ${parseFloat(log.logoScore) > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {log.logoScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs ${parseFloat(log.colorScore) > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {log.colorScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === 'Verified' ? 'default' : 'destructive'}
                      className="gap-1 px-2"
                    >
                      {log.status === 'Verified' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {log.interval}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="View Snapshot">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing 20 of 1,242 entries
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
