import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../services/authService.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

export default function Registro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const errs = {};
    if (!name.trim()) errs.name = "El nombre es requerido";
    if (!email.trim()) errs.email = "El email es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Email inválido";
    if (!password) errs.password = "La contraseña es requerida";
    else if (password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (password !== confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      setSuccess(true);
    } catch (error) {
      setServerError(error.response?.data?.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-5xl">&#128203;</div>
          <h2 className="text-xl font-bold text-slate-900">Cuenta creada</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tu cuenta está pendiente de aprobación. El administrador te notificará cuando puedas acceder.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">EntreLíneas · Registro</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            type="email"
            label="Email"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            type="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Input
            type="password"
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
          <Button type="submit" loading={loading} className="w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-amber-600 hover:text-amber-700">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
