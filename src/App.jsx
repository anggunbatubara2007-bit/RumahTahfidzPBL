import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import ProtectedRoute, { AuthProvider, useAuth, HOME_BY_ROLE } from './pages/auth';
import AppLayout from './components/AppLayout';
import { NAV, flatNav } from './config/navigation';

import LoginPage from './pages/Login';
import Placeholder from './pages/Placeholder';
// Admin
import AdminDashboard from './pages/admin/Dashboard';
import DataSantri from './pages/admin/DataSantri';
// Ustadz
// (belum ada)

// Santri
// (belum ada)

// Daftarkan halaman yang sudah jadi di sini.
// Key harus sama persis dengan `path` di config/navigation.jsx.
// Halaman yang belum terdaftar otomatis menampilkan Placeholder.
const PAGES = {
  '/admin/dashboard': <AdminDashboard />,
  '/admin/santri': <DataSantri />,
};

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}

const routesFor = (role) =>
  flatNav(role).map((item) => (
    <Route
      key={item.path}
      path={item.path}
      element={PAGES[item.path] ?? <Placeholder title={item.title} />}
    />
  ));

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {Object.keys(NAV).map((role) => (
              <Route key={role} element={<ProtectedRoute allow={[role]} />}>
                <Route element={<AppLayout />}>{routesFor(role)}</Route>
              </Route>
            ))}

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}