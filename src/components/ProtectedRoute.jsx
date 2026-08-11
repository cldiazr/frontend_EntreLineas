import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
