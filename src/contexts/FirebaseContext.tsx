import { createContext, useContext, ReactNode } from "react";
import { db, auth, storage } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  DocumentData,
  doc,
  getDoc,
  updateDoc,
  QueryConstraint,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AniversarianteData {
  id: string;
  nome: string;
  dataNascimento: string;
  foto?: string;
  tipo: "membro" | "visitante";
  ministerios?: string[];
}

interface PessoaExistente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  tipo: "membro" | "visitante";
}

interface MembrosFilters {
  ministerio?: string;
  status?: "ativo" | "inativo";
  busca?: string;
}

interface FirebaseContextType {
  // Funções para visitantes
  addVisitante: (data: any) => Promise<string>;
  getVisitantes: () => Promise<DocumentData[]>;
  getVisitantesCount: () => Promise<number>;
  getVisitantesMesCount: () => Promise<number>;
  getVisitantesPorMes: () => Promise<{ mes: string; quantidade: number }[]>;

  // Funções para membros
  addMembro: (data: any) => Promise<string>;
  getMembros: () => Promise<DocumentData[]>;
  getMembrosCount: () => Promise<number>;
  getMembrosAtivosCount: () => Promise<number>;
  getMembrosPorMinisterio: () => Promise<
    { ministerio: string; quantidade: number }[]
  >;
  getMembrosComFiltro: (filtros: MembrosFilters) => Promise<DocumentData[]>;

  // Funções para histórico de visitas
  addVisitaToHistorico: (
    visitanteId: string,
    visita: VisitaData
  ) => Promise<void>;
  getHistoricoVisitas: (visitanteId: string) => Promise<VisitaData[]>;

  // Funções para upload de foto
  uploadFoto: (file: File, membroId: string) => Promise<string>;

  // Funções para presença
  registrarPresenca: (pessoa: any) => Promise<boolean>;
  getPresencasPorMembro: (membroId: string) => Promise<string[]>;

  // Funções para aniversariantes
  getAniversariantesMes: () => Promise<AniversarianteData[]>;

  // Funções para verificação de pessoa existente
  verificarPessoaExistente: (
    nome: string,
    email?: string,
    telefone?: string
  ) => Promise<PessoaExistente[]>;

  // Funções para exclusão e atualização de membro
  deleteMembro: (id: string) => Promise<void>;
  updateMembro: (id: string, data: any) => Promise<void>;
}

interface VisitaData {
  data: string;
  observacoes?: string;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  // Funções para visitantes
  const addVisitante = async (data: any) => {
    const docRef = await addDoc(collection(db, "visitantes"), data);
    return docRef.id;
  };

