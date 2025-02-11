import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/config/firebase";
import { UserProfile, UserRole } from "@/types/auth";
import { createUserProfile } from "@/utils/createUser";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { showToast } from "@/components/ui/custom-toast";

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    nome: "",
    role: "voluntario" as UserRole,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(
        (doc) => doc.data() as UserProfile
      );
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // Criar perfil no Firestore
      const userData: UserProfile = {
        uid: userCredential.user.uid,
        email: newUser.email,
        nome: newUser.nome,
        role: newUser.role,
      };

      await createUserProfile(userData);

      showToast({
        title: "Usuário criado com sucesso!",
        type: "success",
      });

      // Limpar formulário e recarregar lista
      setNewUser({
        email: "",
        password: "",
        nome: "",
        role: "voluntario",
      });
      fetchUsers();
    } catch (error: any) {
      showToast({
        title: "Erro ao criar usuário",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">
          Administração de Usuários
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Gerencie os usuários do sistema
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <h2 className="text-xl font-medium mb-4">Novo Usuário</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Nome"
                value={newUser.nome}
                onChange={(e) =>
                  setNewUser({ ...newUser, nome: e.target.value })
                }
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
              <Input
                type="password"
                placeholder="Senha"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
              <Select
                value={newUser.role}
                onValueChange={(value: "lider" | "voluntario") =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lider">Líder</SelectItem>
                  <SelectItem value="voluntario">Voluntário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Usuário
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-4">Usuários</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
