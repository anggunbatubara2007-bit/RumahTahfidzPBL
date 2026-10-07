import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { palette } from '../../theme/theme';

// TODO: ganti data dummy ini dengan data dari API backend.
// Pembimbing mengikuti kelompok (FR-04), jadi tidak diisi manual di form santri.
const KELOMPOK = [
    { nama: 'Al-Fatih', pembimbing: 'Ust. Haliman' },
    { nama: 'Al-Nur', pembimbing: 'Ust. Nur' },
    { nama: 'Al-Hikmah', pembimbing: 'Ust. Hasan' },
    { nama: 'An-Naba', pembimbing: 'Ust. Fatih' },
];

const STATUS = ['Aktif', 'Non-Aktif'];
const PER_PAGE = 5;

// beasiswa: true = penerima. Diisi otomatis oleh sistem dari capaian bulanan (FR-07),
// jadi tidak bisa diubah dari form ini.
const DATA_AWAL = [
    { id: 1, nama: 'Ahmad Iam', nis: '2024001', kelompok: 'Al-Fatih', beasiswa: true, status: 'Aktif' },
    { id: 2, nama: 'Mhd. Iqbal', nis: '2024002', kelompok: 'Al-Nur', beasiswa: false, status: 'Non-Aktif' },
    { id: 3, nama: 'Miftahul Jannah', nis: '2024003', kelompok: 'Al-Fatih', beasiswa: true, status: 'Aktif' },
    { id: 4, nama: 'Rizki Hanafi', nis: '2024004', kelompok: 'Al-Nur', beasiswa: true, status: 'Non-Aktif' },
    { id: 5, nama: 'Ahmad Rizki', nis: '2024005', kelompok: 'Al-Fatih', beasiswa: false, status: 'Aktif' },
    { id: 6, nama: 'Citra Anggun', nis: '2024006', kelompok: 'Al-Hikmah', beasiswa: true, status: 'Aktif' },
    { id: 7, nama: 'Tesa Damayanti', nis: '2024007', kelompok: 'An-Naba', beasiswa: false, status: 'Aktif' },
    { id: 8, nama: 'Fauzan Ahmad', nis: '2024008', kelompok: 'Al-Hikmah', beasiswa: false, status: 'Aktif' },
    { id: 9, nama: 'Nur Aisyah', nis: '2024009', kelompok: 'An-Naba', beasiswa: true, status: 'Aktif' },
    { id: 10, nama: 'Dimas Pratama', nis: '2024010', kelompok: 'Al-Nur', beasiswa: false, status: 'Aktif' },
    { id: 11, nama: 'Salsabila', nis: '2024011', kelompok: 'Al-Fatih', beasiswa: false, status: 'Non-Aktif' },
    { id: 12, nama: 'Habib Ramadhan', nis: '2024012', kelompok: 'Al-Hikmah', beasiswa: true, status: 'Aktif' },
];

const FORM_KOSONG = { nama: '', nis: '', kelompok: '', status: 'Aktif' };

const pembimbingDari = (kelompok) =>
    KELOMPOK.find((k) => k.nama === kelompok)?.pembimbing ?? '-';

