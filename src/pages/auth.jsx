import { createContext, useContext, useState, useCallback } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// ---------- Konteks login ----------
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null; // { id, nama, role }
    });

    const login = useCallback((data) => {
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

// ---------- Pembatas halaman per role ----------

// Halaman awal tiap role setelah login
export const HOME_BY_ROLE = {
    admin: '/admin/dashboard',
    ustadz: '/ustadz/santri',
    santri: '/santri/profil',
};

export default function ProtectedRoute({ allow }) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (allow && !allow.includes(user.role)) {
        return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
    }

    return <Outlet />;
}