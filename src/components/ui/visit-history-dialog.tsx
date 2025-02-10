import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { showToast } from "@/components/ui/custom-toast";
import { Label } from "@/components/ui/label";

interface VisitHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitante: {
    id: string;
    nome: string;
    visitas: Array<{
      data: string;
      observacoes: string;
    }>;
  };
  onVisitaAdded?: () => void;
}

export function VisitHistoryDialog({
  open,
  onOpenChange,
  visitante,
  onVisitaAdded,
}: VisitHistoryDialogProps) {
  const { addVisita } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const handleAddVisita = async () => {
    setLoading(true);
    try {
      await addVisita(visitante.id, {
        data: new Date().toISOString().split("T")[0],
        observacoes,
      });
      showToast({
        title: "Visita registrada com sucesso!",
        type: "success",
      });
      setObservacoes("");
      setShowForm(false);
      onVisitaAdded?.();
    } catch (error) {
      console.error("Erro ao registrar visita:", error);
      showToast({
        title: "Erro ao registrar visita",
        description: "Tente novamente mais tarde",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500">
              <Calendar className="h-5 w-5" />
              <DialogTitle>Histórico de Visitas - {visitante.nome}</DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Visita
            </Button>
          </div>
        </DialogHeader>

        {showForm && (
          <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg p-4 mb-4">
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-600 dark:text-zinc-400">
                  Data da Visita
                </Label>
                <Input
                  type="text"
                  value={formatDate(new Date().toISOString().split("T")[0])}
                  disabled
                  className="border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
              <div>
                <Label className="text-zinc-600 dark:text-zinc-400">
                  Observações
                </Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="border-zinc-200/50 dark:border-zinc-800/50 resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddVisita}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Visita"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {visitante.visitas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-8 w-8 mb-2" />
              <p>Nenhuma visita registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visitante.visitas
                .filter(
                  (visita, index, self) =>
                    // Remove duplicatas baseado na data
                    index === self.findIndex((v) => v.data === visita.data)
                )
                .sort(
                  (a, b) =>
                    new Date(b.data).getTime() - new Date(a.data).getTime()
                )
                .map((visita, index) => (
                  <div
                    key={index}
                    className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {formatDate(visita.data)}
                          </span>
                        </div>
                        {index === visitante.visitas.length - 1 && (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            Primeira Visita
                          </span>
                        )}
                      </div>
                      {visita.observacoes && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-7">
                          {visita.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
