
import {
    createContext,
    useContext,
    useState,
    useCallback,
} from "react";

import { Navigate, Outlet } from "react-router-dom";

const AuthContext = createContext(null);

// Menyamakan role dari backend dengan format frontend
const normalizeUser = (data) => ({
    ...data,
    id: data.id_pengguna ?? data.id,
    role: String(data.role || "").toLowerCase(),
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem("token");
            const savedUser = localStorage.getItem("user");

            // Sesi lama tanpa token tidak dianggap login
            if (!token || !savedUser) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                return null;
            }

            return normalizeUser(JSON.parse(savedUser));
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return null;
        }
    });

    // Menyimpan token dan data pengguna setelah login berhasil
    const login = useCallback((response) => {
        const { token, user: userData } = response;

        if (!token || !userData) {
            throw new Error("Data login dari server tidak lengkap.");
        }

        const normalizedUser = normalizeUser(userData);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(normalizedUser));

        setUser(normalizedUser);
    }, []);

    // Menghapus sesi login
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

// Halaman awal berdasarkan role
export const HOME_BY_ROLE = {
    admin: "/admin/dashboard",
    ustadz: "/ustadz/dashboard",
    santri: "/santri/profil",
};

// Memeriksa autentikasi dan role
export default function ProtectedRoute({ allow }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allow && !allow.includes(user.role)) {
        return (
            <Navigate
                to={HOME_BY_ROLE[user.role] || "/login"}
                replace
            />
        );
    }

    return <Outlet />;
}
