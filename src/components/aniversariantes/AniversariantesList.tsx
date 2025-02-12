import { useEffect, useState } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Cake, Loader2 } from "lucide-react";

interface Aniversariante {
  id: string;
  nome: string;
  dataNascimento: string;
  foto?: string;
  tipo: "membro" | "visitante";
  ministerios?: string[];
  telefone?: string;
}

export function AniversariantesList() {
  const { getAniversariantesMes } = useFirebase();
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAniversariantes = async () => {
      try {
        const data = await getAniversariantesMes();
        setAniversariantes(data);
      } catch (error) {
        console.error("Erro ao buscar aniversariantes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAniversariantes();
  }, [getAniversariantesMes]);

  const AniversarianteCard = ({
    aniversariante,
  }: {
    aniversariante: Aniversariante;
  }) => {
    const dataNascimento = new Date(
      aniversariante.dataNascimento + "T12:00:00"
    );
    const dia = dataNascimento.getDate();
    const mes = dataNascimento.toLocaleString("pt-BR", { month: "long" });

    return (
      <div className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-4">
          {aniversariante.foto ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <img
                src={aniversariante.foto}
                alt={aniversariante.nome}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users className="h-6 w-6 text-zinc-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              {aniversariante.nome}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {dia} de {mes}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {aniversariante.tipo === "membro" ? "Membro" : "Visitante"}
              </span>
            </div>
            {aniversariante.telefone && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {aniversariante.telefone}
              </p>
            )}
            {aniversariante.ministerios &&
              aniversariante.ministerios.length > 0 && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {aniversariante.ministerios.join(", ")}
                </p>
              )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mt-6">
          Aniversariantes do Mês
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {new Date().toLocaleString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <Card className="border-zinc-200/50 dark:border-zinc-800/50">
        <CardContent className="p-4">
          {aniversariantes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
              <Cake className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">
                Nenhum aniversariante este mês
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {aniversariantes.map((aniversariante) => (
                <AniversarianteCard
                  key={aniversariante.id}
                  aniversariante={aniversariante}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
