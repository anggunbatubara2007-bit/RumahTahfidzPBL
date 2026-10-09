
import { useMemo, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    MenuItem,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Paper,
} from "@mui/material";

import {
    Search,
    MenuBook,
    Groups,
    TrendingUp,
    WarningAmber,
    CalendarMonth,
} from "@mui/icons-material";

import { palette } from "../../theme/theme";

// =====================================
// DATA DUMMY SETORAN
// Nantinya dapat diganti dengan API
// backend Node.js
// =====================================
const initialSetoran = [
    {
        id: 1,
        tanggal: "2026-10-09",
        santri: "Ahmad Fauzan",
        jenis: "Hafalan",
        surat: "An-Naba 1-20",
        halaman: 2,
        nilai: "B+",
        catatan: "Lancar",
    },
    {
        id: 2,
        tanggal: "2026-10-09",
        santri: "Tesa Damayanti",
        jenis: "Muraja'ah",
        surat: "Juz 29",
        halaman: 4,
        nilai: "A",
        catatan: "Tajwid",
    },
    {
        id: 3,
        tanggal: "2026-10-08",
        santri: "Citra Anggun",
        jenis: "Hafalan",
        surat: "An-Naba 1-20",
        halaman: 2,
        nilai: "A",
        catatan: "Lancar",
    },
    {
        id: 4,
        tanggal: "2026-10-08",
        santri: "Rizki Hanafi",
        jenis: "Muraja'ah",
        surat: "An-Naba 1-20",
        halaman: 1,
        nilai: "A",
        catatan: "Ulangi",
    },
    {
        id: 5,
        tanggal: "2026-10-07",
        santri: "Muhammad Iqbal",
        jenis: "Hafalan",
        surat: "Al-Mulk 1-10",
        halaman: 2,
        nilai: "B",
        catatan: "Perbaiki makhraj",
    },
];

// =====================================
// KARTU STATISTIK
// =====================================
const statistics = [
    {
        title: "Santri bimbingan",
        value: "18",
        subtitle: "santri",
        icon: <Groups />,
    },
    {
        title: "Setoran hari ini",
        value: "6",
        subtitle: "setoran",
        icon: <MenuBook />,
    },
    {
        title: "Capaian target bulan ini",
        value: "72%",
        subtitle: "target hafalan",
        icon: <TrendingUp />,
    },
    {
        title: "Tertinggal",
        value: "3",
        subtitle: "santri",
        icon: <WarningAmber />,
    },
];

function StatCard({ item }) {
    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                borderColor: palette.aquamarine,
                borderRadius: 2,
                boxShadow: "none",
            }}
        >
            <CardContent
                sx={{
                    p: 2,
                    "&:last-child": { pb: 2 },
                }}
            >
                <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: palette.pineTeal,
                            fontWeight: 600,
                            fontSize: 12,
                            lineHeight: 1.5,
                        }}
                    >
                        {item.title}
                    </Typography>

                    <Box
                        sx={{
                            color: palette.shamrock,
                            display: "flex",
                            flexShrink: 0,
                        }}
                    >
                        {item.icon}
                    </Box>
                </Stack>

                <Stack
                    direction="row"
                    alignItems="baseline"
                    spacing={1}
                    sx={{ mt: 1 }}
                >
                    <Typography
                        sx={{
                            fontSize: 26,
                            lineHeight: 1.2,
                            fontWeight: 700,
                            color: palette.pineTeal,
                        }}
                    >
                        {item.value}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        {item.subtitle}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

