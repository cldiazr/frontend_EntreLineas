import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "./ui/Card.jsx";

export default function DashboardChart({ labels, revenue, expenses, profit }) {
  const data = labels.map((label, i) => ({
    month: label,
    Ingresos: revenue[i] ?? 0,
    Gastos: expenses[i] ?? 0,
    Ganancia: profit[i] ?? 0,
  }));

  return (
    <Card>
      <p className="mb-4 text-sm font-semibold text-slate-800">
        Ganancia / pérdida — últimos {labels.length} meses (USD)
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} width={45} />
            <Tooltip
              formatter={(value) => `$ ${Number(value).toFixed(2)}`}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ganancia" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
