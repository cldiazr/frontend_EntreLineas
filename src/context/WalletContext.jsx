import { createContext, useEffect, useMemo, useState } from "react";
import { getWallets } from "../services/walletsService.js";
import { getOfficialRate } from "../services/exchangeRatesService.js";

export const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [ves, setVes] = useState(0);
  const [usd, setUsd] = useState(0);
  const [officialRate, setOfficialRate] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshWallets = async () => {
    try {
      const { wallets } = await getWallets();
      setVes(wallets.find((w) => w.currency === "VES")?.balance ?? 0);
      setUsd(wallets.find((w) => w.currency === "USD")?.balance ?? 0);
    } catch {
      // sin cambios
    } finally {
      setLoading(false);
    }
  };

  const refreshOfficialRate = async () => {
    try {
      const data = await getOfficialRate();
      if (data?.ok) setOfficialRate(data.officialRateVESPerUSD);
    } catch {
      // sin cambios
    }
  };

  useEffect(() => {
    refreshWallets();
    refreshOfficialRate();
  }, []);

  const value = useMemo(
    () => ({ ves, usd, officialRate, loading, refreshWallets }),
    [ves, usd, officialRate, loading]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