// =====================================
// FORMAT TANGGAL
// =====================================
function formatTanggal(value) {
    const [year, month, day] = value.split("-");

    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// =====================================
// DASHBOARD USTADZ
// =====================================
export default function UstadzDashboard() {
    const [search, setSearch] = useState("");
    const [jenis, setJenis] = useState("Semua jenis");
    const [tanggal, setTanggal] = useState("");

    // Filter pencarian, jenis, dan tanggal
    const filteredSetoran = useMemo(() => {
        return initialSetoran.filter((item) => {
            const matchesSearch = item.santri
                .toLowerCase()
                .includes(search.trim().toLowerCase());

            const matchesJenis =
                jenis === "Semua jenis" || item.jenis === jenis;

            const matchesTanggal =
                tanggal === "" || item.tanggal === tanggal;

            return matchesSearch && matchesJenis && matchesTanggal;
        });
    }, [search, jenis, tanggal]);

    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                color: palette.pineTeal,
                fontFamily: "Arial, sans-serif",
            }}
        >
            {/* KARTU STATISTIK */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statistics.map((item) => (
                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                        key={item.title}
                    >
                        <StatCard item={item} />
                    </Grid>
                ))}
            </Grid>

            {/* FILTER SETORAN */}
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    mb: 2.5,
                    borderColor: palette.frostedMint,
                    borderRadius: 2,
                    boxShadow: "none",
                }}
            >
                <Grid container spacing={2}>
                    {/* Pencarian nama santri */}
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Cari nama santri ..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search
                                            sx={{
                                                color: palette.shamrock,
                                                fontSize: 20,
                                            }}
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    {/* Filter jenis setoran */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            select
                            size="small"
                            value={jenis}
                            onChange={(event) => setJenis(event.target.value)}
                            aria-label="Filter jenis setoran"
                        >
                            <MenuItem value="Semua jenis">
                                Semua jenis
                            </MenuItem>

                            <MenuItem value="Hafalan">
                                Hafalan
                            </MenuItem>

                            <MenuItem value="Muraja'ah">
                                Muraja'ah
                            </MenuItem>
                        </TextField>
                    </Grid>

                    {/* Filter tanggal */}
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={tanggal}
                            onChange={(event) => setTanggal(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonth
                                            sx={{
                                                color: palette.shamrock,
                                                fontSize: 20,
                                            }}
                                        />
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                "aria-label": "Filter tanggal setoran",
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* JUDUL TABEL */}
            <Box sx={{ mb: 1.5, px: 0.5 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: palette.pineTeal,
                    }}
                >
                    Setoran Terbaru
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: palette.turfGreen,
                        mt: 0.5,
                    }}
                >
                    Riwayat setoran santri bimbingan
                </Typography>
            </Box>

            {/* TABEL SETORAN */}
            <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                    borderColor: palette.aquamarine,
                    borderRadius: 2,
                    overflowX: "auto",
                    boxShadow: "none",
                }}
            >
                <Table size="small" sx={{ minWidth: 780 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tanggal</TableCell>
                            <TableCell>Santri</TableCell>
                            <TableCell>Jenis</TableCell>
                            <TableCell>Surah/Ayat</TableCell>

                            <TableCell align="center">
                                Halaman
                            </TableCell>

                            <TableCell align="center">
                                Nilai
                            </TableCell>

                            <TableCell>Catatan</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredSetoran.length > 0 ? (
                            filteredSetoran.map((item) => (
                                <TableRow
                                    key={item.id}
                                    hover
                                    sx={{
                                        "&:hover": {
                                            bgcolor: palette.honeydew,
                                        },
                                        "&:last-child td": {
                                            borderBottom: 0,
                                        },
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            whiteSpace: "nowrap",
                                            fontSize: 12,
                                        }}
                                    >
                                        {formatTanggal(item.tanggal)}
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 600,
                                            minWidth: 135,
                                        }}
                                    >
                                        {item.santri}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={item.jenis}
                                            sx={{
                                                bgcolor:
                                                    item.jenis === "Hafalan"
                                                        ? palette.frostedMint
                                                        : palette.aquamarine2,
                                                color: palette.pineTeal,
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ minWidth: 120 }}>
                                        {item.surat}
                                    </TableCell>

                                    <TableCell align="center">
                                        {item.halaman}
                                    </TableCell>

                                    <TableCell align="center">
                                        <Typography
                                            sx={{
                                                color: palette.turfGreen,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {item.nilai}
                                        </Typography>
                                    </TableCell>

                                    <TableCell sx={{ minWidth: 120 }}>
                                        {item.catatan}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    align="center"
                                    sx={{ py: 5 }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Tidak ada data setoran yang sesuai
                                        dengan filter.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* INFORMASI JUMLAH DATA */}
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    mt: 1.5,
                    color: "text.secondary",
                }}
            >
                Menampilkan {filteredSetoran.length} dari{" "}
                {initialSetoran.length} data setoran contoh.
            </Typography>
        </Box>
    );
}
