import { createContext, useEffect, useMemo, useState } from "react";
import { getWallets } from "../services/walletsService.js";

export const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [ves, setVes] = useState(0);
  const [usd, setUsd] = useState(0);
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

  useEffect(() => {
    refreshWallets();
  }, []);

  const value = useMemo(
    () => ({ ves, usd, loading, refreshWallets }),
    [ves, usd, loading]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
