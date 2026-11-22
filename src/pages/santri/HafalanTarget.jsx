
import { useMemo } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";

const TARGET_HAFALAN = 20;

// Data contoh sementara. Nantinya diambil dari database.
const RIWAYAT_HAFALAN = [
    {
        id: 1,
        tanggal: "20 November 2026",
        jenis: "Hafalan",
        surah: "An-Naba",
        ayat: "1–20",
        halaman: 5,
        nilai: 90,
        catatan: "Bacaan sudah baik, pertahankan.",
        ustadz: "Ust. Hilman",
    },
    {
        id: 2,
        tanggal: "18 November 2026",
        jenis: "Muraja'ah",
        surah: "Al-Mulk",
        ayat: "1–15",
        halaman: 0,
        nilai: 95,
        catatan: "Lancar dan sesuai tajwid.",
        ustadz: "Ust. Hilman",
    },
    {
        id: 3,
        tanggal: "15 November 2026",
        jenis: "Hafalan",
        surah: "An-Naba",
        ayat: "21–40",
        halaman: 5,
        nilai: 88,
        catatan: "Perhatikan panjang pendek bacaan.",
        ustadz: "Ust. Hilman",
    },
];

export default function HafalanTarget() {
    // Hanya setoran jenis Hafalan yang dihitung untuk target.
    const jumlahHafalan = useMemo(
        () =>
            RIWAYAT_HAFALAN
                .filter((item) => item.jenis === "Hafalan")
                .reduce((total, item) => total + item.halaman, 0),
        []
    );

    const sisaTarget = Math.max(TARGET_HAFALAN - jumlahHafalan, 0);

    const progress = Math.min(
        (jumlahHafalan / TARGET_HAFALAN) * 100,
        100
    );

    const targetTercapai = jumlahHafalan >= TARGET_HAFALAN;

    return (
        <Box sx={{ pb: 4 }}>
            {/* HEADER */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="#064E3B">
                    Hafalan dan Target
                </Typography>

                <Typography color="text.secondary">
                    Pantau riwayat setoran dan pencapaian target hafalan bulananmu.
                </Typography>
            </Box>

            {/* RINGKASAN TARGET */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent>
                            <MenuBookIcon color="success" />

                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                Target Hafalan Bulanan
                            </Typography>

                            <Typography variant="h4" fontWeight="bold">
                                20 Halaman
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Setara 1 juz per bulan
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent>
                            <HistoryIcon color="success" />

                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                Hafalan Terkumpul
                            </Typography>

                            <Typography variant="h4" fontWeight="bold">
                                {jumlahHafalan} Halaman
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Hafalan baru bulan berjalan
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent>
                            <TrackChangesIcon color="success" />

                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                Sisa Target
                            </Typography>

                            <Typography variant="h4" fontWeight="bold">
                                {sisaTarget} Halaman
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Halaman yang perlu disetorkan
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* PROGRESS */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography fontWeight="bold">
                            Progress Pencapaian Target
                        </Typography>

                        <Typography fontWeight="bold" color="success.main">
                            {progress.toFixed(0)}%
                        </Typography>
                    </Box>

                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 14,
                            borderRadius: 5,
                            bgcolor: "#D1FAE5",
                            "& .MuiLinearProgress-bar": {
                                bgcolor: "#047857",
                                borderRadius: 5,
                            },
                        }}
                    />

                    <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" color="text.secondary">
                            {jumlahHafalan} dari {TARGET_HAFALAN} halaman
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Sisa {sisaTarget} halaman
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* STATUS BEASISWA */}
            <Card sx={{ borderRadius: 3, mb: 4 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                        <EmojiEventsIcon
                            sx={{ fontSize: 42, color: "#047857" }}
                        />

                        <Box>
                            <Typography fontWeight="bold">
                                Status Beasiswa
                            </Typography>

                            <Chip
                                label={
                                    targetTercapai
                                        ? "Target Tercapai"
                                        : "Belum Tercapai"
                                }
                                color={targetTercapai ? "success" : "warning"}
                                sx={{ mt: 0.5 }}
                            />
                        </Box>
                    </Box>

                    <Alert
                        severity={targetTercapai ? "success" : "info"}
                        sx={{ mt: 2 }}
                    >
                        {targetTercapai
                            ? "Selamat! Target hafalan bulanan telah tercapai."
                            : `Kamu masih perlu menyetorkan ${sisaTarget} halaman hafalan baru untuk mencapai target bulanan.`}
                    </Alert>
                </CardContent>
            </Card>

            {/* RIWAYAT SETORAN */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Riwayat Hafalan dan Muraja'ah
            </Typography>

            <TableContainer
                component={Paper}
                sx={{ borderRadius: 3, overflowX: "auto" }}
            >
                <Table sx={{ minWidth: 850 }}>
                    <TableHead sx={{ bgcolor: "#ECFDF5" }}>
                        <TableRow>
                            <TableCell><b>Tanggal</b></TableCell>
                            <TableCell><b>Jenis Setoran</b></TableCell>
                            <TableCell><b>Surah dan Ayat</b></TableCell>
                            <TableCell><b>Nilai</b></TableCell>
                            <TableCell><b>Ustadz</b></TableCell>
                            <TableCell><b>Catatan</b></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {RIWAYAT_HAFALAN.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.tanggal}</TableCell>

                                <TableCell>
                                    <Chip
                                        label={item.jenis}
                                        size="small"
                                        color={
                                            item.jenis === "Hafalan"
                                                ? "success"
                                                : "info"
                                        }
                                    />
                                </TableCell>

                                <TableCell>
                                    {item.surah} ({item.ayat})
                                </TableCell>

                                <TableCell>
                                    <Typography fontWeight="bold">
                                        {item.nilai}
                                    </Typography>
                                </TableCell>

                                <TableCell>{item.ustadz}</TableCell>

                                <TableCell>{item.catatan}</TableCell>
                            </TableRow>
                        ))}

                        {RIWAYAT_HAFALAN.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    Belum ada riwayat setoran hafalan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Divider sx={{ mt: 3 }} />

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
            >
                Catatan: Muraja'ah ditampilkan dalam riwayat setoran, tetapi
                tidak dihitung sebagai pencapaian target hafalan baru.
            </Typography>
        </Box>
    );
}
