import { useState } from 'react';
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

// TODO: ganti data dummy ini dengan data dari API backend.
const STATS = { totalSantri: 45, totalUstadz: 17, totalKelompok: 6 };

const SETORAN_TERBARU = [
    { id: 1, santri: 'Ahmad Fauzan', surat: 'An-Naba', ayat: '1-20', nilai: 'A' },
    { id: 2, santri: 'Ahmad Fauzan', surat: 'An-Naba', ayat: '1-20', nilai: 'A' },
    { id: 3, santri: 'Ahmad Fauzan', surat: 'An-Naba', ayat: '1-20', nilai: 'B' },
    { id: 4, santri: 'Ahmad Fauzan', surat: 'An-Naba', ayat: '1-20', nilai: 'A' },
    { id: 5, santri: 'Ahmad Fauzan', surat: 'An-Naba', ayat: '1-20', nilai: 'C' },
];

const VERIFIKASI = [
    { id: 1, santri: 'Ahmad Fauzan', tagihan: 'SPP September' },
    { id: 2, santri: 'Mhd. Iqbal', tagihan: 'SPP Agustus' },
    { id: 3, santri: 'Miftahul Jannah', tagihan: 'SPP September' },
    { id: 4, santri: 'Rizki Hanafi', tagihan: 'SPP Agustus' },
    { id: 5, santri: 'Citra Anggun', tagihan: 'SPP Oktober' },
];

const GRADE_COLOR = { A: 'success', B: 'primary', C: 'warning', D: 'error' };

function StatCard({ label, value, icon: Icon }) {
    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{value}</Typography>
                    <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
                </Box>
            </CardContent>
        </Card>
    );
}

// Panel dengan header hijau tua (dipakai Verifikasi Pembayaran)
function Panel({ title, action, children }) {
    return (
        <Card sx={{ height: '100%', borderColor: palette.emeraldDeep, overflow: 'hidden' }}>
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2.5, py: 1.5, bgcolor: palette.emeraldDeep, color: '#fff',
                }}
            >
                <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
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

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/admin/santri?q=${encodeURIComponent(q)}` : '/admin/santri');
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Ringkasan */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                <StatCard label="Total Santri" value={STATS.totalSantri} icon={PeopleIcon} />
                <StatCard label="Total Ustadz" value={STATS.totalUstadz} icon={PersonIcon} />
                <StatCard label="Kelompok Tahfidz" value={STATS.totalKelompok} icon={GroupsIcon} />
            </Box>

            {/* Cari santri */}
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
                                    <SearchIcon fontSize="small" sx={{ color: palette.shamrock }} />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { 'aria-label': 'Cari nama santri' },
                    }}
                />
            </Box>

            {/* Setoran & verifikasi */}
            <Box
                sx={{
                    display: 'grid', gap: 3, alignItems: 'start',
                    gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
                }}
            >
                {/* Setoran Hafalan Terbaru: judul dan nama kolom satu header */}
                <Card sx={{ height: '100%', borderColor: palette.emeraldDeep, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ '& .MuiTableCell-root': { bgcolor: palette.emeraldDeep } }}>
                                {/* Baris 1: judul + tombol */}
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ borderBottom: 0, pt: 1.5, pb: 0.5 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                                                Setoran Hafalan Terbaru
                                            </Typography>
                                            <Button
                                                size="small"
                                                onClick={() => navigate('/admin/hafalan')}
                                                sx={{
                                                    color: '#fff',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                                                }}
                                            >
                                                Lihat semua
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>

                                {/* Baris 2: nama kolom */}
                                <TableRow>
                                    <TableCell sx={{ color: palette.frostedMint, pt: 0.5 }}>Santri</TableCell>
                                    <TableCell sx={{ color: palette.frostedMint, pt: 0.5 }}>Surat/ayat</TableCell>
                                    <TableCell align="center" sx={{ color: palette.frostedMint, pt: 0.5 }}>
                                        Nilai
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {SETORAN_TERBARU.map((s) => (
                                    <TableRow key={s.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{s.santri}</TableCell>
                                        <TableCell>{s.surat} {s.ayat}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={s.nilai}
                                                size="small"
                                                color={GRADE_COLOR[s.nilai] ?? 'default'}
                                                sx={{ fontWeight: 700, minWidth: 36 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {SETORAN_TERBARU.length === 0 && (
                        <EmptyState>
                            Belum ada setoran hafalan. Setoran yang dicatat ustadz akan muncul di sini.
                        </EmptyState>
                    )}
                </Card>

                {/* Verifikasi Pembayaran */}
                <Panel
                    title="Verifikasi Pembayaran"
                    action={
                        <Chip
                            size="small"
                            color={VERIFIKASI.length ? 'warning' : 'default'}
                            label={`${VERIFIKASI.length} Menunggu`}
                        />
                    }
                >
                    <List disablePadding>
                        {VERIFIKASI.map((v) => (
                            <ListItemButton
                                key={v.id}
                                divider
                                onClick={() => navigate(`/admin/verifikasi?id=${v.id}`)}
                            >
                                <ListItemText
                                    primary={v.santri}
                                    secondary={v.tagihan}
                                    slotProps={{ primary: { fontWeight: 600, fontSize: 14 } }}
                                />
                                <ChevronRightIcon color="action" />
                            </ListItemButton>
                        ))}
                    </List>
                    {VERIFIKASI.length === 0 && (
                        <EmptyState>Tidak ada bukti transfer yang menunggu verifikasi.</EmptyState>
                    )}
                </Panel>
            </Box>
        </Box>
    );
}