  const getVisitantes = async () => {
    const querySnapshot = await getDocs(collection(db, "visitantes"));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const getVisitantesCount = async () => {
    const querySnapshot = await getDocs(collection(db, "visitantes"));
    return querySnapshot.size;
  };

  const getVisitantesMesCount = async () => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const q = query(
      collection(db, "visitantes"),
      where("primeiraVisita", ">=", primeiroDiaMes.toISOString().split("T")[0])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  };

  const getVisitantesPorMes = async () => {
    const querySnapshot = await getDocs(collection(db, "visitantes"));
    const visitantes = querySnapshot.docs.map((doc) => doc.data());

    const porMes = visitantes.reduce((acc, visitante) => {
      const data = new Date(visitante.primeiraVisita + "T12:00:00");
      const mes = data.toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });

      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(porMes).map(([mes, quantidade]) => ({
      mes,
      quantidade,
    }));
  };

  // Funções para membros
  const addMembro = async (data: any) => {
    const docRef = await addDoc(collection(db, "membros"), data);
    return docRef.id;
  };

  const getMembros = async () => {
    const querySnapshot = await getDocs(collection(db, "membros"));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const getMembrosCount = async () => {
    const querySnapshot = await getDocs(collection(db, "membros"));
    return querySnapshot.size;
  };

  const getMembrosAtivosCount = async () => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const q = query(
      collection(db, "membros"),
      where("ultimaPresenca", ">=", primeiroDiaMes.toISOString().split("T")[0])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  };

  const getMembrosPorMinisterio = async () => {
    const querySnapshot = await getDocs(collection(db, "membros"));
    const membros = querySnapshot.docs.map((doc) => doc.data());

    // Cria um objeto para contar membros por ministério
    const ministeriosCount: { [key: string]: number } = {};

    membros.forEach((membro) => {
      // Verifica se o membro tem ministérios e se é um array
      if (membro.ministerios && Array.isArray(membro.ministerios)) {
        membro.ministerios.forEach((ministerio: string) => {
          // Normaliza o nome do ministério (trim e capitaliza)
          const ministerioNormalizado = ministerio.trim();
          if (ministerioNormalizado) {
            ministeriosCount[ministerioNormalizado] =
              (ministeriosCount[ministerioNormalizado] || 0) + 1;
          }
        });
      }
    });

    // Converte o objeto em array e ordena por quantidade
    return Object.entries(ministeriosCount)
      .map(([ministerio, quantidade]) => ({
        ministerio,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  };

  const addVisitaToHistorico = async (
    visitanteId: string,
    visita: VisitaData
  ) => {
    const visitanteRef = doc(db, "visitantes", visitanteId);
    const visitanteDoc = await getDoc(visitanteRef);

    if (visitanteDoc.exists()) {
      const historico = visitanteDoc.data().historico || [];
      await updateDoc(visitanteRef, {
        historico: [...historico, visita],
      });
    }
  };

  const getHistoricoVisitas = async (visitanteId: string) => {
    const visitanteRef = doc(db, "visitantes", visitanteId);
    const visitanteDoc = await getDoc(visitanteRef);

    if (visitanteDoc.exists()) {
      return visitanteDoc.data().historico || [];
    }
    return [];
  };

  const uploadFoto = async (file: File, membroId: string) => {
    const storageRef = ref(storage, `membros/${membroId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const membroRef = doc(db, "membros", membroId);
    await updateDoc(membroRef, {
      foto: url,
    });

    return url;
  };

  const registrarPresenca = async (pessoa: any) => {
    try {
      const hoje = new Date().toISOString().split("T")[0];

      // Verifica se é membro ou visitante
      const colecao = pessoa.tipo === "membro" ? "membros" : "visitantes";

      // Referência do documento
      const docRef = doc(db, colecao, pessoa.id);

      // Busca o documento atual
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Pessoa não encontrada");
      }

      const presencas = docSnap.data().presencas || [];

      // Verifica se já registrou hoje
      if (presencas.includes(hoje)) {
        throw new Error("Presença já registrada hoje");
      }

      // Adiciona a nova presença
      await updateDoc(docRef, {
        presencas: arrayUnion(hoje),
      });

      return true;
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      throw error;
    }
  };

  const getPresencasPorMembro = async (membroId: string) => {
    const membroRef = doc(db, "membros", membroId);
    const membroDoc = await getDoc(membroRef);

    if (membroDoc.exists()) {
      return membroDoc.data().presencas || [];
    }
    return [];
  };

  const getAniversariantesMes = async () => {
    const [membrosSnapshot, visitantesSnapshot] = await Promise.all([
      getDocs(collection(db, "membros")),
      getDocs(collection(db, "visitantes")),
    ]);

    const membros = membrosSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      tipo: "membro" as const,
    }));

    const visitantes = visitantesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      tipo: "visitante" as const,
    }));

    const mesAtual = new Date().getMonth() + 1;

    const aniversariantes = [...membros, ...visitantes]
      .filter((pessoa) => {
        if (!pessoa.dataNascimento) return false;
        const mesNascimento =
          new Date(pessoa.dataNascimento + "T12:00:00").getMonth() + 1;
        return mesNascimento === mesAtual;
      })
      .sort((a, b) => {
        const diaA = new Date(a.dataNascimento + "T12:00:00").getDate();
        const diaB = new Date(b.dataNascimento + "T12:00:00").getDate();
        return diaA - diaB;
      });

    return aniversariantes;
  };

  const verificarPessoaExistente = async (
    nome: string,
    email?: string,
    telefone?: string
  ) => {
    const pessoasEncontradas: PessoaExistente[] = [];
    const nomeNormalizado = nome.toLowerCase().trim();

    // Busca em membros
    const membrosSnapshot = await getDocs(collection(db, "membros"));
    membrosSnapshot.docs.forEach((doc) => {
      const membro = doc.data();
      const membroNome = membro.nome.toLowerCase().trim();

      if (
        membroNome === nomeNormalizado ||
        (email && membro.email === email) ||
        (telefone && membro.telefone === telefone) ||
        membroNome.includes(nomeNormalizado) ||
        nomeNormalizado.includes(membroNome)
      ) {
        pessoasEncontradas.push({
          id: doc.id,
          nome: membro.nome,
          email: membro.email,
          telefone: membro.telefone,
          tipo: "membro",
        });
      }
    });

    // Busca em visitantes
    const visitantesSnapshot = await getDocs(collection(db, "visitantes"));
    visitantesSnapshot.docs.forEach((doc) => {
      const visitante = doc.data();
      const visitanteNome = visitante.nome.toLowerCase().trim();

      if (
        visitanteNome === nomeNormalizado ||
        (email && visitante.email === email) ||
        (telefone && visitante.telefone === telefone) ||
        visitanteNome.includes(nomeNormalizado) ||
        nomeNormalizado.includes(visitanteNome)
      ) {
        pessoasEncontradas.push({
          id: doc.id,
          nome: visitante.nome,
          email: visitante.email,
          telefone: visitante.telefone,
          tipo: "visitante",
        });
      }
    });

    return pessoasEncontradas;
  };

  const getMembrosComFiltro = async (filtros: MembrosFilters) => {
    try {
      let membrosRef = collection(db, "membros");
      let queryConstraints: QueryConstraint[] = [];

      // Filtro por ministério
      if (filtros.ministerio) {
        queryConstraints.push(
          where("ministerios", "array-contains", filtros.ministerio)
        );
      }

      // Filtro por status (baseado na última presença)
      if (filtros.status) {
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        const dataLimite = umMesAtras.toISOString().split("T")[0];

        if (filtros.status === "ativo") {
          queryConstraints.push(where("ultimaPresenca", ">=", dataLimite));
        } else {
          queryConstraints.push(where("ultimaPresenca", "<", dataLimite));
        }
      }

      const q = query(membrosRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      let membros = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtro por busca (nome)
      if (filtros.busca) {
        const termoBusca = filtros.busca.toLowerCase();
        membros = membros.filter((membro) =>
          membro.nome.toLowerCase().includes(termoBusca)
        );
      }

      return membros;
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      return [];
    }
  };

  const deleteMembro = async (id: string) => {
    try {
      await deleteDoc(doc(db, "membros", id));
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
      throw error;
    }
  };

  const updateMembro = async (id: string, data: any) => {
    try {
      const membroRef = doc(db, "membros", id);
      await updateDoc(membroRef, data);
    } catch (error) {
      console.error("Erro ao atualizar membro:", error);
      throw error;
    }
  };

  const value = {
    addVisitante,
    getVisitantes,
    addMembro,
    getMembros,
    getVisitantesCount,
    getVisitantesMesCount,
    getMembrosCount,
    getMembrosAtivosCount,
    addVisitaToHistorico,
    getHistoricoVisitas,
    uploadFoto,
    getVisitantesPorMes,
    getMembrosPorMinisterio,
    registrarPresenca,
    getPresencasPorMembro,
    getAniversariantesMes,
    verificarPessoaExistente,
    getMembrosComFiltro,
    deleteMembro,
    updateMembro,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
