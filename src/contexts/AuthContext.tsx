import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/config/firebase";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  hasPermission: (requiredRole: "lider" | "voluntario") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        // Busca o perfil do usuário no Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const hasPermission = (requiredRole: "lider" | "voluntario") => {
    if (!profile) return false;
    if (profile.role === "lider") return true;
    return profile.role === requiredRole;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasPermission }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
