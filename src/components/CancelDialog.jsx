import { useEffect, useState } from "react";
import Modal from "./ui/Modal.jsx";
import Button from "./ui/Button.jsx";
import Textarea from "./ui/Textarea.jsx";

export default function CancelDialog({
  open,
  title = "Cancelar",
  message,
  consequences,
  confirmLabel = "Confirmar",
  loading = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Volver
          </Button>
          <Button loading={loading} disabled={!reason.trim()} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {message && <p className="text-sm text-slate-600">{message}</p>}
        {consequences && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {consequences}
          </p>
        )}
        <Textarea
          label="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo de la cancelación (obligatorio)"
          rows={3}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
