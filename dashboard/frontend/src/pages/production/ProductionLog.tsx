import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
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
  timestamp: new Date(Date.now() - i * 5000).toLocaleTimeString('fr-FR'),
  detectionScore: (0.85 + Math.random() * 0.14).toFixed(2),
  logoScore: (0.75 + Math.random() * 0.2).toFixed(2),
  colorScore: (0.8 + Math.random() * 0.15).toFixed(2),
  status: Math.random() > 0.1 ? 'Vérifié' : 'Rejeté',
  interval: (2.1 + Math.random() * 0.5).toFixed(1) + 's',
  uuid: Math.random() > 0.2 ? `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : 'MANQUANT'
}));

export default function ProductionLog() {
  const [logs] = useState(MOCK_LOGS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Journal de Production</h1>
          <p className="text-muted-foreground">Historique détaillé de tous les sacs détectés et comptés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2 border-zinc-800 text-white">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher par ID ou UUID..." className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-zinc-800 text-white">
                  <Filter className="w-4 h-4" /> Statut
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer">Tous les statuts</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer">Vérifiés uniquement</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer">Rejetés uniquement</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input type="date" className="w-auto bg-zinc-900 border-zinc-800 text-white" />
          </div>
        </div>

        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-zinc-800">
                <TableHead className="w-[100px] text-zinc-400">ID Sac</TableHead>
                <TableHead className="text-zinc-400">Horodatage</TableHead>
                <TableHead className="text-zinc-400">UUID QR Code</TableHead>
                <TableHead className="text-center text-zinc-400">Détection</TableHead>
                <TableHead className="text-center text-zinc-400">Logo</TableHead>
                <TableHead className="text-center text-zinc-400">Couleur</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400">Intervalle</TableHead>
                <TableHead className="text-right text-zinc-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors border-zinc-800">
                  <TableCell className="font-mono font-bold text-orange-400">{log.id}</TableCell>
                  <TableCell className="text-zinc-300">{log.timestamp}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">{log.uuid}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-zinc-400">{log.detectionScore}</span>
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
                      variant={log.status === 'Vérifié' ? 'default' : 'destructive'}
                      className="gap-1 px-2 text-[10px]"
                    >
                      {log.status === 'Vérifié' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {log.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-zinc-400 text-xs">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {log.interval}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" title="Voir Capture">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Affichage de 20 sur 1 242 entrées
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="border-zinc-800 text-zinc-500">Précédent</Button>
            <Button variant="outline" size="sm" className="border-zinc-800 text-white">Suivant</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
