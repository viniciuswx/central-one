import { db } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";
import { UserProfile } from "@/types/auth";

export async function createUserProfile(userData: UserProfile) {
  try {
    await setDoc(doc(db, "users", userData.uid), userData);
    console.log("Perfil de usuário criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar perfil:", error);
    throw error;
  }
}