export default function DataSantri() {
    const [searchParams] = useSearchParams();

    const [santri, setSantri] = useState(DATA_AWAL);
    const [cari, setCari] = useState(searchParams.get('q') ?? ''); // dari kolom cari di dashboard
    const [filterKelompok, setFilterKelompok] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(null); // { mode: 'tambah' | 'ubah', id? }
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [hapus, setHapus] = useState(null); // santri yang akan dihapus
    const [notif, setNotif] = useState('');

    // ---------- Filter & halaman ----------
    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return santri.filter(
            (s) =>
                (!q || s.nama.toLowerCase().includes(q) || s.nis.includes(q)) &&
                (filterKelompok === 'all' || s.kelompok === filterKelompok) &&
                (filterStatus === 'all' || s.status === filterStatus)
        );
    }, [santri, cari, filterKelompok, filterStatus]);

    const totalHalaman = Math.max(1, Math.ceil(terfilter.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = terfilter.slice(mulai, mulai + PER_PAGE);

    const ubahFilter = (setter) => (e) => {
        setter(e.target.value);
        setHalaman(1);
    };

    // ---------- Form tambah / ubah ----------
    const bukaTambah = () => {
        setForm(FORM_KOSONG);
        setErrors({});
        setDialog({ mode: 'tambah' });
    };

    const bukaUbah = (s) => {
        setForm({ nama: s.nama, nis: s.nis, kelompok: s.kelompok, status: s.status });
        setErrors({});
        setDialog({ mode: 'ubah', id: s.id });
    };

    const tutupDialog = () => setDialog(null);

    const ubahForm = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const simpan = (e) => {
        e.preventDefault();

        const nama = form.nama.trim();
        const nis = form.nis.trim();
        const baru = {};

        if (!nama) baru.nama = 'Nama santri wajib diisi.';

        if (!nis) {
            baru.nis = 'NIS wajib diisi.';
        } else if (!/^\d+$/.test(nis)) {
            baru.nis = 'NIS hanya boleh berisi angka.';
        } else if (santri.some((s) => s.nis === nis && s.id !== dialog.id)) {
            baru.nis = 'NIS sudah dipakai santri lain.'; // NIS harus unik (FR-02)
        }

        if (!form.kelompok) baru.kelompok = 'Pilih kelompok tahfidz.';

        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        if (dialog.mode === 'tambah') {
            setSantri((prev) => [
                ...prev,
                { id: Date.now(), nama, nis, kelompok: form.kelompok, status: form.status, beasiswa: false },
            ]);
            setNotif(`${nama} berhasil ditambahkan.`);
        } else {
            setSantri((prev) =>
                prev.map((s) =>
                    s.id === dialog.id ? { ...s, nama, nis, kelompok: form.kelompok, status: form.status } : s
                )
            );
            setNotif(`Data ${nama} berhasil diubah.`);
        }
        tutupDialog();
    };

    // ---------- Hapus ----------
    const konfirmasiHapus = () => {
        setSantri((prev) => prev.filter((s) => s.id !== hapus.id));
        setNotif(`${hapus.nama} berhasil dihapus.`);
        setHapus(null);
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Kelola data santri Pondok Tahfidz RSQ
            </Typography>

            {/* Pencarian, filter, tombol tambah */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Cari nama santri atau NIS..."
                    value={cari}
                    onChange={ubahFilter(setCari)}
                    sx={{ flex: '1 1 260px', maxWidth: 360, bgcolor: '#fff' }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { 'aria-label': 'Cari santri' },
                    }}
                />

                <TextField
                    select
                    size="small"
                    value={filterKelompok}
                    onChange={ubahFilter(setFilterKelompok)}
                    sx={{ minWidth: 170, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter kelompok' } }}
                >
                    <MenuItem value="all">Semua Kelompok</MenuItem>
                    {KELOMPOK.map((k) => (
                        <MenuItem key={k.nama} value={k.nama}>{k.nama}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    size="small"
                    value={filterStatus}
                    onChange={ubahFilter(setFilterStatus)}
                    sx={{ minWidth: 150, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter status' } }}
                >
                    <MenuItem value="all">Semua Status</MenuItem>
                    {STATUS.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                </TextField>

                <Box sx={{ flex: 1 }} />

                <Button variant="contained" startIcon={<AddIcon />} onClick={bukaTambah}>
                    Tambah Santri
                </Button>
            </Box>

            {/* Tabel */}
            <Card>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: palette.frostedMint }}>
                                <TableCell>No</TableCell>
                                <TableCell>Nama Santri</TableCell>
                                <TableCell>NIS</TableCell>
                                <TableCell>Kelompok</TableCell>
                                <TableCell>Pembimbing</TableCell>
                                <TableCell align="center">Beasiswa</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((s, i) => (
                                <TableRow key={s.id} hover>
                                    <TableCell>{mulai + i + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{s.nama}</TableCell>
                                    <TableCell>{s.nis}</TableCell>
                                    <TableCell>{s.kelompok}</TableCell>
                                    <TableCell>{pembimbingDari(s.kelompok)}</TableCell>
                                    <TableCell align="center">
                                        {s.beasiswa ? (
                                            <Chip label="Penerima" size="small" color="success" variant="outlined" />
                                        ) : (
                                            <Typography color="text.secondary">–</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={s.status}
                                            size="small"
                                            color={s.status === 'Aktif' ? 'primary' : 'default'}
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                        <Tooltip title="Ubah">
                                            <IconButton size="small" onClick={() => bukaUbah(s)} aria-label={`Ubah ${s.nama}`}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Hapus">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setHapus(s)}
                                                aria-label={`Hapus ${s.nama}`}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {terfilter.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        Tidak ada santri yang cocok. Ubah kata kunci atau filter, atau tambahkan santri baru.
                    </Typography>
                )}
            </Card>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {terfilter.length === 0
                        ? 'Menampilkan 0 santri'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${terfilter.length} santri`}
                </Typography>

                <Box>
                    <IconButton
                        onClick={() => setHalaman(halamanAman - 1)}
                        disabled={halamanAman <= 1}
                        aria-label="Halaman sebelumnya"
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => setHalaman(halamanAman + 1)}
                        disabled={halamanAman >= totalHalaman}
                        aria-label="Halaman berikutnya"
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Dialog tambah / ubah */}
            <Dialog
                open={Boolean(dialog)}
                onClose={tutupDialog}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpan, noValidate: true } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {dialog?.mode === 'ubah' ? 'Ubah Data Santri' : 'Tambah Santri'}
                </DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        label="Nama santri"
                        name="nama"
                        value={form.nama}
                        onChange={ubahForm}
                        error={Boolean(errors.nama)}
                        helperText={errors.nama}
                        autoFocus
                        fullWidth
                    />
                    <TextField
                        label="NIS"
                        name="nis"
                        value={form.nis}
                        onChange={ubahForm}
                        error={Boolean(errors.nis)}
                        helperText={errors.nis || 'Nomor induk santri, harus unik.'}
                        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Kelompok tahfidz"
                        name="kelompok"
                        value={form.kelompok}
                        onChange={ubahForm}
                        error={Boolean(errors.kelompok)}
                        helperText={
                            errors.kelompok ||
                            (form.kelompok ? `Pembimbing: ${pembimbingDari(form.kelompok)}` : ' ')
                        }
                        fullWidth
                    >
                        {KELOMPOK.map((k) => (
                            <MenuItem key={k.nama} value={k.nama}>{k.nama}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={ubahForm}
                        fullWidth
                    >
                        {STATUS.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={tutupDialog}>Batal</Button>
                    <Button type="submit" variant="contained">Simpan</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={Boolean(hapus)} onClose={() => setHapus(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus santri?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Data <strong>{hapus?.nama}</strong> (NIS {hapus?.nis}) akan dihapus dan tidak bisa
                        dikembalikan.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setHapus(null)}>Batal</Button>
                    <Button color="error" variant="contained" onClick={konfirmasiHapus}>
                        Hapus
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Pemberitahuan */}
            <Snackbar
                open={Boolean(notif)}
                autoHideDuration={3000}
                onClose={() => setNotif('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setNotif('')} variant="filled">
                    {notif}
                </Alert>
            </Snackbar>
        </Box>
    );
}