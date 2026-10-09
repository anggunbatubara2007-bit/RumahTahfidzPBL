import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Pagination,
    Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Autorenew from '@mui/icons-material/Autorenew';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
// PENTING: password disimpan polos hanya untuk dummy frontend.
// Di backend, password wajib di-hash dan tidak boleh dikirim kembali ke browser.
const KUNCI = 'dataUstadz';

// Kelompok dikelola di halaman Kelompok Tahfidz (FR-04); di sini hanya dipilih.
const KUNCI_KELOMPOK = 'dataKelompok';
const KELOMPOK_DEFAULT = ['Al-Fatih', 'Al-Nur', 'Ar-Rahman', 'Al-Ikhlas', 'Al-Falah', 'An-Naba'];

const muatNamaKelompok = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI_KELOMPOK));
        if (Array.isArray(saved)) return saved.map((k) => k.nama);
    } catch {
        /* data rusak: pakai daftar bawaan */
    }
    return KELOMPOK_DEFAULT;
};

const STATUS = ['Aktif', 'Cuti'];
const PER_PAGE = 10;

const DATA_AWAL = [
    { id: 1, nama: 'Ust. Hilman', nip: '011', username: 'ustadz01', password: 'ustadz123', kelompok: 'Al-Fatih', status: 'Aktif' },
    { id: 2, nama: 'Ust. Nur', nip: '012', username: 'ustadz02', password: 'ustadz123', kelompok: 'Al-Nur', status: 'Aktif' },
    { id: 3, nama: 'Ust. Fatih', nip: '013', username: 'ustadz03', password: 'ustadz123', kelompok: 'An-Naba', status: 'Cuti' },
    { id: 4, nama: 'Ust. Hasan', nip: '014', username: 'ustadz04', password: 'ustadz123', kelompok: '', status: 'Aktif' },
];

const FORM_KOSONG = { nama: '', nip: '', username: '', password: '', kelompok: '', status: 'Aktif' };

const muatData = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI));
        if (Array.isArray(saved)) return saved;
    } catch {
        /* data rusak: pakai data awal */
    }
    return DATA_AWAL;
};

const buatPassword = () => {
    const huruf = 'abcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 8 }, () => huruf[Math.floor(Math.random() * huruf.length)]).join('');
};

