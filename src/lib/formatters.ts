export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
}

export function formatEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function formatPhone(phone: string): string {
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, "");

  // Aplica a máscara
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(
      3,
      7
    )}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
      6
    )}`;
  }

  return numbers;
}

// Função para limpar a formatação do telefone (usar ao enviar para o banco)
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCEP(
  cep: string
): Promise<EnderecoViaCEP | null> {
  const cleanCEP = cep.replace(/\D/g, "");

  if (cleanCEP.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) return null;

    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}

export function formatCEP(cep: string): string {
  const numbers = cep.replace(/\D/g, "");
  if (numbers.length === 8) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  return numbers;
}

export function getCurrentDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0]; // Retorna no formato YYYY-MM-DD
}
