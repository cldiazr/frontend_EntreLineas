import Card from "./ui/Card.jsx";
import Badge from "./ui/Badge.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import { formatUSD } from "../utils/formatters.js";
import { Trophy } from "lucide-react";

export default function ProductPerformance({ products, latestRate }) {
  const rows = products.map((p) => {
    const cogsUSD = latestRate ? p.cogsVES / latestRate : 0;
    const margin =
      p.totalUSD > 0 ? ((p.totalUSD - cogsUSD) / p.totalUSD) * 100 : 0;
    return { ...p, cogsUSD, margin };
  });

  return (
    <Card>
      <p className="mb-4 text-sm font-semibold text-slate-800">
        Productos más vendidos del mes
      </p>
      {rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Sin ventas pagadas este mes"
          description="Los productos más vendidos aparecerán aquí."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="pb-2 pr-4">Producto</th>
                <th className="pb-2 pr-4 text-right">Unidades</th>
                <th className="pb-2 pr-4 text-right">Total USD</th>
                <th className="pb-2 pr-4 text-right">COGS</th>
                <th className="pb-2 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.productId}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{row.productName}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">{row.unitsSold}</td>
                  <td className="py-2.5 pr-4 text-right font-medium text-slate-900">
                    {formatUSD(row.totalUSD)}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">{formatUSD(row.cogsUSD)}</td>
                  <td className="py-2.5 text-right">
                    <Badge variant={row.margin >= 0 ? "active" : "danger"}>
                      {row.margin.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
