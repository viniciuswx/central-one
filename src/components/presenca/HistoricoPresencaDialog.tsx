import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";

interface HistoricoPresencaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: {
    nome: string;
    presencas: string[];
  };
}

export function HistoricoPresencaDialog({
  open,
  onOpenChange,
  membro,
}: HistoricoPresencaDialogProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-500">
            <Calendar className="h-5 w-5" />
            <DialogTitle>Histórico de Presenças - {membro.nome}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {membro.presencas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-8 w-8 mb-2" />
              <p>Nenhuma presença registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {membro.presencas.map((data, index) => (
                <div
                  key={index}
                  className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {formatDate(data)}
                    </span>
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
