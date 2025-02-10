export interface PessoaExistente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  tipo: "membro" | "visitante";
}

export interface AniversarianteData {
  id: string;
  nome: string;
  dataNascimento: string;
  foto?: string;
  tipo: "membro" | "visitante";
  ministerios?: string[];
}
