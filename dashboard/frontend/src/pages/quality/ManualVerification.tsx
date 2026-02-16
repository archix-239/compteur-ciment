import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
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
  timestamp: new Date(Date.now() - i * 120000).toLocaleTimeString('fr-FR'),
  reason: i % 2 === 0 ? 'Score Logo Faible (0.34)' : 'Code QR Non Trouvé',
  confidence: (0.4 + Math.random() * 0.2).toFixed(2),
  status: 'Rejeté'
}));

const MOCK_HISTORY = [
  { id: 'R-498', type: 'Validé', user: 'Admin', time: '10:15', notes: 'Logo visible, QR obscurci par la poussière.' },
  { id: 'R-495', type: 'Rejeté', user: 'Opérateur John', time: '09:45', notes: 'Déchet plastique détecté, pas un sac.' },
  { id: 'MAN-01', type: 'Ajouté', user: 'Admin', time: '09:30', notes: 'Sac non capturé à cause d\'un glitch caméra.' },
];

export default function ManualVerification() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/logs/`)
      .then(res => res.json())
      .then(data => {
        const rejected = data.filter((l: any) => l.status === 'rejete').map((l: any) => ({
          id: `R-${l.id}`,
          timestamp: new Date(l.timestamp).toLocaleTimeString('fr-FR'),
          reason: 'Non conforme',
          confidence: l.detection_score.toFixed(2),
          status: 'Rejeté',
          captureUrl: l.capture_url
        }));
        setItems(rejected);
      })
      .catch(err => console.error("Error fetching logs for verification:", err));
  }, []);

  const handleVerify = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Vérification Manuelle</h1>
          <p className="text-muted-foreground">Examinez et remplacez les décisions de détection de l'IA</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4" /> Ajout Comptage Manuel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Ajouter un Sac Manuellement</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Utilisez ceci pour ajouter un sac qui a été manqué par le système.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input type="number" defaultValue="1" className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Raison / Note</Label>
                  <Textarea placeholder="Pourquoi ajoutez-vous cela ?" className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-zinc-800 text-white hover:bg-zinc-900">Annuler</Button>
                <Button onClick={() => setShowAddDialog(false)} className="bg-orange-600 hover:bg-orange-700">Ajouter au Compteur</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="pending" className="gap-2">
            <AlertCircle className="w-4 h-4" /> En attente de révision
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" /> Historique des corrections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-4 bg-card/50 border-zinc-800">
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Rechercher des éléments rejetés..." className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <Button variant="outline" size="icon" className="border-zinc-800 text-white"><Filter className="w-4 h-4" /></Button>
              </div>

              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">ID</TableHead>
                      <TableHead className="text-zinc-400">Temps</TableHead>
                      <TableHead className="text-zinc-400">Raison de rejet</TableHead>
                      <TableHead className="text-right text-zinc-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-muted/30 border-zinc-800 transition-colors">
                        <TableCell className="font-mono font-bold text-red-400">{item.id}</TableCell>
                        <TableCell className="text-zinc-300">{item.timestamp}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{item.reason}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-mono">Confiance: {item.confidence}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-400 hover:text-white" onClick={() => setSelectedItem(item)}>
                                <Eye className="w-4 h-4" /> Réviser
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-[600px] text-white">
                              <DialogHeader>
                                <DialogTitle>Révision du rejet : {selectedItem?.id}</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Vérifiez la preuve visuelle avant de prendre une décision.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                  <Label>Capture</Label>
                                  <div className="aspect-square bg-black rounded-lg flex items-center justify-center border border-zinc-800 relative overflow-hidden">
                                    {selectedItem?.captureUrl ? (
                                      <img src={`${API_URL}${selectedItem.captureUrl}`} alt="Capture" className="w-full h-full object-cover" />
                                    ) : (
                                      <>
                                        <RotateCcw className="w-8 h-8 text-zinc-800" />
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600">
                                          [CAPTURE NON DISPONIBLE]
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Données IA</div>
                                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                                      <span className="text-zinc-500">Conf. YOLO:</span>
                                      <span className="text-zinc-300">{selectedItem?.confidence}</span>
                                      <span className="text-zinc-500">Match Logo:</span>
                                      <span className="text-red-400">0.34 (Fail)</span>
                                      <span className="text-zinc-500">Sim. Couleur:</span>
                                      <span className="text-green-400">0.88 (Pass)</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Notes de décision</Label>
                                    <Textarea placeholder="Expliquez votre choix..." className="h-24 bg-zinc-900 border-zinc-800 text-sm" />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => handleVerify(selectedItem?.id)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                                  <XCircle className="w-4 h-4 mr-2" /> Confirmer Rejet
                                </Button>
                                <Button onClick={() => handleVerify(selectedItem?.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                                  <CheckCircle className="w-4 h-4 mr-2" /> Valider comme Sac
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
                <h3 className="font-semibold flex items-center gap-2 text-white text-sm">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Stats de Vérification
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Total Rejetés</span>
                    <span className="font-mono text-white">142</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Remplacements Manuels</span>
                    <span className="font-mono text-green-400">+12</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Ajouts Manuels</span>
                    <span className="font-mono text-orange-400">+5</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold">
                    <span className="text-white">Ajustement Net</span>
                    <span className="text-green-400">+17 sacs</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3 bg-orange-500/5 border-orange-500/10">
                <h3 className="font-semibold text-orange-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  Conseils de Révision
                </h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                  Vérifiez attentivement les rejets pour "Score Logo Faible". Souvent dû à des sacs pliés ou un mauvais éclairage. Si la forme est clairement un sac de ciment, la validation manuelle est recommandée.
                </p>
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
                    <TableHead className="text-zinc-400">ID Source</TableHead>
                    <TableHead className="text-zinc-400">Type d'Action</TableHead>
                    <TableHead className="text-zinc-400">Utilisateur</TableHead>
                    <TableHead className="text-zinc-400">Moment</TableHead>
                    <TableHead className="text-zinc-400">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_HISTORY.map((log, i) => (
                    <TableRow key={i} className="border-zinc-800 hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-zinc-300 text-xs">{log.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.type === 'Validé' ? 'border-green-500/50 text-green-400 bg-green-500/5' :
                            log.type === 'Rejeté' ? 'border-red-500/50 text-red-400 bg-red-500/5' :
                            'border-orange-500/50 text-orange-400 bg-orange-500/5'
                          }
                        >
                          {log.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-sm">{log.user}</TableCell>
                      <TableCell className="text-zinc-500 text-xs">{log.time}</TableCell>
                      <TableCell className="text-zinc-400 text-xs italic">{log.notes}</TableCell>
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
