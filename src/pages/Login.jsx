import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    MenuItem,
    InputAdornment,
    IconButton,
    Alert,
    Divider,
} from "@mui/material";

import {
    Visibility,
    VisibilityOff,
    LockOutlined,
    BadgeOutlined,
    PersonOutlined,
    MenuBook,
} from "@mui/icons-material";

import { useAuth, HOME_BY_ROLE } from "./auth";

const roles = [
    { value: "admin", label: "Admin" },
    { value: "ustadz", label: "Ustadz" },
    { value: "santri", label: "Santri" },
];

// TODO: hapus akun dummy ini saat backend sudah ada,
// ganti dengan pemanggilan API login.
// Santri login dengan NIS, Admin dan Ustadz dengan username.
const USERS = [
    { id: 1, username: "admin", password: "admin123", nama: "Admin RSQ", role: "admin" },
    { id: 2, username: "ustadz01", password: "ustadz123", nama: "Ustadz Hasan", role: "ustadz" },
    { id: 3, nis: "2024001", password: "santri123", nama: "Ahmad Fauzan", role: "santri" },
];

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        role: "admin",
        identifier: "", // NIS (santri) atau username (admin/ustadz)
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Sudah login: langsung ke halaman sesuai role
    if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

    const isSantri = form.role === "santri";
    const identifierLabel = isSantri ? "NIS" : "Username";

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            // ganti role: kosongkan kolom NIS/username agar tidak tertukar
            ...(name === "role" ? { identifier: "" } : {}),
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
            ...(name === "role" ? { identifier: "" } : {}),
        }));

        setLoginError("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const newErrors = {};
        const identifier = form.identifier.trim();

        if (!form.role) {
            newErrors.role = "Silakan pilih role.";
        }

        if (!identifier) {
            newErrors.identifier = `${identifierLabel} wajib diisi.`;
        } else if (isSantri && !/^\d+$/.test(identifier)) {
            newErrors.identifier = "NIS hanya boleh berisi angka.";
        }

        if (!form.password) {
            newErrors.password = "Password wajib diisi.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        // Login dummy: NIS/username, password, dan role harus cocok
        const found = USERS.find((u) => {
            if (u.role !== form.role || u.password !== form.password) return false;
            return isSantri
                ? u.nis === identifier
                : u.username === identifier.toLowerCase();
        });

        if (!found) {
            setLoginError(
                `${identifierLabel}, password, atau role tidak sesuai. Periksa lagi lalu coba masuk kembali.`
            );
            return;
        }

        const safeUser = { ...found };
        delete safeUser.password; // jangan simpan password
        login(safeUser);
        navigate(HOME_BY_ROLE[safeUser.role], { replace: true });
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                py: 4,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Dekorasi latar */}
            <Box
                sx={{
                    position: "absolute",
                    width: 300,
                    height: 300,
                    borderRadius: "50%",
                    bgcolor: "#D1FAE5",
                    top: -130,
                    left: -100,
                }}
            />

            <Box
                sx={{
                    position: "absolute",
                    width: 350,
                    height: 350,
                    borderRadius: "50%",
                    bgcolor: "#A7F3D0",
                    bottom: -190,
                    right: -120,
                    opacity: 0.6,
                }}
            />

            <Container maxWidth="sm" sx={{ position: "relative" }}>
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 4,
                        border: "1px solid #D1FAE5",
                    }}
                >
                    {/* Logo dan identitas */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Box
                            sx={{
                                width: 68,
                                height: 68,
                                mx: "auto",
                                mb: 2,
                                bgcolor: "#064E3B",
                                color: "#FFFFFF",
                                borderRadius: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <MenuBook sx={{ fontSize: 38 }} />
                        </Box>

                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, color: "#064E3B" }}
                        >
                            Pondok Tahfidz RSQ
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{ color: "#047857", mt: 1 }}
                        >
                            Aplikasi Pengelolaan Pondok Tahfidz
                        </Typography>
                    </Box>

                    <Divider sx={{ borderColor: "#D1FAE5", mb: 3 }} />

                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "#064E3B" }}
                    >
                        Selamat Datang!
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mb: 3, mt: 0.5 }}
                    >
                        Silakan masuk menggunakan akun yang telah
                        diberikan oleh administrator.
                    </Typography>

                    {loginError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2, overflowWrap: "anywhere" }}
                        >
                            {loginError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {/* Role */}
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: "#064E3B" }}
                        >
                            Masuk sebagai
                        </Typography>

                        <TextField
                            fullWidth
                            select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            error={Boolean(errors.role)}
                            helperText={errors.role}
                            sx={{ mb: 2.5 }}
                        >
                            {roles.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* NIS (santri) atau Username (admin/ustadz) */}
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: "#064E3B" }}
                        >
                            {identifierLabel}
                        </Typography>

                        <TextField
                            fullWidth
                            name="identifier"
                            type="text"
                            placeholder={`Masukkan ${identifierLabel}`}
                            value={form.identifier}
                            onChange={handleChange}
                            error={Boolean(errors.identifier)}
                            helperText={errors.identifier}
                            autoComplete="username"
                            sx={{ mb: 2.5 }}
                            slotProps={{
                                htmlInput: {
                                    inputMode: isSantri ? "numeric" : "text",
                                },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {isSantri ? (
                                                <BadgeOutlined sx={{ color: "#059669" }} />
                                            ) : (
                                                <PersonOutlined sx={{ color: "#059669" }} />
                                            )}
                                        </InputAdornment>
                                    ),
                                },
                                formHelperText: {
                                    sx: { color: "#D32F2F", mx: 0 },
                                },
                            }}
                        />

                        {/* Password */}
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: "#064E3B" }}
                        >
                            Password
                        </Typography>

                        <TextField
                            fullWidth
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password"
                            value={form.password}
                            onChange={handleChange}
                            error={Boolean(errors.password)}
                            helperText={errors.password}
                            autoComplete="current-password"
                            sx={{ mb: 3 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlined sx={{ color: "#059669" }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowPassword((previous) => !previous)
                                                }
                                                edge="end"
                                                aria-label={
                                                    showPassword
                                                        ? "Sembunyikan password"
                                                        : "Tampilkan password"
                                                }
                                            >
                                                {showPassword ? (
                                                    <VisibilityOff />
                                                ) : (
                                                    <Visibility />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                                formHelperText: {
                                    sx: { color: "#D32F2F", mx: 0 },
                                },
                            }}
                        />

                        {/* Tombol Login */}
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={<LockOutlined />}
                            sx={{
                                py: 1.4,
                                bgcolor: "#047857",
                                borderRadius: 2,
                                fontWeight: 700,
                                boxShadow: "none",
                                "&:hover": {
                                    bgcolor: "#065F46",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            Login
                        </Button>
                    </Box>

                    <Typography
                        variant="caption"
                        display="block"
                        sx={{
                            textAlign: "center",
                            mt: 3,
                            color: "#047857",
                            lineHeight: 1.7,
                        }}
                    >
                        Akun Ustadz dan Santri dibuat oleh Admin.
                        <br />
                        Hubungi Admin jika mengalami kendala login.
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}