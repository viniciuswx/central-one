import { useState, useRef } from "react";
import { useFirebase } from "../../contexts/FirebaseContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Loader2, X, ImagePlus, Users } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  formatName,
  formatEmail,
  formatPhone,
  cleanPhone,
  getCurrentDate,
} from "@/lib/formatters";
import { showToast } from "@/components/ui/custom-toast";
import { DuplicataDialog } from "@/components/ui/duplicata-dialog";
import { PessoaExistente } from "@/types";

interface VisitanteData {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  primeiraVisita: string;
  comoSoube: string;
  observacoes: string;
}

export default function VisitanteForm() {
  const { addVisitante, verificarPessoaExistente } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<any>(null);
  const [showDuplicataDialog, setShowDuplicataDialog] = useState(false);
  const [pessoasEncontradas, setPessoasEncontradas] = useState<
    PessoaExistente[]
  >([]);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialData: VisitanteData = {
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    primeiraVisita: getCurrentDate(),
    comoSoube: "",
    observacoes: "",
  };

  const [formData, setFormData] = useState<VisitanteData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const duplicatas = await verificarPessoaExistente(
        formData.nome,
        formData.email,
        formData.telefone
      );

      if (duplicatas.length > 0) {
        setPessoasEncontradas(duplicatas);
        setShowDuplicataDialog(true);
        return;
      }

      const dataToSubmit = {
        ...formData,
        telefone: cleanPhone(formData.telefone),
        primeiraVisita: new Date().toISOString().split("T")[0],
        historico: [
          {
            data: new Date().toISOString().split("T")[0],
            observacoes: formData.observacoes,
          },
        ],
        foto: foto,
      };

      setFormDataToSubmit(dataToSubmit);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Erro ao verificar duplicatas:", error);
      showToast({
        title: "Erro ao verificar duplicatas",
        type: "error",
      });
    }
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    try {
      await addVisitante(formDataToSubmit);
      setFormData(initialData);
      setShowConfirmation(false);
      showToast({
        title: "Visitante cadastrado com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao cadastrar visitante:", error);
      showToast({
        title: "Erro ao cadastrar visitante. Tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let formattedValue = value;

    switch (name) {
      case "nome":
        formattedValue = formatName(value);
        break;
      case "email":
        formattedValue = formatEmail(value);
        break;
      case "telefone":
        formattedValue = formatPhone(value);
        break;
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleClear = () => {
    if (loading) return;

    const confirmClear = window.confirm(
      "Tem certeza que deseja limpar o formulário?"
    );
    if (confirmClear) {
      setFormData(initialData);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Cadastrar Visitante
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Preencha as informações do novo visitante
        </p>
      </div>

      <Card className="border-zinc-200/50 dark:border-zinc-800/50">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Foto */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                {fotoPreview ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Users className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  {fotoPreview ? "Trocar Foto" : "Adicionar Foto"}
                </Button>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Foto do visitante (opcional)
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Informações Pessoais
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="nome"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Nome Completo
                  </Label>
                  <Input
                    required
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="telefone"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Telefone
                  </Label>
                  <Input
                    required
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="dataNascimento"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Data de Nascimento
                  </Label>
                  <Input
                    required
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
              </div>
            </div>

            {/* Como Soube */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Como Conheceu a Igreja
              </h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="comoSoube"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Como Soube
                  </Label>
                  <Select
                    required
                    value={formData.comoSoube}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, comoSoube: value }))
                    }
                  >
                    <SelectTrigger className="border-zinc-200/50 dark:border-zinc-800/50">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amigos">Amigos/Família</SelectItem>
                      <SelectItem value="redes_sociais">
                        Redes Sociais
                      </SelectItem>
                      <SelectItem value="passou_em_frente">
                        Passou em frente
                      </SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label
                htmlFor="observacoes"
                className="text-zinc-600 dark:text-zinc-400"
              >
                Observações
              </Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                className="border-zinc-200/50 dark:border-zinc-800/50 resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Limpar Formulário
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Visitante
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Confirmar Cadastro"
        description="Tem certeza que deseja cadastrar este visitante?"
        onConfirm={handleConfirmSubmit}
      />

      <DuplicataDialog
        open={showDuplicataDialog}
        onOpenChange={setShowDuplicataDialog}
        pessoasEncontradas={pessoasEncontradas}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
