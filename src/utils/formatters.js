export function formatVES(amount) {
  const value = Number(amount) || 0;
  return `Bs. ${value.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatUSD(amount) {
  const value = Number(amount) || 0;
  return `$ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatDate(iso)} ${time}`;
}
