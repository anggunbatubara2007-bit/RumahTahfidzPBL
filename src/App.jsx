
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import theme from './theme/theme';
import ProtectedRoute, {
    AuthProvider,
    useAuth,
    HOME_BY_ROLE
} from './pages/auth';

import AppLayout from './components/AppLayout';
import { NAV, flatNav } from './config/navigation';

import LoginPage from './pages/Login';
import Placeholder from './pages/Placeholder';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import DataSantri from './pages/admin/DataSantri';
import DataUstadz from './pages/admin/DataUstadz';
import KelompokTahfidz from './pages/admin/KelompokTahfidz';
import Hafalan from './pages/admin/Hafalan';
import DataSpp from './pages/admin/DataSpp';
import Verifikasi from './pages/admin/Verifikasi';
import KelolaKeuangan from './pages/admin/KelolaKeuangan';

// Ustadz
import UstadzDashboard from './pages/ustadz/Dashboard';
import SantriBimbingan from './pages/ustadz/SantriBimbingan';

// Santri
import DashboardSantri from './pages/santri/Dashboard';
import HafalanTarget from './pages/santri/HafalanTarget';
import SppPembayaran from './pages/santri/AktivitasPembayaran';

// Daftar halaman aplikasi
const PAGES = {
    // Admin
    '/admin/dashboard': <AdminDashboard />,
    '/admin/santri': <DataSantri />,
    '/admin/ustadz': <DataUstadz />,
    '/admin/kelompok': <KelompokTahfidz />,
    '/admin/hafalan': <Hafalan />,
    '/admin/spp': <DataSpp />,
    '/admin/verifikasi': <Verifikasi />,
    '/admin/keuangan': <KelolaKeuangan />,

    // Ustadz
    '/ustadz/dashboard': <UstadzDashboard />,
    '/ustadz/santri': <SantriBimbingan />,

    // Santri
    '/santri/profil': <DashboardSantri />,
    '/santri/hafalan': <HafalanTarget />,
    '/santri/spp': <SppPembayaran />,
};

function RootRedirect() {
    const { user } = useAuth();

    return (
        <Navigate
            to={user ? HOME_BY_ROLE[user.role] : '/login'}
            replace
        />
    );
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
                            <Route
                                key={role}
                                element={<ProtectedRoute allow={[role]} />}
                            >
                                <Route element={<AppLayout />}>
                                    {routesFor(role)}
                                </Route>
                            </Route>
                        ))}

                        <Route path="*" element={<RootRedirect />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}
