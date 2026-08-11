import Modal from "./ui/Modal.jsx";
import Button from "./ui/Button.jsx";

export default function ConfirmDialog({
  open,
  title = "Confirmar acción",
  message,
  confirmLabel = "Confirmar",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