export default function DataUstadz() {
    const [ustadz, setUstadz] = useState(muatData);
    const daftarKelompok = useMemo(muatNamaKelompok, []);
    const [cari, setCari] = useState('');
    const [filterKelompok, setFilterKelompok] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(null); // { mode: 'tambah' | 'ubah', id? }
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [lihatPassword, setLihatPassword] = useState(false);
    const [hapus, setHapus] = useState(null);
    const [akunBaru, setAkunBaru] = useState(null); // { nama, username, password }
    const [notif, setNotif] = useState('');

    // Simpan setiap perubahan agar halaman Login bisa membaca akun terbaru
    useEffect(() => {
        try {
            localStorage.setItem(KUNCI, JSON.stringify(ustadz));
        } catch {
            /* penyimpanan penuh atau diblokir: abaikan */
        }
    }, [ustadz]);

    // Pilihan kelompok di form: semua kelompok + kelompok ustadz yang sedang diubah
    const pilihanKelompok = useMemo(() => {
        const set = new Set(daftarKelompok);
        if (form.kelompok) set.add(form.kelompok);
        return [...set];
    }, [daftarKelompok, form.kelompok]);

    // ---------- Filter & halaman ----------
    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return ustadz.filter(
            (u) =>
                (!q ||
                    u.nama.toLowerCase().includes(q) ||
                    u.nip.includes(q) ||
                    u.username.includes(q)) &&
                (filterKelompok === 'all' ||
                    (filterKelompok === 'none' ? !u.kelompok : u.kelompok === filterKelompok))
        );
    }, [ustadz, cari, filterKelompok]);

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
        setForm({ ...FORM_KOSONG, password: buatPassword() });
        setErrors({});
        setLihatPassword(true); // password awal ditampilkan agar admin bisa mencatatnya
        setDialog({ mode: 'tambah' });
    };

    const bukaUbah = (u) => {
        setForm({
            nama: u.nama, nip: u.nip, username: u.username,
            password: '', kelompok: u.kelompok, status: u.status,
        });
        setErrors({});
        setLihatPassword(false);
        setDialog({ mode: 'ubah', id: u.id });
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
        const nip = form.nip.trim();
        const username = form.username.trim().toLowerCase();
        const password = form.password;
        const adaPassword = password.length > 0;
        const baru = {};

        if (!nama) baru.nama = 'Nama ustadz wajib diisi.';

        if (!nip) {
            baru.nip = 'NIP wajib diisi.';
        } else if (!/^\d+$/.test(nip)) {
            baru.nip = 'NIP hanya boleh berisi angka.';
        } else if (ustadz.some((u) => u.nip === nip && u.id !== dialog.id)) {
            baru.nip = 'NIP sudah dipakai ustadz lain.';
        }

        if (!username) {
            baru.username = 'Username wajib diisi.';
        } else if (!/^[a-z0-9._]{4,}$/.test(username)) {
            baru.username = 'Minimal 4 karakter: huruf kecil, angka, titik, atau garis bawah.';
        } else if (username === 'admin' || ustadz.some((u) => u.username === username && u.id !== dialog.id)) {
            baru.username = 'Username sudah dipakai.';
        }

        if (dialog.mode === 'tambah' && !adaPassword) {
            baru.password = 'Password wajib diisi.';
        } else if (adaPassword && password.length < 6) {
            baru.password = 'Password minimal 6 karakter.';
        }

        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        if (dialog.mode === 'tambah') {
            setUstadz((prev) => [
                ...prev,
                { id: Date.now(), nama, nip, username, password, kelompok: form.kelompok, status: form.status },
            ]);
            setAkunBaru({ nama, username, password });
        } else {
            setUstadz((prev) =>
                prev.map((u) =>
                    u.id === dialog.id
                        ? {
                            ...u, nama, nip, username,
                            password: adaPassword ? password : u.password,
                            kelompok: form.kelompok, status: form.status,
                        }
                        : u
                )
            );
            setNotif(
                adaPassword
                    ? `Data dan password ${nama} berhasil diubah.`
                    : `Data ${nama} berhasil diubah.`
            );
        }
        tutupDialog();
    };

    // ---------- Hapus ----------
    const konfirmasiHapus = () => {
        setUstadz((prev) => prev.filter((u) => u.id !== hapus.id));
        setNotif(`Akun ${hapus.nama} berhasil dihapus.`);
        setHapus(null);
    };

    const salinAkun = async () => {
        try {
            await navigator.clipboard.writeText(
                `Username: ${akunBaru.username}\nPassword: ${akunBaru.password}`
            );
            setNotif('Username dan password disalin.');
        } catch {
            setNotif('Tidak bisa menyalin otomatis. Catat secara manual.');
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Kelola data dan akun login ustadz Pondok Tahfidz RSQ
            </Typography>

            {/* Pencarian, filter, tombol tambah */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Cari nama ustadz..."
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
                        htmlInput: { 'aria-label': 'Cari ustadz' },
                    }}
                />

                <TextField
                    select
                    size="small"
                    value={filterKelompok}
                    onChange={ubahFilter(setFilterKelompok)}
                    sx={{ minWidth: 190, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter kelompok' } }}
                >
                    <MenuItem value="all">Semua Kelompok</MenuItem>
                    {daftarKelompok.map((k) => (
                        <MenuItem key={k} value={k}>{k}</MenuItem>
                    ))}
                    <MenuItem value="none">Belum ada kelompok</MenuItem>
                </TextField>

                <Box sx={{ flex: 1 }} />

                <Button variant="contained" startIcon={<AddIcon />} onClick={bukaTambah}>
                    Tambah Ustadz
                </Button>
            </Box>

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>Nama Ustadz</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Kelompok Dibina</TableCell>
                                <TableCell>NIP</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((u, i) => (
                                <TableRow key={u.id} hover>
                                    <TableCell>{mulai + i + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{u.nama}</TableCell>
                                    <TableCell>{u.username}</TableCell>
                                    <TableCell>
                                        {u.kelompok || (
                                            <Typography component="span" color="text.secondary">
                                                Belum ada
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{u.nip}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={u.status}
                                            size="small"
                                            color={u.status === 'Aktif' ? 'primary' : 'warning'}
                                            sx={{ fontWeight: 600, minWidth: 64 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                        <Tooltip title="Ubah / reset password">
                                            <IconButton size="small" onClick={() => bukaUbah(u)} aria-label={`Ubah ${u.nama}`}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Hapus">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setHapus(u)}
                                                aria-label={`Hapus ${u.nama}`}
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
                        Tidak ada ustadz yang cocok. Ubah kata kunci atau filter, atau tambahkan ustadz baru.
                    </Typography>
                )}
            </Card>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {terfilter.length === 0
                        ? 'Menampilkan 0 ustadz'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${terfilter.length} ustadz`}
                </Typography>

                <Pagination
                    count={totalHalaman}
                    page={halamanAman}
                    onChange={(_, nomor) => setHalaman(nomor)}
                    variant="outlined"
                    shape="rounded"
                    sx={{
                        '& .MuiPaginationItem-root': {
                            borderColor: palette.pineTeal,
                            color: palette.pineTeal,
                            fontWeight: 600,
                            borderRadius: 2,
                        },
                        '& .MuiPaginationItem-root.Mui-selected': {
                            bgcolor: palette.frostedMint,
                            borderColor: palette.pineTeal,
                        },
                    }}
                />
            </Box>

            {/* Dialog tambah / ubah akun */}
            <Dialog
                open={Boolean(dialog)}
                onClose={tutupDialog}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpan, noValidate: true } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {dialog?.mode === 'ubah' ? 'Ubah Akun Ustadz' : 'Tambah Akun Ustadz'}
                </DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        label="Nama ustadz"
                        name="nama"
                        value={form.nama}
                        onChange={ubahForm}
                        error={Boolean(errors.nama)}
                        helperText={errors.nama}
                        autoFocus
                        fullWidth
                    />
                    <TextField
                        label="NIP"
                        name="nip"
                        value={form.nip}
                        onChange={ubahForm}
                        error={Boolean(errors.nip)}
                        helperText={errors.nip || 'Nomor induk pegawai, harus unik.'}
                        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                        fullWidth
                    />
                    <TextField
                        label="Username login"
                        name="username"
                        value={form.username}
                        onChange={ubahForm}
                        error={Boolean(errors.username)}
                        helperText={errors.username || 'Dipakai ustadz untuk masuk. Contoh: ustadz05'}
                        slotProps={{ htmlInput: { autoCapitalize: 'none', autoComplete: 'off' } }}
                        fullWidth
                    />
                    <TextField
                        label={dialog?.mode === 'ubah' ? 'Password baru' : 'Password'}
                        name="password"
                        type={lihatPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={ubahForm}
                        error={Boolean(errors.password)}
                        helperText={
                            errors.password ||
                            (dialog?.mode === 'ubah'
                                ? 'Kosongkan jika password tidak diubah.'
                                : 'Minimal 6 karakter. Berikan ke ustadz setelah akun dibuat.')
                        }
                        slotProps={{
                            htmlInput: { autoComplete: 'new-password' },
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Buat password acak">
                                            <IconButton
                                                size="small"
                                                aria-label="Buat password acak"
                                                onClick={() => {
                                                    setForm((prev) => ({ ...prev, password: buatPassword() }));
                                                    setErrors((prev) => ({ ...prev, password: '' }));
                                                    setLihatPassword(true);
                                                }}
                                            >
                                                <Autorenew fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton
                                            size="small"
                                            edge="end"
                                            onClick={() => setLihatPassword((v) => !v)}
                                            aria-label={lihatPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                        >
                                            {lihatPassword ? (
                                                <VisibilityOff fontSize="small" />
                                            ) : (
                                                <Visibility fontSize="small" />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Kelompok dibina"
                        name="kelompok"
                        value={form.kelompok}
                        onChange={ubahForm}
                        helperText="Pembagian kelompok juga bisa diatur di menu Kelompok Tahfidz."
                        fullWidth
                    >
                        <MenuItem value="">Belum ada kelompok</MenuItem>
                        {pilihanKelompok.map((k) => (
                            <MenuItem key={k} value={k}>{k}</MenuItem>
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
                    <Button type="submit" variant="contained">
                        {dialog?.mode === 'ubah' ? 'Simpan' : 'Buat Akun'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: akun berhasil dibuat (password hanya tampil sekali) */}
            <Dialog open={Boolean(akunBaru)} onClose={() => setAkunBaru(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Akun ustadz berhasil dibuat</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Berikan data ini kepada <strong>{akunBaru?.nama}</strong>. Password tidak akan
                        ditampilkan lagi setelah jendela ini ditutup.
                    </DialogContentText>
                    <Box
                        sx={{
                            p: 2, borderRadius: 2, bgcolor: palette.honeydew,
                            border: `1px solid ${palette.aquamarine}`, fontFamily: 'monospace',
                            display: 'grid', gap: 0.5,
                        }}
                    >
                        <Box>Username: <strong>{akunBaru?.username}</strong></Box>
                        <Box>Password: <strong>{akunBaru?.password}</strong></Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button startIcon={<ContentCopy />} onClick={salinAkun}>Salin</Button>
                    <Button variant="contained" onClick={() => setAkunBaru(null)}>Selesai</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={Boolean(hapus)} onClose={() => setHapus(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus akun ustadz?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Data dan akun login <strong>{hapus?.nama}</strong> (NIP {hapus?.nip}) akan dihapus dan
                        tidak bisa dikembalikan.
                        {hapus?.kelompok && ` Kelompok ${hapus.kelompok} akan kehilangan pembina.`}
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