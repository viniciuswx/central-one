import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface PessoaExistente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  tipo: "membro" | "visitante";
}

interface DuplicataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoasEncontradas: PessoaExistente[];
  onConfirm: () => void;
}

export function DuplicataDialog({
  open,
  onOpenChange,
  pessoasEncontradas,
  onConfirm,
}: DuplicataDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Pessoas Similares Encontradas</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Encontramos algumas pessoas com dados similares. Verifique se a
            pessoa que você está tentando cadastrar já existe no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pessoasEncontradas.map((pessoa) => (
            <div
              key={pessoa.id}
              className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg p-4"
            >
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {pessoa.nome}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize">
                    {pessoa.tipo}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {pessoa.email && (
                    <div>
                      <span className="font-medium">Email:</span> {pessoa.email}
                    </div>
                  )}
                  {pessoa.telefone && (
                    <div>
                      <span className="font-medium">Telefone:</span>{" "}
                      {pessoa.telefone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Voltar e Revisar
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            Cadastrar Mesmo Assim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
