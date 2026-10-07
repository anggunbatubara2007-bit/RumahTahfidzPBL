import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Chip, InputAdornment, List, ListItemButton,
    ListItemText, Table, TableBody, TableCell, TableHead, TableRow,
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

function Panel({ title, action, children }) {
    return (
        <Card sx={{ height: '100%', borderColor: palette.frostedMint }}>
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2.5, py: 1.5, bgcolor: palette.frostedMint,
                }}
            >
                <Typography variant="h6" sx={{ fontSize: 17 }}>{title}</Typography>
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
                    placeholder="Cari santri..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{ bgcolor: '#fff', '& fieldset': { borderRadius: 6 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                        ),
                    }}
                    inputProps={{ 'aria-label': 'Cari santri' }}
                />
            </Box>

            {/* Setoran & verifikasi */}
            <Box
                sx={{
                    display: 'grid', gap: 3, alignItems: 'start',
                    gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
                }}
            >
                <Panel
                    title="Setoran Hafalan Terbaru"
                    action={<Button size="small" onClick={() => navigate('/admin/hafalan')}>Lihat semua</Button>}
                >
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Santri</TableCell>
                                    <TableCell>Surat/ayat</TableCell>
                                    <TableCell align="center">Nilai</TableCell>
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
                    </Box>
                    {SETORAN_TERBARU.length === 0 && (
                        <EmptyState>
                            Belum ada setoran hafalan. Setoran yang dicatat ustadz akan muncul di sini.
                        </EmptyState>
                    )}
                </Panel>

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
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
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