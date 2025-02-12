import { useEffect, useState } from "react";
import { useFirebase } from "../../contexts/FirebaseContext";
import { DocumentData } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Users, History, MoreHorizontal } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { VisitHistoryDialog } from "@/components/ui/visit-history-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function VisitantesList() {
  const { getVisitantes } = useFirebase();
  const [visitantes, setVisitantes] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sort, setSort] = useState<{
    field: string;
    direction: "asc" | "desc" | null;
  }>({
    field: "nome",
    direction: "asc",
  });
  const [selectedVisitante, setSelectedVisitante] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchVisitantes = async () => {
      try {
        const data = await getVisitantes();
        setVisitantes(data);
      } catch (error) {
        console.error("Erro ao buscar visitantes:", error);
        alert("Erro ao carregar a lista de visitantes.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisitantes();
  }, [getVisitantes]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const filteredVisitantes = visitantes.filter((visitante) =>
    visitante.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field
          ? prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
            ? null
            : "asc"
          : "asc",
    }));
  };

  const sortedVisitantes = [...filteredVisitantes].sort((a, b) => {
    if (sort.direction === null) return 0;

    let comparison = 0;
    switch (sort.field) {
      case "nome":
      case "email":
      case "telefone":
        comparison = (a[sort.field] || "").localeCompare(b[sort.field] || "");
        break;
      case "primeiraVisita":
        comparison =
          new Date(a.primeiraVisita).getTime() -
          new Date(b.primeiraVisita).getTime();
        break;
      case "comoSoube":
        comparison = (a.comoSoube || "").localeCompare(b.comoSoube || "");
        break;
      default:
        comparison = 0;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });

  const paginatedVisitantes = sortedVisitantes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredVisitantes.length / itemsPerPage);

  const getComoSoubeBadge = (comoSoube: string) => {
    const variants: { [key: string]: string } = {
      amigos:
        "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300",
      redes_sociais:
        "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300",
      passou_em_frente:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300",
      indicacao:
        "bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300",
      outro: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300",
    };

    const labels: { [key: string]: string } = {
      amigos: "Amigos/Família",
      redes_sociais: "Redes Sociais",
      passou_em_frente: "Passou em frente",
      indicacao: "Indicação",
      outro: "Outro",
    };

    return (
      <Badge
        variant="secondary"
        className={variants[comoSoube] || variants.outro}
      >
        {labels[comoSoube] || comoSoube}
      </Badge>
    );
  };

  const handleVisitaAdded = async () => {
    const data = await getVisitantes();
    setVisitantes(data);
  };

  const handleVerHistorico = (visitante: any) => {
    setSelectedVisitante({
      id: visitante.id,
      nome: visitante.nome,
      visitas: [
        {
          data: visitante.primeiraVisita,
          observacoes: visitante.observacoes,
        },
        ...(visitante.historico || []),
      ],
    });
    setShowHistory(true);
  };

  const MobileCard = ({ visitante }: { visitante: DocumentData }) => (
    <div className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {visitante.foto ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <img
                src={visitante.foto}
                alt={visitante.nome}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-zinc-400" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              {visitante.nome}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatDate(visitante.dataVisita)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleVerHistorico(visitante)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500 dark:text-zinc-400">Telefone</p>
          <p className="text-zinc-900 dark:text-zinc-100">
            {visitante.telefone || "-"}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400">Email</p>
          <p className="text-zinc-900 dark:text-zinc-100">
            {visitante.email || "-"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-zinc-500 dark:text-zinc-400">Como Conheceu</p>
          <div className="mt-1">
            {visitante.comoSoube ? getComoSoubeBadge(visitante.comoSoube) : "-"}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mt-6">
            Lista de Visitantes
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Gerencie todos os visitantes registrados
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Buscar visitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full border-zinc-200/50 dark:border-zinc-800/50"
          />
        </div>
      </div>

      <Card className="border-zinc-200/50 dark:border-zinc-800/50">
        <CardContent className="p-0">
          {filteredVisitantes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
              <Users className="h-12 w-12 mb-4 text-zinc-400 dark:text-zinc-500" />
              {searchTerm ? (
                <>
                  <p className="text-lg font-medium">
                    Nenhum visitante encontrado
                  </p>
                  <p className="text-sm">Tente uma busca diferente</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    Nenhum visitante cadastrado
                  </p>
                  <p className="text-sm">Cadastre seu primeiro visitante</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent group">
                      <SortableHeader
                        label="Nome"
                        field="nome"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <SortableHeader
                        label="Telefone"
                        field="telefone"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <SortableHeader
                        label="Email"
                        field="email"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <SortableHeader
                        label="Primeira Visita"
                        field="primeiraVisita"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <SortableHeader
                        label="Como Soube"
                        field="comoSoube"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <TableHead className="text-zinc-500 dark:text-zinc-400 w-[100px]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVisitantes.map((visitante) => (
                      <TableRow
                        key={visitante.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                      >
                        <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                          {visitante.nome}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {visitante.telefone}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {visitante.email || "-"}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {formatDate(visitante.primeiraVisita)}
                        </TableCell>
                        <TableCell>
                          {visitante.comoSoube
                            ? getComoSoubeBadge(visitante.comoSoube)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedVisitante({
                                id: visitante.id,
                                nome: visitante.nome,
                                visitas: [
                                  {
                                    data: visitante.primeiraVisita,
                                    observacoes: visitante.observacoes,
                                  },
                                  ...(visitante.historico || []),
                                ],
                              });
                              setShowHistory(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4 p-4">
                {paginatedVisitantes.map((visitante) => (
                  <MobileCard key={visitante.id} visitante={visitante} />
                ))}
              </div>
            </>
          )}
        </CardContent>

        {filteredVisitantes.length > 0 && (
          <div className="mt-0 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredVisitantes.length}
            />
          </div>
        )}
      </Card>

      {selectedVisitante && (
        <VisitHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          visitante={selectedVisitante}
          onVisitaAdded={handleVisitaAdded}
        />
      )}
    </div>
  );
}
