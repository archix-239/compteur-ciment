import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Search, Eye, History, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchApi, API_URL } from '@/lib/api';

interface QueueItem {
  id: number;
  timestamp: string;
  session_id: string;
  identifier: string;
  detection_score: number;
  logo_score: number;
  color_score: number;
  interval: number;
  capture_url: string | null;
  status: string;
  reason: string;
}

interface QueueResponse {
  items: QueueItem[];
  total: number;
}

interface ReviewItem {
  id: number;
  log_id: number;
  action: string;
  target_status?: string;
  notes?: string;
  reviewer: string;
  created_at: string;
}

export default function ManualVerification() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<ReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams({ page: '1', page_size: '50' });
      if (search.trim()) q.set('search', search.trim());
      const queue = await fetchApi(`/api/quality/manual-verification?${q.toString()}`) as QueueResponse;
      const reviews = await fetchApi('/api/quality/reviews?limit=50') as ReviewItem[];
      setItems(queue.items);
      setHistory(reviews);
    } catch (error) {
      console.error('Erreur chargement vérification manuelle:', error);
      setItems([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const applyReview = async (action: 'validate' | 'reject') => {
    if (!selectedItem) return;
    try {
      setSaving(true);
      await fetchApi(`/api/logs/${selectedItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          target_status: action === 'validate' ? 'conforme' : 'rejete',
          notes,
          reviewer: 'operator',
        }),
      });
      setSelectedItem(null);
      setNotes('');
      await loadData();
    } catch (error) {
      console.error('Erreur review log:', error);
    } finally {
      setSaving(false);
    }
  };

  const netAdjustment = useMemo(
    () => history.filter((h) => h.action.toLowerCase().includes('validate')).length - history.filter((h) => h.action.toLowerCase().includes('reject')).length,
    [history],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Vérification Manuelle</h1>
          <p className="text-muted-foreground">Validez, rejetez ou corrigez les sacs suspects détectés par l'IA.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="pending" className="gap-2"><AlertCircle className="w-4 h-4" /> En attente de révision</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" /> Historique des corrections</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-4 bg-card/50 border-zinc-800">
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Rechercher un UUID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <Button variant="outline" className="border-zinc-800 text-white" onClick={loadData}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualiser'}</Button>
              </div>

              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">ID</TableHead>
                      <TableHead className="text-zinc-400">Timestamp</TableHead>
                      <TableHead className="text-zinc-400">Session</TableHead>
                      <TableHead className="text-zinc-400">Raison</TableHead>
                      <TableHead className="text-zinc-400">Confiance</TableHead>
                      <TableHead className="text-zinc-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Chargement...</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Aucun élément à vérifier.</TableCell></TableRow>
                    ) : items.map((item) => (
                      <TableRow key={item.id} className="border-zinc-800 hover:bg-muted/10 transition-colors">
                        <TableCell className="font-mono text-orange-400">R-{item.id}</TableCell>
                        <TableCell className="text-zinc-300 text-xs">{new Date(item.timestamp).toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-zinc-500 text-xs font-mono">{item.session_id}</TableCell>
                        <TableCell className="text-zinc-400 text-xs">{item.reason}</TableCell>
                        <TableCell className="text-zinc-300 text-xs font-mono">{item.detection_score.toFixed(2)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="border-zinc-800 text-white" onClick={() => { setSelectedItem(item); setNotes(''); }}>
                                <Eye className="w-3.5 h-3.5 mr-1" /> Réviser
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl">
                              <DialogHeader><DialogTitle>Révision manuelle — R-{item.id}</DialogTitle></DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-zinc-800 bg-black/40 p-2 min-h-[240px] flex items-center justify-center">
                                  {item.capture_url ? <img src={`${API_URL}${item.capture_url}`} alt={`capture-${item.id}`} className="max-h-[220px] object-contain rounded" /> : <span className="text-zinc-500 text-sm">Aucune capture</span>}
                                </div>
                                <div className="space-y-3 text-sm">
                                  <p><span className="text-zinc-500">UUID:</span> <span className="font-mono">{item.identifier}</span></p>
                                  <p><span className="text-zinc-500">Détection:</span> {item.detection_score.toFixed(2)}</p>
                                  <p><span className="text-zinc-500">Logo:</span> {item.logo_score.toFixed(2)}</p>
                                  <p><span className="text-zinc-500">Couleur:</span> {item.color_score.toFixed(2)}</p>
                                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes opérateur..." className="h-28 bg-zinc-900 border-zinc-800" />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => applyReview('reject')} disabled={saving} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Confirmer rejet
                                </Button>
                                <Button onClick={() => applyReview('validate')} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} Valider comme sac
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
                <h3 className="font-semibold flex items-center gap-2 text-white text-sm"><ShieldCheck className="w-4 h-4 text-green-500" /> Stats de Vérification</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">En attente</span><span className="font-mono text-white">{items.length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">Corrections historiques</span><span className="font-mono text-green-400">{history.length}</span></div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold"><span className="text-white">Ajustement Net</span><span className={netAdjustment >= 0 ? 'text-green-400' : 'text-red-400'}>{netAdjustment >= 0 ? '+' : ''}{netAdjustment} sacs</span></div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-4 bg-card/50 border-zinc-800">
            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Log ID</TableHead>
                    <TableHead className="text-zinc-400">Action</TableHead>
                    <TableHead className="text-zinc-400">Utilisateur</TableHead>
                    <TableHead className="text-zinc-400">Moment</TableHead>
                    <TableHead className="text-zinc-400">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id} className="border-zinc-800">
                      <TableCell className="font-mono text-zinc-300 text-xs">{h.log_id}</TableCell>
                      <TableCell><Badge variant="outline" className="border-zinc-700 text-zinc-200">{h.action.toUpperCase()}</Badge></TableCell>
                      <TableCell className="text-white text-sm">{h.reviewer}</TableCell>
                      <TableCell className="text-zinc-500 text-xs">{new Date(h.created_at).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="text-zinc-400 text-xs italic">{h.notes || '-'}</TableCell>
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
