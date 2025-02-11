import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FirebaseProvider } from "./contexts/FirebaseContext";
import { ThemeProvider } from "next-themes";
import Sidebar from "./components/Sidebar";
import VisitanteForm from "./components/forms/VisitanteForm";
import VisitantesList from "./components/lists/VisitantesList";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Loader2, Users, UserPlus, Activity, Calendar } from "lucide-react";
import { useFirebase } from "./contexts/FirebaseContext";
import MembroForm from "./components/forms/MembroForm";
import MembrosList from "./components/lists/MembrosList";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "react-error-boundary";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RegistroPresenca } from "@/components/presenca/RegistroPresenca";
import { AniversariantesList } from "@/components/aniversariantes/AniversariantesList";
import { Card, CardContent } from "@/components/ui/card";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import Login from "@/pages/Login";
import { RoleRoute } from "@/components/RoleRoute";
import Admin from "@/pages/Admin";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Algo deu errado:</h2>
        <pre className="mt-2 text-red-500">{error.message}</pre>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <FirebaseProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <div className="relative min-h-screen">
                        <Sidebar />
                        <div className="lg:ml-64 min-h-screen">
                          <div className="container mx-auto p-4 md:p-8 pt-16 lg:pt-4">
                            <Routes>
                              <Route
                                path="/"
                                element={
                                  <PrivateRoute>
                                    <RoleRoute requiredRole="lider">
                                      <Home />
                                    </RoleRoute>
                                  </PrivateRoute>
                                }
                              />
                              <Route
                                path="/visitantes/cadastro"
                                element={
                                  <PrivateRoute>
                                    <RoleRoute requiredRole="voluntario">
                                      <CadastroVisitante />
                                    </RoleRoute>
                                  </PrivateRoute>
                                }
                              />
                              <Route
                                path="/visitantes/lista"
                                element={
                                  <PrivateRoute>
                                    <RoleRoute requiredRole="lider">
                                      <ListaVisitantes />
                                    </RoleRoute>
                                  </PrivateRoute>
                                }
                              />
                              <Route
                                path="/membros/cadastro"
                                element={<CadastroMembro />}
                              />
                              <Route
                                path="/membros/lista"
                                element={
                                  <PrivateRoute>
                                    <RoleRoute requiredRole="lider">
                                      <ListaMembros />
                                    </RoleRoute>
                                  </PrivateRoute>
                                }
                              />
                              <Route
                                path="/presenca"
                                element={<RegistroPresenca />}
                              />
                              <Route
                                path="/aniversariantes"
                                element={
                                  <PrivateRoute>
                                    <RoleRoute requiredRole="lider">
                                      <AniversariantesList />
                                    </RoleRoute>
                                  </PrivateRoute>
                                }
                              />
                              <Route
                                path="/admin"
                                element={
                                  <PrivateRoute>
                                    <RoleRoute requiredRole="lider">
                                      <Admin />
                                    </RoleRoute>
                                  </PrivateRoute>
                                }
                              />
                            </Routes>
                          </div>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Router>
            <Toaster />
          </FirebaseProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
const Home = () => {
  const {
    getVisitantesCount,
    getVisitantesMesCount,
    getMembrosCount,
    getMembrosAtivosCount,
    getVisitantesPorMes,
    getMembrosPorMinisterio,
  } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    totalVisitantes: 0,
    visitantesMes: 0,
    totalMembros: 0,
    membrosAtivos: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    visitantesPorMes: [],
    membrosPorMinisterio: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          totalVisitantes,
          visitantesMes,
          totalMembros,
          membrosAtivos,
          visitantesPorMes,
          membrosPorMinisterio,
        ] = await Promise.all([
          getVisitantesCount(),
          getVisitantesMesCount(),
          getMembrosCount(),
          getMembrosAtivosCount(),
          getVisitantesPorMes(),
          getMembrosPorMinisterio(),
        ]);

        setCounts({
          totalVisitantes,
          visitantesMes,
          totalMembros,
          membrosAtivos,
        });

        setChartData({
          visitantesPorMes,
          membrosPorMinisterio,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Sistema de gestão de visitantes e membros do Central One.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total de Visitantes"
          value={counts.totalVisitantes.toString()}
          description="Visitantes registrados"
          icon={Users}
          className="bg-blue-50 dark:bg-blue-950/30"
        />
        <DashboardCard
          title="Visitantes do Mês"
          value={counts.visitantesMes.toString()}
          description={`Novos visitantes em ${new Date().toLocaleString(
            "pt-BR",
            {
              month: "long",
            }
          )}`}
          icon={Calendar}
          className="bg-green-50 dark:bg-green-950/30"
        />
        <DashboardCard
          title="Total de Membros"
          value={counts.totalMembros.toString()}
          description="Membros registrados"
          icon={UserPlus}
          className="bg-purple-50 dark:bg-purple-950/30"
        />
        <DashboardCard
          title="Membros Ativos"
          value={counts.membrosAtivos.toString()}
          description="Membros ativos este mês"
          icon={Activity}
          className="bg-orange-50 dark:bg-orange-950/30"
        />
      </div>

      <DashboardCharts data={chartData} loading={loading} />
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon: any;
  className?: string;
}

const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
  className,
}: DashboardCardProps) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardContent className="p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </CardContent>
  </Card>
);

const CadastroVisitante = () => <VisitanteForm />;
const ListaVisitantes = () => <VisitantesList />;
const CadastroMembro = () => <MembroForm />;
const ListaMembros = () => <MembrosList />;

interface ChartData {
  visitantesPorMes: { mes: string; quantidade: number }[];
  membrosPorMinisterio: { ministerio: string; quantidade: number }[];
}
