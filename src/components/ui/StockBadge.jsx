export default function StockBadge({ stock, minStock }) {
  const low =
    minStock !== null &&
    minStock !== undefined &&
    Number(stock) < Number(minStock);

  return low ? (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      Stock bajo · {stock}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      Stock OK · {stock}
    </span>
  );
}
