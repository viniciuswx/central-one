import { useEffect, useState } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { DocumentData } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  Users,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MINISTERIOS } from "@/config/ministerios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast } from "@/components/ui/custom-toast";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MembroForm from "@/components/forms/MembroForm";

export default function MembrosList() {
  const { getMembrosComFiltro, deleteMembro } = useFirebase();
  const [membros, setMembros] = useState<DocumentData[]>([]);
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
  const [filtros, setFiltros] = useState({
    ministerio: "todos",
    status: "todos",
    busca: "",
  });
  const [membroToDelete, setMembroToDelete] = useState<string | null>(null);
  const [membroToEdit, setMembroToEdit] = useState<DocumentData | null>(null);

  const fetchMembros = async () => {
    setLoading(true);
    try {
      const data = await getMembrosComFiltro({
        ministerio:
          filtros.ministerio === "todos" ? undefined : filtros.ministerio,
        status:
          filtros.status === "todos"
            ? undefined
            : (filtros.status as "ativo" | "inativo" | undefined),
        busca: filtros.busca || undefined,
      });
      setMembros(data);
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      alert("Erro ao carregar a lista de membros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembros();
  }, [getMembrosComFiltro, filtros]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informada";
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const filteredMembros = membros.filter((membro) =>
    membro.nome.toLowerCase().includes(searchTerm.toLowerCase())
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

  const sortedMembros = [...filteredMembros].sort((a, b) => {
    if (sort.direction === null) return 0;

    let comparison = 0;
    switch (sort.field) {
      case "nome":
      case "telefone":
        comparison = (a[sort.field] || "").localeCompare(b[sort.field] || "");
        break;
      case "dataMembresia":
        if (!a.dataMembresia && !b.dataMembresia) return 0;
        if (!a.dataMembresia) return 1;
        if (!b.dataMembresia) return -1;
        comparison =
          new Date(a.dataMembresia + "T12:00:00").getTime() -
          new Date(b.dataMembresia + "T12:00:00").getTime();
        break;
      case "ministerios":
        const aMin = (a.ministerios || []).join(", ");
        const bMin = (b.ministerios || []).join(", ");
        comparison = aMin.localeCompare(bMin);
        break;
      default:
        comparison = 0;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });

  const paginatedMembros = sortedMembros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMembros.length / itemsPerPage);

  const exportToCSV = () => {
    try {
      const headers = ["Nome", "Telefone", "Data de Membresia", "Ministérios"];
      const data = filteredMembros.map((membro) => [
        membro.nome,
        membro.telefone || "",
        membro.dataMembresia ? formatDate(membro.dataMembresia) : "",
        membro.ministerios?.join(", ") || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...data.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `membros_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({
        title: "Lista exportada com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      showToast({
        title: "Erro ao exportar lista",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!membroToDelete) return;

    try {
      await deleteMembro(membroToDelete);
      showToast({
        title: "Membro excluído com sucesso!",
        type: "success",
      });
      // Recarrega a lista
      fetchMembros();
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
      showToast({
        title: "Erro ao excluir membro",
        type: "error",
      });
    } finally {
      setMembroToDelete(null);
    }
  };

  const MobileCard = ({ membro }: { membro: DocumentData }) => (
    <div className="p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {membro.foto ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <img
                src={membro.foto}
                alt={membro.nome}
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
              {membro.nome}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {membro.ministerios?.join(", ") || "Sem ministérios"}
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
              onClick={() => setMembroToEdit(membro)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setMembroToDelete(membro.id)}
              className="gap-2 text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500 dark:text-zinc-400">Telefone</p>
          <p className="text-zinc-900 dark:text-zinc-100">
            {membro.telefone || "-"}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400">Data de Membresia</p>
          <p className="text-zinc-900 dark:text-zinc-100">
            {membro.dataMembresia
              ? formatDate(membro.dataMembresia)
              : "Não informada"}
          </p>
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
      {/* Header e Filtros */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            Lista de Membros
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Gerencie todos os membros registrados
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full md:w-auto gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Lista
          </Button>

          <div className="grid gap-4 md:flex md:items-center md:gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="Buscar membro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-64 border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:flex md:items-center">
              <Select
                value={filtros.ministerio}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, ministerio: value }))
                }
              >
                <SelectTrigger className="border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectValue placeholder="Filtrar por ministério" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os ministérios</SelectItem>
                  {MINISTERIOS.map((ministerio) => (
                    <SelectItem key={ministerio.value} value={ministerio.label}>
                      {ministerio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtros.status}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl">
        <CardContent className="p-0">
          {filteredMembros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
              <Users className="h-12 w-12 mb-4 text-zinc-400 dark:text-zinc-500" />
              {searchTerm ? (
                <>
                  <p className="text-lg font-medium">
                    Nenhum membro encontrado
                  </p>
                  <p className="text-sm">Tente uma busca diferente</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    Nenhum membro cadastrado
                  </p>
                  <p className="text-sm">Cadastre seu primeiro membro</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Versão Desktop */}
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
                        label="Data de Membresia"
                        field="dataMembresia"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <SortableHeader
                        label="Ministérios"
                        field="ministerios"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembros.map((membro) => (
                      <TableRow
                        key={membro.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {membro.foto ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                <img
                                  src={membro.foto}
                                  alt={membro.nome}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Users className="h-5 w-5 text-zinc-400" />
                              </div>
                            )}
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {membro.nome}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {membro.telefone}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {membro.dataMembresia
                            ? formatDate(membro.dataMembresia)
                            : "Não informada"}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {membro.ministerios?.length > 0
                            ? membro.ministerios.join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setMembroToEdit(membro)}
                                className="gap-2"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setMembroToDelete(membro.id)}
                                className="gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Versão Mobile */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedMembros.map((membro) => (
                  <MobileCard key={membro.id} membro={membro} />
                ))}
              </div>

              <div className="py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredMembros.length}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={!!membroToDelete}
        onOpenChange={(open) => !open && setMembroToDelete(null)}
        onConfirm={handleDelete}
      />

      <Dialog
        open={!!membroToEdit}
        onOpenChange={(open) => !open && setMembroToEdit(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {membroToEdit && (
            <MembroForm
              initialData={membroToEdit}
              onSuccess={() => {
                setMembroToEdit(null);
                // Recarrega a lista
                fetchMembros();
              }}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
