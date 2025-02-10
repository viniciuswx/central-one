import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

interface ChartData {
  visitantesPorMes: {
    mes: string;
    quantidade: number;
  }[];
  membrosPorMinisterio: {
    ministerio: string;
    quantidade: number;
  }[];
}

interface DashboardChartsProps {
  data: ChartData;
  loading: boolean;
}

export function DashboardCharts({ data, loading }: DashboardChartsProps) {
  if (loading) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Visitantes por Mês</h3>
          <div className="h-[300px] w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.visitantesPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(" ")[0]} // Mostra apenas o mês em telas pequenas
                />
                <YAxis tick={{ fontSize: 12 }} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="quantidade"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Membros por Ministério</h3>
          <div className="h-[300px] w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.membrosPorMinisterio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ministerio"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="quantidade" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
