
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Typography,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useAuth } from "../auth";

export default function DashboardSantri() {
    const { user } = useAuth();

    // Data sementara jika data akun belum terhubung ke database.
    const nama = user?.nama || "Ahmad Fauzan";
    const nis = user?.nis || "2024001";
    const kelompok = user?.kelompok || "Al-Fatih";
    const ustadz = user?.ustadz || "Ust. Hilman";

    const informasiProfil = [
        {
            label: "Nama Lengkap",
            value: nama,
            icon: PersonIcon,
        },
        {
            label: "Nomor Induk Santri",
            value: nis,
            icon: BadgeIcon,
        },
        {
            label: "Kelompok Tahfidz",
            value: kelompok,
            icon: GroupsIcon,
        },
        {
            label: "Ustadz Pembimbing",
            value: ustadz,
            icon: SchoolIcon,
        },
    ];

    return (
        <Box sx={{ pb: 4 }}>
            {/* HEADER */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="#064E3B"
                >
                    Dashboard Santri
                </Typography>

                <Typography color="text.secondary">
                    Selamat datang di Aplikasi Pengelolaan Pondok Tahfidz RSQ.
                </Typography>
            </Box>

            {/* KARTU SELAMAT DATANG */}
            <Card
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: "linear-gradient(120deg, #064E3B, #047857)",
                    color: "white",
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                    >
                        <Avatar
                            sx={{
                                width: 75,
                                height: 75,
                                bgcolor: "white",
                                color: "#047857",
                            }}
                        >
                            <AccountCircleIcon sx={{ fontSize: 55 }} />
                        </Avatar>

                        <Box>
                            <Typography variant="body1">
                                Selamat datang,
                            </Typography>

                            <Typography
                                variant="h5"
                                fontWeight="bold"
                            >
                                {nama}
                            </Typography>

                            <Chip
                                label="Santri Aktif"
                                size="small"
                                sx={{
                                    mt: 1,
                                    bgcolor: "#D1FAE5",
                                    color: "#065F46",
                                    fontWeight: "bold",
                                }}
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* INFORMASI PROFIL */}
            <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2 }}
            >
                Informasi Profil Santri
            </Typography>

            <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ mb: 2 }}
                    >
                        <PersonIcon color="success" />
                        <Typography fontWeight="bold">
                            Data Pribadi
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        {informasiProfil.map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    key={index}
                                >
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={2}
                                        sx={{
                                            p: 2,
                                            border: "1px solid #E5E7EB",
                                            borderRadius: 2,
                                            height: "100%",
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: "#D1FAE5",
                                                color: "#047857",
                                            }}
                                        >
                                            <Icon />
                                        </Avatar>

                                        <Box>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {item.label}
                                            </Typography>

                                            <Typography
                                                fontWeight="bold"
                                                sx={{ mt: 0.5 }}
                                            >
                                                {item.value}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </CardContent>
            </Card>

            {/* INFORMASI TAMBAHAN */}
            <AlertBox />
        </Box>
    );
}

function AlertBox() {
    return (
        <Card
            sx={{
                mt: 3,
                borderRadius: 3,
                bgcolor: "#ECFDF5",
                border: "1px solid #A7F3D0",
            }}
        >
            <CardContent>
                <Typography
                    fontWeight="bold"
                    color="#065F46"
                >
                    Informasi
                </Typography>

                <Typography
                    variant="body2"
                    color="#065F46"
                    sx={{ mt: 1 }}
                >
                    Gunakan menu Hafalan dan Target untuk melihat
                    perkembangan hafalan serta menu SPP dan Pembayaran
                    untuk melihat tagihan dan mengirim bukti pembayaran.
                </Typography>
            </CardContent>
        </Card>
    );
}
