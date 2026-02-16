import {
  Download,
  FileText,
  Table as TableIcon,
  Code,
  FileJson,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DataExport() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Export de Données</h1>
        <p className="text-muted-foreground">Extraire les données historiques pour analyse externe ou archivage légal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
           <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Filter className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Critères de Sélection</h3>
           </div>
           <div className="space-y-4">
              <div className="space-y-2">
                 <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Période</Label>
                 <Select defaultValue="today">
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                       <SelectItem value="today">Aujourd'hui</SelectItem>
                       <SelectItem value="yesterday">Hier</SelectItem>
                       <SelectItem value="last-7-days">7 Derniers Jours</SelectItem>
                       <SelectItem value="last-30-days">30 Derniers Jours</SelectItem>
                       <SelectItem value="custom">Période Personnalisée</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Source de Données</Label>
                 <Select defaultValue="counts">
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                       <SelectItem value="counts">Comptages Individuels (Brut)</SelectItem>
                       <SelectItem value="sessions">Gestion des Sessions</SelectItem>
                       <SelectItem value="anomalies">Journal des Anomalies</SelectItem>
                       <SelectItem value="quality">Métriques de Qualité</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Lignes estimées</span>
                    <div className="text-xl font-bold text-white font-mono">1,420</div>
                 </div>
                 <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Taille estimée</span>
                    <div className="text-xl font-bold text-white font-mono">4.2 MB</div>
                 </div>
              </div>
           </div>
        </Card>

        <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
           <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Download className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Format d'Export</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group">
                 <TableIcon className="w-8 h-8 text-green-500 mb-3" />
                 <span className="text-sm font-bold text-white">CSV</span>
                 <span className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Standard Excel</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group">
                 <FileText className="w-8 h-8 text-blue-500 mb-3" />
                 <span className="text-sm font-bold text-white">Excel (.xlsx)</span>
                 <span className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Avec Graphiques</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group">
                 <Code className="w-8 h-8 text-red-500 mb-3" />
                 <span className="text-sm font-bold text-white">PDF Rapport</span>
                 <span className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Formaté & Signé</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group">
                 <FileJson className="w-8 h-8 text-orange-500 mb-3" />
                 <span className="text-sm font-bold text-white">JSON</span>
                 <span className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Pour Développeurs</span>
              </button>
           </div>
        </Card>
      </div>

      <Card className="p-6 bg-zinc-950 border border-zinc-800 border-dashed flex flex-col items-center justify-center py-12 space-y-4">
         <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-zinc-500" />
         </div>
         <div className="text-center">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Planifier un Export Automatique</h4>
            <p className="text-xs text-zinc-500 mt-1">Recevez vos rapports directement par email tous les matins à 06:00.</p>
         </div>
         <Button variant="outline" className="border-zinc-800 text-orange-500 h-10 gap-2 uppercase text-[10px] font-bold tracking-widest">
            Configurer la récurrence <ArrowRight className="w-3 h-3" />
         </Button>
      </Card>

      <div className="space-y-4">
         <h3 className="text-sm font-bold text-white uppercase tracking-widest">Historique des Exports</h3>
         <div className="space-y-2">
            {[
              { name: "rapport_production_mars_2024.pdf", size: "1.2 MB", date: "Aujourd'hui, 09:12" },
              { name: "comptage_brut_ligne_A.csv", size: "854 KB", date: "Hier, 18:45" },
            ].map((exp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <div>
                       <div className="text-xs font-medium text-white">{exp.name}</div>
                       <div className="text-[10px] text-zinc-500">{exp.size} • {exp.date}</div>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-orange-500">Télécharger</Button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
