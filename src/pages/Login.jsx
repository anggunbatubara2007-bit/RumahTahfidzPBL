
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

// Akun dummy sementara.
// Nanti akan diganti dengan API dari backend MySQL.
const USERS = [
    {
        id: 1,
        username: "admin",
        password: "admin123",
        nama: "Admin RSQ",
        role: "admin",
    },
    {
        id: 2,
        username: "Hilman",
        password: "Hilman123",
        nama: "Ust. Hilman",
        kelompok: "Al-Fatih",
        jumlahSantri: 18,
        role: "ustadz",
    },
    {
        id: 3,
        nis: "2024001",
        password: "santri123",
        nama: "Ahmad Fauzan",
        role: "santri",
    },
];

// Mengambil akun Ustadz dari data yang dikelola Admin.
const semuaAkun = () => {
    try {
        const saved = JSON.parse(localStorage.getItem("dataUstadz"));

        if (Array.isArray(saved)) {
            const ustadz = saved.map((u) => ({
                id: `ustadz-${u.id}`,
                username: u.username,
                password: u.password,
                nama: u.nama,
                kelompok: u.kelompok,
                role: "ustadz",
            }));

            return [
                ...USERS.filter((u) => u.role !== "ustadz"),
                ...ustadz,
            ];
        }
    } catch {
        // Jika data rusak, gunakan akun dummy.
    }

    return USERS;
};

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

    // Jika sudah login, langsung arahkan sesuai role.
    if (user) {
        return (
            <Navigate
                to={HOME_BY_ROLE[user.role]}
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

    const handleSubmit = (event) => {
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

        // Mencari akun berdasarkan username atau NIS.
        // Role akan dikenali otomatis dari data akun.
        const found = semuaAkun().find((u) => {
            const cocokUsername =
                u.username &&
                u.username.toLowerCase() === identifier.toLowerCase();

            const cocokNIS =
                u.nis &&
                u.nis === identifier;

            return (
                (cocokUsername || cocokNIS) &&
                u.password === form.password
            );
        });

        if (!found) {
            setLoginError(
                "Username/NIS atau password tidak sesuai. Periksa kembali akun kamu."
            );
            return;
        }

        // Jangan menyimpan password ke localStorage.
        const safeUser = { ...found };
        delete safeUser.password;

        // Simpan informasi pengguna.
        login(safeUser);

        // Arahkan berdasarkan role akun.
        navigate(HOME_BY_ROLE[safeUser.role], {
            replace: true,
        });
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

                    {/* Pesan kesalahan login */}
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
