import { useState, useRef } from "react";
import { useFirebase } from "../../contexts/FirebaseContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Loader2, ImagePlus, X, Users } from "lucide-react";
import {
  formatName,
  formatEmail,
  formatPhone,
  cleanPhone,
  fetchAddressByCEP,
  formatCEP,
} from "@/lib/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { showToast } from "@/components/ui/custom-toast";
import { DuplicataDialog } from "@/components/ui/duplicata-dialog";
import { MINISTERIOS } from "@/config/ministerios";
import { DocumentData } from "firebase/firestore";
import { PessoaExistente } from "@/types";

interface MembroData {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  dataMembresia: string;
  naoLembraDataMembresia: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ministerios: string[];
  observacoes: string;
  foto?: string;
}

interface MembroFormProps {
  initialData?: DocumentData;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export default function MembroForm({
  initialData,
  onSuccess,
  mode = "create",
}: MembroFormProps) {
  const { addMembro, uploadFoto, verificarPessoaExistente, updateMembro } =
    useFirebase();
  const [loading, setLoading] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [enderecoManual, setEnderecoManual] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDuplicataDialog, setShowDuplicataDialog] = useState(false);
  const [pessoasEncontradas, setPessoasEncontradas] = useState<
    PessoaExistente[]
  >([]);

  const initialDataForm: MembroData = {
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    dataMembresia: "",
    naoLembraDataMembresia: false,
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    ministerios: [] as string[],
    observacoes: "",
  };

  const [formData, setFormData] = useState<MembroData>(
    (initialData as MembroData) || initialDataForm
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verifica duplicatas apenas no modo create
      if (mode === "create") {
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
      }

      // Prepara os dados para submissão
      const endereco = {
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
      };

      const dataToSubmit = {
        ...formData,
        telefone: cleanPhone(formData.telefone),
        endereco,
        dataMembresia: formData.naoLembraDataMembresia
          ? null
          : formData.dataMembresia,
        ministerios: formData.ministerios,
      };

      setLoading(true);

      if (mode === "edit" && initialData) {
        await updateMembro(initialData.id, dataToSubmit);

        if (foto) {
          await uploadFoto(foto, initialData.id);
        }

        showToast({
          title: "Membro atualizado com sucesso!",
          type: "success",
        });
      } else {
        const membroId = await addMembro(dataToSubmit);

        if (foto) {
          await uploadFoto(foto, membroId);
        }

        showToast({
          title: "Membro cadastrado com sucesso!",
          type: "success",
        });
      }

      onSuccess?.();
      if (mode === "create") {
        setFormData(initialDataForm);
        setFoto(null);
        setFotoPreview(null);
      }
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
      showToast({
        title: `Erro ao ${mode === "edit" ? "atualizar" : "cadastrar"} membro`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = formatCEP(e.target.value);
    setFormData((prev) => ({ ...prev, cep }));

    if (cep.length === 9) {
      setLoadingCEP(true);
      const endereco = await fetchAddressByCEP(cep);
      setLoadingCEP(false);

      if (endereco) {
        setFormData((prev) => ({
          ...prev,
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.localidade,
          uf: endereco.uf,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          logradouro: "",
          bairro: "",
          cidade: "",
          uf: "",
        }));
        alert(
          "CEP não encontrado. Por favor, preencha o endereço manualmente."
        );
        setEnderecoManual(true);
      }
    }
  };

  const handleClear = () => {
    if (loading) return;

    const confirmClear = window.confirm(
      "Tem certeza que deseja limpar o formulário?"
    );
    if (confirmClear) {
      setFormData(initialDataForm);
      setEnderecoManual(false);
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

  const MinisteriosSelect = () => {
    return (
      <div className="space-y-2">
        <Label
          htmlFor="ministerios"
          className="text-zinc-600 dark:text-zinc-400"
        >
          Ministérios
        </Label>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {MINISTERIOS.map((ministerio) => (
            <div
              key={ministerio.value}
              className="flex items-center space-x-2 border border-zinc-200/50 dark:border-zinc-800/50 p-3 rounded-lg"
            >
              <Checkbox
                id={ministerio.value}
                checked={formData.ministerios?.includes(ministerio.label)}
                onCheckedChange={(checked) => {
                  setFormData((prev) => {
                    const currentMinisterios = prev.ministerios || [];
                    return {
                      ...prev,
                      ministerios: checked
                        ? [...currentMinisterios, ministerio.label]
                        : currentMinisterios.filter(
                            (m) => m !== ministerio.label
                          ),
                    };
                  });
                }}
              />
              <label
                htmlFor={ministerio.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {ministerio.label}
              </label>
            </div>
          ))}
        </div>
        {formData.ministerios && formData.ministerios.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Selecionados: {formData.ministerios.join(", ")}
            </p>
          </div>
        )}
      </div>
    );
  };

  const handleConfirmSubmit = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleDuplicataConfirm = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          {mode === "edit" ? "Editar Membro" : "Cadastrar Membro"}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {mode === "edit"
            ? "Atualize as informações do membro"
            : "Preencha as informações para cadastrar um novo membro"}
        </p>
      </div>

      <Card className="border-zinc-200/50 dark:border-zinc-800/50">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
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
                  Foto do membro (opcional)
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

            <div className="space-y-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Membresia
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="dataMembresia"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Data de Membresia
                  </Label>
                  <Input
                    required
                    type="date"
                    id="dataMembresia"
                    name="dataMembresia"
                    value={formData.dataMembresia}
                    onChange={handleChange}
                    disabled={formData.naoLembraDataMembresia}
                    className="border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="naoLembraDataMembresia"
                    checked={formData.naoLembraDataMembresia}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        naoLembraDataMembresia: checked as boolean,
                        dataMembresia: checked ? "" : prev.dataMembresia,
                      }))
                    }
                  />
                  <label
                    htmlFor="naoLembraDataMembresia"
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    Não lembra a data
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-600 dark:text-zinc-400">
                  Endereço
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enderecoManual"
                    checked={enderecoManual}
                    onCheckedChange={(checked) =>
                      setEnderecoManual(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="enderecoManual"
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    Preencher manualmente
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="cep"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCEPChange}
                      disabled={enderecoManual}
                      className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                    />
                    {loadingCEP && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="logradouro"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Logradouro
                  </Label>
                  <Input
                    id="logradouro"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    disabled={!enderecoManual && !formData.cep}
                    className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="numero"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Número
                  </Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="complemento"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Complemento
                  </Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="bairro"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Bairro
                  </Label>
                  <Input
                    id="bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cidade"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="uf"
                    className="text-zinc-600 dark:text-zinc-400"
                  >
                    UF
                  </Label>
                  <Input
                    id="uf"
                    name="uf"
                    value={formData.uf}
                    onChange={handleChange}
                    className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50"
                  />
                </div>
              </div>
            </div>

            <MinisteriosSelect />

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
                className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 resize-none"
              />
            </div>

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
                    {mode === "edit" ? "Atualizando..." : "Cadastrando..."}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {mode === "edit" ? "Atualizar Membro" : "Cadastrar Membro"}
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
        title="Confirmar cadastro"
        description="Tem certeza que deseja cadastrar este membro?"
        onConfirm={handleConfirmSubmit}
      />

      <DuplicataDialog
        open={showDuplicataDialog}
        onOpenChange={setShowDuplicataDialog}
        pessoasEncontradas={pessoasEncontradas}
        onConfirm={handleDuplicataConfirm}
      />
    </div>
  );
}
