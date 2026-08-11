import { TrendingDown, TrendingUp, HandCoins, Wallet as WalletIcon } from "lucide-react";
import Card from "./ui/Card.jsx";
import { formatUSD } from "../utils/formatters.js";

export default function DashboardSummary({ summary, wallets, latestRate }) {
  const cards = [
    {
      label: "Ingresos del mes",
      value: formatUSD(summary.totalRevenueUSD),
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      label: "Gastos del mes",
      value: formatUSD(summary.totalExpensesUSD),
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      label: "Ganancia Neta",
      value: formatUSD(summary.netProfitUSD),
      icon: WalletIcon,
      color: "text-amber-600",
    },
    {
      label: "CxC pendiente",
      value: formatUSD(summary.pendingCollectionsUSD),
      icon: HandCoins,
      color: "text-sky-600",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Billetera VES</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {wallets.VES.toLocaleString("es-VE", { maximumFractionDigits: 2 })} Bs.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Aprox. en USD</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatUSD(latestRate ? wallets.VES / latestRate : 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Billetera USD</p>
            <p className="text-2xl font-bold text-slate-900">{formatUSD(wallets.USD)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
