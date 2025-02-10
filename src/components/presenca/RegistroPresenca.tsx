import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Check, Loader2, UserCheck } from "lucide-react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { showToast } from "@/components/ui/custom-toast";
import { HistoricoPresencaDialog } from "./HistoricoPresencaDialog";
import { DocumentData } from "firebase/firestore";

export function RegistroPresenca() {
  const { getMembros, registrarPresenca, getPresencasPorMembro, buscarPessoa } =
    useFirebase();
  const [membros, setMembros] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [registrando, setRegistrando] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [presencas, setPresencas] = useState<{ [key: string]: string[] }>({});
  const [showHistorico, setShowHistorico] = useState(false);
  const [selectedMembro, setSelectedMembro] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pessoasEncontradas, setPessoasEncontradas] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembros = async () => {
      try {
        const data = await getMembros();
        setMembros(data);

        // Busca as presenças de cada membro
        const presencasObj: { [key: string]: string[] } = {};
        for (const membro of data) {
          const presencasMembro = await getPresencasPorMembro(membro.id);
          presencasObj[membro.id] = presencasMembro;
        }
        setPresencas(presencasObj);
      } catch (error) {
        console.error("Erro ao buscar membros:", error);
        showToast({
          title: "Erro ao carregar membros",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembros();
  }, [getMembros, getPresencasPorMembro]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    try {
      const results = await buscarPessoa(searchTerm);
      setPessoasEncontradas(results);
    } catch (error) {
      console.error("Erro ao buscar pessoa:", error);
      showToast({
        title: "Erro ao buscar pessoa",
        type: "error",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRegistrarPresenca = async (pessoa: any) => {
    if (registrando[pessoa.id]) return;

    setRegistrando((prev) => ({ ...prev, [pessoa.id]: true }));
    try {
      // Garante que a pessoa tenha o tipo definido
      const pessoaComTipo = {
        ...pessoa,
        tipo: pessoa.tipo || "membro", // Se não tiver tipo, assume que é membro
      };

      await registrarPresenca(pessoaComTipo);

      // Se for um membro, atualiza as presenças
      if (pessoaComTipo.tipo === "membro") {
        const presencasMembro = await getPresencasPorMembro(pessoa.id);
        setPresencas((prev) => ({
          ...prev,
          [pessoa.id]: presencasMembro,
        }));
      }

      showToast({
        title: `Presença registrada: ${pessoa.nome}`,
        type: "success",
      });

      // Limpa a busca após registrar
      setPessoasEncontradas([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      showToast({
        title: "Erro ao registrar presença",
        type: "error",
      });
    } finally {
      setRegistrando((prev) => ({ ...prev, [pessoa.id]: false }));
    }
  };

  const handleVerHistorico = async (membro: any) => {
    try {
      const presencas = await getPresencasPorMembro(membro.id);
      setSelectedMembro({
        ...membro,
        presencas,
      });
      setShowHistorico(true);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      showToast({
        title: "Erro ao carregar histórico",
        type: "error",
      });
    }
  };

  const filteredMembros = membros.filter((membro) =>
    membro.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MembroCard = ({ membro }: { membro: DocumentData }) => {
    const ultimaPresenca = presencas[membro.id]?.[0];
    const hoje = new Date().toISOString().split("T")[0];
    const jaRegistrouHoje = ultimaPresenca === hoje;

    return (
      <div className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                {membro.nome}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerHistorico(membro)}
              className="w-full sm:w-auto"
            >
              Ver Histórico
            </Button>
            <Button
              onClick={() => handleRegistrarPresenca(membro)}
              disabled={jaRegistrouHoje || registrando[membro.id]}
              className="w-full sm:w-auto"
            >
              {registrando[membro.id] ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : jaRegistrouHoje ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Presente Hoje
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Registrar Presença
                </>
              )}
            </Button>
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
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Registro de Presença
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Registre a presença de membros e visitantes
        </p>
      </div>

      {/* Busca Geral */}
      <Card className="border-zinc-200/50 dark:border-zinc-800/50">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
              Busca Geral
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-8 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={searchLoading || !searchTerm.trim()}
                  className="w-full sm:w-auto"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>

              {/* Resultados da Busca */}
              {pessoasEncontradas.length > 0 && (
                <div className="space-y-4">
                  {pessoasEncontradas.map((pessoa) => (
                    <div
                      key={pessoa.id}
                      className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Users className="h-5 w-5 text-zinc-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                              {pessoa.nome}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                              {pessoa.tipo}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRegistrarPresenca(pessoa)}
                          disabled={registrando[pessoa.id]}
                          className="w-full sm:w-auto"
                        >
                          {registrando[pessoa.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registrando...
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Registrar Presença
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Membros */}
      <Card className="border-zinc-200/50 dark:border-zinc-800/50">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
              Membros
            </h2>
            <div className="space-y-4">
              {filteredMembros.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-zinc-500 dark:text-zinc-400">
                  <Users className="h-8 w-8 mb-2" />
                  <p>Nenhum membro encontrado</p>
                </div>
              ) : (
                filteredMembros.map((membro) => (
                  <MembroCard key={membro.id} membro={membro} />
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedMembro && (
        <HistoricoPresencaDialog
          open={showHistorico}
          onOpenChange={setShowHistorico}
          membro={selectedMembro}
        />
      )}
    </div>
  );
}
