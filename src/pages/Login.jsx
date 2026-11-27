
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Alert,
    Divider,
} from "@mui/material";

import {
    Visibility,
    VisibilityOff,
    LockOutlined,
    PersonOutlined,
} from "@mui/icons-material";

import { useAuth, HOME_BY_ROLE } from "./auth";

// Alamat backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        identifier: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);

    // Jika sudah login, arahkan sesuai role
    if (user) {
        return (
            <Navigate
                to={HOME_BY_ROLE[user.role] || "/login"}
                replace
            />
        );
    }

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        setLoginError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const newErrors = {};
        const identifier = form.identifier.trim();

        if (!identifier) {
            newErrors.identifier = "Username atau NIS wajib diisi.";
        }

        if (!form.password) {
            newErrors.password = "Password wajib diisi.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {
            setLoading(true);
            setLoginError("");

            // Mengirim data login ke backend
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        identifier,
                        password: form.password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Login gagal. Periksa akun kamu."
                );
            }

            if (!data.token || !data.user) {
                throw new Error("Respons login dari server tidak lengkap.");
            }

            // Menyimpan token dan informasi pengguna
            login(data);

            // Menentukan halaman berdasarkan role
            const role = String(data.user.role).toLowerCase();
            const tujuan = HOME_BY_ROLE[role];

            if (!tujuan) {
                throw new Error("Role pengguna tidak dikenali.");
            }

            navigate(tujuan, { replace: true });
        } catch (error) {
            console.error("Login error:", error);

            if (
                error instanceof TypeError &&
                error.message.toLowerCase().includes("fetch")
            ) {
                setLoginError(
                    "Tidak dapat terhubung ke server. Pastikan backend berjalan."
                );
            } else {
                setLoginError(error.message);
            }
        } finally {
            setLoading(false);
        }
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

            <Container
                maxWidth="sm"
                sx={{ position: "relative" }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 4,
                        border: "1px solid #D1FAE5",
                    }}
                >
                    {/* Logo dan identitas */}
                    <Box
                        sx={{
                            textAlign: "center",
                            mb: 3,
                        }}
                    >
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="Logo RSQ"
                            sx={{
                                width: 84,
                                height: 84,
                                mx: "auto",
                                mb: 2,
                                display: "block",
                                objectFit: "contain",
                            }}
                        />

                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: "#064E3B",
                            }}
                        >
                            Pondok Tahfidz RSQ
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: "#047857",
                                mt: 1,
                            }}
                        >
                            Aplikasi Pengelolaan Pondok Tahfidz
                        </Typography>
                    </Box>

                    <Divider
                        sx={{
                            borderColor: "#D1FAE5",
                            mb: 3,
                        }}
                    />

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: "#064E3B",
                        }}
                    >
                        Selamat Datang!
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            mb: 3,
                            mt: 0.5,
                        }}
                    >
                        Silakan masuk menggunakan akun yang telah
                        diberikan oleh administrator.
                    </Typography>

                    {/* Pesan kesalahan */}
                    {loginError && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {loginError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        {/* Username atau NIS */}
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 1,
                                fontWeight: 600,
                                color: "#064E3B",
                            }}
                        >
                            Username atau NIS
                        </Typography>

                        <TextField
                            fullWidth
                            name="identifier"
                            type="text"
                            placeholder="Masukkan username atau NIS"
                            value={form.identifier}
                            onChange={handleChange}
                            error={Boolean(errors.identifier)}
                            helperText={errors.identifier}
                            autoComplete="username"
                            disabled={loading}
                            sx={{ mb: 2.5 }}
                            slotProps={{
                                htmlInput: {
                                    inputMode: "text",
                                },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonOutlined
                                                sx={{ color: "#059669" }}
                                            />
                                        </InputAdornment>
                                    ),
                                },
                                formHelperText: {
                                    sx: {
                                        color: "#D32F2F",
                                        mx: 0,
                                    },
                                },
                            }}
                        />

                        {/* Password */}
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 1,
                                fontWeight: 600,
                                color: "#064E3B",
                            }}
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
                            disabled={loading}
                            sx={{ mb: 3 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlined
                                                sx={{ color: "#059669" }}
                                            />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowPassword(
                                                        (previous) => !previous
                                                    )
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
                                    sx: {
                                        color: "#D32F2F",
                                        mx: 0,
                                    },
                                },
                            }}
                        />

                        {/* Tombol login */}
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={<LockOutlined />}
                            disabled={loading}
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
                            {loading ? "Memproses..." : "Login"}
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
