
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Chip, InputAdornment, List, ListItemButton,
    ListItemText, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { palette } from '../../theme/theme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WARNA_STATUS = {
    Tercapai: 'success',
    Tertinggal: 'error',
};

function StatCard({ label, value, icon: Icon }) {
    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                    {label}
                </Typography>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 1,
                }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {value}
                    </Typography>
                    <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
                </Box>
            </CardContent>
        </Card>
    );
}

function Panel({ title, action, children }) {
    return (
        <Card sx={{
            height: '100%',
            borderColor: palette.emeraldDeep,
            overflow: 'hidden',
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2.5,
                py: 1.5,
                bgcolor: palette.emeraldDeep,
                color: '#fff',
            }}>
                <Typography variant="h6" sx={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#fff',
                }}>
                    {title}
                </Typography>
                {action}
            </Box>
            {children}
        </Card>
    );
}

function EmptyState({ children }) {
    return (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            {children}
        </Typography>
    );
}

function formatBulan(bulan) {
    if (!bulan) return '-';

    const [tahun, nomorBulan] = bulan.split('-');
    const tanggal = new Date(Number(tahun), Number(nomorBulan) - 1, 1);

    return tanggal.toLocaleDateString('id-ID', {
        month: 'long',
    });
}

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [stats, setStats] = useState({
        totalSantri: 0,
        totalUstadz: 0,
        totalKelompok: 0,
    });
    const [setoran, setSetoran] = useState([]);
    const [verifikasi, setVerifikasi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Mengambil data Dashboard Admin dari backend
    useEffect(() => {
        let masihAktif = true;

        const ambilDataDashboard = async () => {
            try {
                setLoading(true);
                setError('');

                const token = localStorage.getItem('token');

                if (!token) {
                    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
                }

                const response = await fetch(
                    `${API_URL}/api/admin/dashboard`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                const hasil = await response.json();

                if (!response.ok) {
                    throw new Error(
                        hasil.message || 'Gagal mengambil data Dashboard Admin.'
                    );
                }

                if (masihAktif) {
                    setStats(hasil.data.stats || {
                        totalSantri: 0,
                        totalUstadz: 0,
                        totalKelompok: 0,
                    });

                    setSetoran(hasil.data.setoranTerbaru || []);
                    setVerifikasi(hasil.data.verifikasi || []);
                }
            } catch (err) {
                if (masihAktif) {
                    setError(err.message);
                }
            } finally {
                if (masihAktif) {
                    setLoading(false);
                }
            }
        };

        ambilDataDashboard();

        return () => {
            masihAktif = false;
        };
    }, []);

    // Filter data setoran berdasarkan nama santri
    const terfilter = useMemo(() => {
        const q = query.trim().toLowerCase();

        const daftarSorted = [...setoran].sort((a, b) => {
            return (
                b.tanggal.localeCompare(a.tanggal) ||
                b.id_setoran - a.id_setoran
            );
        });

        if (!q) return daftarSorted;

        return daftarSorted.filter((s) =>
            s.santri.toLowerCase().includes(q)
        );
    }, [query, setoran]);

    // Tampilkan lima setoran terbaru jika tidak sedang mencari
    const tampil = useMemo(() => {
        return query.trim() ? terfilter : terfilter.slice(0, 5);
    }, [query, terfilter]);

    const handleSearch = (e) => {
        e.preventDefault();
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {error && (
                <Card sx={{ p: 2, borderColor: 'error.main' }}>
                    <Typography color="error">
                        {error}
                    </Typography>
                </Card>
            )}

            {/* Ringkasan */}
            <Box sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(3, 1fr)',
                },
            }}>
                <StatCard
                    label="Total Santri"
                    value={loading ? '...' : stats.totalSantri}
                    icon={PeopleIcon}
                />
                <StatCard
                    label="Total Ustadz"
                    value={loading ? '...' : stats.totalUstadz}
                    icon={PersonIcon}
                />
                <StatCard
                    label="Kelompok Tahfidz"
                    value={loading ? '...' : stats.totalKelompok}
                    icon={GroupsIcon}
                />
            </Box>

            {/* Pencarian santri */}
            <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 420 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Cari nama santri ....."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '& fieldset': { borderColor: palette.shamrock },
                            '&:hover fieldset': { borderColor: palette.turfGreen },
                        },
                    }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        fontSize="small"
                                        sx={{ color: palette.shamrock }}
                                    />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: {
                            'aria-label': 'Cari nama santri',
                        },
                    }}
                />
            </Box>

            {/* Setoran dan verifikasi pembayaran */}
            <Box sx={{
                display: 'grid',
                gap: 3,
                alignItems: 'start',
                gridTemplateColumns: {
                    xs: '1fr',
                    lg: '3fr 2fr',
                },
            }}>
                {/* Setoran Hafalan Terbaru */}
                <Card sx={{
                    height: '100%',
                    borderColor: palette.emeraldDeep,
                    overflow: 'hidden',
                }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{
                                '& .MuiTableCell-root': {
                                    bgcolor: palette.emeraldDeep,
                                },
                            }}>
                                <TableRow>
                                    <TableCell colSpan={3} sx={{
                                        borderBottom: 0,
                                        pt: 1.5,
                                        pb: 0.5,
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}>
                                            <Typography sx={{
                                                fontSize: 17,
                                                fontWeight: 700,
                                                color: '#fff',
                                            }}>
                                                Setoran Hafalan Terbaru
                                            </Typography>

                                            <Button
                                                size="small"
                                                onClick={() => navigate('/admin/hafalan')}
                                                sx={{
                                                    color: '#fff',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255,255,255,0.15)',
                                                    },
                                                }}
                                            >
                                                Lihat semua
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell sx={{
                                        color: palette.frostedMint,
                                        pt: 0.5,
                                        fontWeight: 700,
                                    }}>
                                        Nama Santri
                                    </TableCell>
                                    <TableCell sx={{
                                        color: palette.frostedMint,
                                        pt: 0.5,
                                        fontWeight: 700,
                                    }}>
                                        Surah/Ayat
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        color: palette.frostedMint,
                                        pt: 0.5,
                                        fontWeight: 700,
                                    }}>
                                        Status Beasiswa
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {tampil.map((s) => (
                                    <TableRow key={s.id_setoran} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {s.santri}
                                        </TableCell>

                                        <TableCell>
                                            {s.surat || '-'}
                                        </TableCell>

                                        <TableCell align="center">
                                            <Chip
                                                label={s.statusBeasiswa || 'Tertinggal'}
                                                size="small"
                                                color={
                                                    WARNA_STATUS[s.statusBeasiswa] || 'default'
                                                }
                                                sx={{
                                                    fontWeight: 600,
                                                    minWidth: 100,
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {loading && (
                        <EmptyState>Memuat data setoran...</EmptyState>
                    )}

                    {!loading && tampil.length === 0 && (
                        <EmptyState>
                            {query.trim()
                                ? `Tidak ada santri dengan nama "${query}" pada data setoran.`
                                : 'Belum ada setoran hafalan.'}
                        </EmptyState>
                    )}
                </Card>

                {/* Verifikasi Pembayaran */}
                <Panel
                    title="Verifikasi Pembayaran"
                    action={
                        <Chip
                            size="small"
                            color={verifikasi.length ? 'warning' : 'default'}
                            label={`${verifikasi.length} Menunggu`}
                        />
                    }
                >
                    <List disablePadding>
                        {verifikasi.map((v) => (
                            <ListItemButton
                                key={v.id}
                                divider
                                onClick={() =>
                                    navigate(`/admin/verifikasi?id=${v.id}`)
                                }
                            >
                                <ListItemText
                                    primary={v.santri}
                                    secondary={`SPP ${formatBulan(v.bulan)}`}
                                    slotProps={{
                                        primary: {
                                            fontWeight: 600,
                                            fontSize: 14,
                                        },
                                    }}
                                />
                                <ChevronRightIcon color="action" />
                            </ListItemButton>
                        ))}
                    </List>

                    {loading && (
                        <EmptyState>Memuat data pembayaran...</EmptyState>
                    )}

                    {!loading && verifikasi.length === 0 && (
                        <EmptyState>
                            Tidak ada bukti transfer yang menunggu verifikasi.
                        </EmptyState>
                    )}
                </Panel>
            </Box>
        </Box>
    );
}
