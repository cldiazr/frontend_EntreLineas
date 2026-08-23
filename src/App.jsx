import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tandas from "./pages/Tandas.jsx";
import Ventas from "./pages/Ventas.jsx";
import CuentasCobrar from "./pages/CuentasCobrar.jsx";
import Inventario from "./pages/Inventario.jsx";
import Gastos from "./pages/Gastos.jsx";
import Recetas from "./pages/Recetas.jsx";
import Conversiones from "./pages/Conversiones.jsx";
import Comisiones from "./pages/Comisiones.jsx";
import Usuarios from "./pages/Usuarios.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tandas" element={<Tandas />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/cuentas-cobrar" element={<CuentasCobrar />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/conversiones" element={<Conversiones />} />
            <Route path="/comisiones" element={<Comisiones />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
