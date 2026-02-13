import { useState } from 'react';
import {
  ShieldCheck,
  XCircle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  RotateCcw,
  MessageSquare,
  Plus,
  Minus,
  History,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOCK_REJECTED = Array.from({ length: 8 }).map((_, i) => ({
  id: `R-${500 + i}`,
  timestamp: new Date(Date.now() - i * 120000).toLocaleTimeString(),
  reason: i % 2 === 0 ? 'Low Logo Score (0.34)' : 'QR Code Not Found',
  confidence: (0.4 + Math.random() * 0.2).toFixed(2),
  status: 'Rejected'
}));

const MOCK_HISTORY = [
  { id: 'R-498', type: 'Validated', user: 'Admin', time: '10:15 AM', notes: 'Logo visible, QR obscured by dust.' },
  { id: 'R-495', type: 'Rejected', user: 'Operator John', time: '09:45 AM', notes: 'Plastic waste detected, not a bag.' },
  { id: 'MAN-01', type: 'Added', user: 'Admin', time: '09:30 AM', notes: 'Uncaptured bag due to camera glitch.' },
];

export default function ManualVerification() {
  const [items, setItems] = useState(MOCK_REJECTED);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleVerify = (id: string, action: 'validate' | 'reject') => {
    setItems(items.filter(item => item.id !== id));
    // In a real app, this would send an API request
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manual Verification</h1>
          <p className="text-muted-foreground">Review and override AI detection decisions</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4" /> Add Manual Count
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Add Manual Bag Count</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Use this to add a bag that was missed by the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" defaultValue="1" className="bg-zinc-900 border-zinc-800" />
                </div>
                <div className="space-y-2">
                  <Label>Reason / Note</Label>
                  <Textarea placeholder="Why are you adding this?" className="bg-zinc-900 border-zinc-800" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-zinc-800 text-white hover:bg-zinc-900">Cancel</Button>
                <Button onClick={() => setShowAddDialog(false)} className="bg-orange-600 hover:bg-orange-700">Add Count</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="pending" className="gap-2">
            <AlertCircle className="w-4 h-4" /> Pending Review
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" /> Correction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-4 bg-card/50">
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search rejected items..." className="pl-10 bg-zinc-900 border-zinc-800" />
                </div>
                <Button variant="outline" size="icon" className="border-zinc-800"><Filter className="w-4 h-4" /></Button>
              </div>

              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">ID</TableHead>
                      <TableHead className="text-zinc-400">Time</TableHead>
                      <TableHead className="text-zinc-400">Rejection Reason</TableHead>
                      <TableHead className="text-right text-zinc-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-muted/30 border-zinc-800">
                        <TableCell className="font-mono font-bold text-red-400">{item.id}</TableCell>
                        <TableCell className="text-muted-foreground">{item.timestamp}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{item.reason}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Conf: {item.confidence}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-400 hover:text-white" onClick={() => setSelectedItem(item)}>
                                <Eye className="w-4 h-4" /> Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-[600px] text-white">
                              <DialogHeader>
                                <DialogTitle>Review Rejection: {selectedItem?.id}</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Check the visual proof before making a decision.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                  <Label>Snapshot</Label>
                                  <div className="aspect-square bg-black rounded-lg flex items-center justify-center border border-zinc-800 relative overflow-hidden">
                                    <RotateCcw className="w-8 h-8 text-zinc-800" />
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600">
                                      [MOCK SNAPSHOT]
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase">AI Data</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <span className="text-zinc-500">YOLO Conf:</span>
                                      <span className="text-zinc-300">{selectedItem?.confidence}</span>
                                      <span className="text-zinc-500">Logo Match:</span>
                                      <span className="text-red-400">0.34 (Fail)</span>
                                      <span className="text-zinc-500">Color Sim:</span>
                                      <span className="text-green-400">0.88 (Pass)</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Decision Notes</Label>
                                    <Textarea placeholder="Explain your decision..." className="h-24 bg-zinc-900 border-zinc-800" />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => handleVerify(selectedItem?.id, 'reject')} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                                  <XCircle className="w-4 h-4 mr-2" /> Confirm Rejection
                                </Button>
                                <Button onClick={() => handleVerify(selectedItem?.id, 'validate')} className="bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle className="w-4 h-4 mr-2" /> Validate Bag
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
                <h3 className="font-semibold flex items-center gap-2 text-white">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Verification Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Rejections</span>
                    <span className="font-mono text-white">142</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manual Overrides</span>
                    <span className="font-mono text-green-400">+12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manual Additions</span>
                    <span className="font-mono text-orange-400">+5</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold">
                    <span className="text-white">Net Adjustment</span>
                    <span className="text-green-400">+17 sacs</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-4 bg-orange-500/5 border-orange-500/10">
                <h3 className="font-semibold text-orange-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Review Tips
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Verify the "Low Logo Score" rejections carefully. Often caused by folded bags or poor lighting. If the shape is clearly a cement bag, manual validation is recommended.
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-4 bg-card/50 border-zinc-800">
            <div className="rounded-md border border-zinc-800">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Source ID</TableHead>
                    <TableHead className="text-zinc-400">Action Type</TableHead>
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">Time</TableHead>
                    <TableHead className="text-zinc-400">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_HISTORY.map((log, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="font-mono text-zinc-300">{log.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.type === 'Validated' ? 'border-green-500/50 text-green-400' :
                            log.type === 'Rejected' ? 'border-red-500/50 text-red-400' :
                            'border-orange-500/50 text-orange-400'
                          }
                        >
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{log.user}</TableCell>
                      <TableCell className="text-zinc-500">{log.time}</TableCell>
                      <TableCell className="text-zinc-400 text-sm">{log.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
