import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getDashboardMonthly,
  getProductPerformance,
} from "../services/dashboardService.js";
import DashboardSummary from "../components/DashboardSummary.jsx";
import DashboardChart from "../components/DashboardChart.jsx";
import ProductPerformance from "../components/ProductPerformance.jsx";
import { SkeletonCard, SkeletonList } from "../components/ui/Skeleton.jsx";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [summaryData, monthlyData, performanceData] = await Promise.all([
          getDashboardSummary(),
          getDashboardMonthly({ months: 6 }),
          getProductPerformance(),
        ]);
        if (!active) return;
        setSummary(summaryData);
        setMonthly(monthlyData);
        setPerformance(performanceData);
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "No se pudieron cargar los datos del dashboard");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const latestRate = summary?.latestRateVESPerUSD ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Resumen de {summary?.month || "este mes"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="h-64 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 h-4 w-56 animate-pulse rounded bg-slate-200" />
            <div className="h-48 w-full animate-pulse rounded bg-slate-100" />
          </div>
          <SkeletonList rows={3} />
        </div>
      ) : (
        <>
          {summary && (
            <DashboardSummary
              summary={summary.summary}
              wallets={summary.wallets}
              latestRate={latestRate}
            />
          )}
          {monthly && (
            <DashboardChart
              labels={monthly.labels}
              revenue={monthly.revenue}
              expenses={monthly.expenses}
              profit={monthly.profit}
            />
          )}
          {performance && (
            <ProductPerformance products={performance.products} latestRate={latestRate} />
          )}
        </>
      )}
    </div>
  );
}
