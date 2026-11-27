
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STATUS = ['Aktif', 'Tidak Aktif'];
const PER_PAGE = 10;

const FORM_KOSONG = {
    nama: '',
    nis: '',
    kelompok: '',
    status: 'Aktif',
    password: '',
};

const buatPassword = () => {
    const huruf = 'abcdefghjkmnpqrstuvwxyz23456789';
    return Array.from(
        { length: 8 },
        () => huruf[Math.floor(Math.random() * huruf.length)]
    ).join('');
};

export default function DataSantri() {
    const [searchParams] = useSearchParams();

    const [santri, setSantri] = useState([]);
    const [kelompok, setKelompok] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cari, setCari] = useState(searchParams.get('q') ?? '');
    const [filterKelompok, setFilterKelompok] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(null);
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [lihatPassword, setLihatPassword] = useState(false);
    const [hapus, setHapus] = useState(null);
    const [akunBaru, setAkunBaru] = useState(null);
    const [notif, setNotif] = useState('');
    const [errorApi, setErrorApi] = useState('');

    const token = localStorage.getItem('token');

    // =====================================
    // HEADER AUTENTIKASI
    // =====================================
    const getHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    });

    // =====================================
    // MENGAMBIL DATA DARI BACKEND
    // =====================================
    const muatData = async () => {
        try {
            setLoading(true);
            setErrorApi('');

            if (!token) {
                throw new Error('Token login tidak ditemukan. Silakan login kembali.');
            }

            const [resPengguna, resKelompok] = await Promise.all([
                fetch(`${API_URL}/api/pengguna`, {
                    headers: getHeaders(),
                }),
                fetch(`${API_URL}/api/pengguna/kelompok`, {
                    headers: getHeaders(),
                }),
            ]);

            const hasilPengguna = await resPengguna.json();
            const hasilKelompok = await resKelompok.json();

            if (!resPengguna.ok) {
                throw new Error(hasilPengguna.message || 'Gagal mengambil data Santri.');
            }

            if (!resKelompok.ok) {
                throw new Error(hasilKelompok.message || 'Gagal mengambil kelompok.');
            }

            const daftarSantri = (hasilPengguna.data || [])
                .filter((item) => item.role === 'Santri')
                .map((item) => ({
                    id: item.id_santri,
                    nama: item.nama_santri,
                    nis: item.nis_santri || item.nis_pengguna,
                    id_kelompok: item.id_kelompok,
                    kelompok: item.nama_kelompok || '-',
                    pembimbing: item.nama_pembimbing || '-',
                    beasiswa: item.status_beasiswa === 'Tercapai',
                    status: item.status_santri,
                }));

            setSantri(daftarSantri);
            setKelompok(hasilKelompok.data || []);
        } catch (error) {
            console.error('Gagal memuat data Santri:', error);
            setErrorApi(error.message || 'Gagal menghubungkan ke server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        muatData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pembimbingDari = (idKelompok) => {
        const item = kelompok.find(
            (k) => String(k.id_kelompok) === String(idKelompok)
        );

        return item?.nama_pembimbing || '-';
    };

    // =====================================
    // FILTER DAN PAGINATION
    // =====================================
    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();

        return santri.filter(
            (s) =>
                (!q ||
                    (s.nama || '').toLowerCase().includes(q) ||
                    String(s.nis || '').includes(q)) &&
                (filterKelompok === 'all' ||
                    String(s.id_kelompok) === String(filterKelompok)) &&
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

    // =====================================
    // DIALOG TAMBAH DAN EDIT
    // =====================================
    const bukaTambah = () => {
        setForm({
            ...FORM_KOSONG,
            password: buatPassword(),
        });
        setErrors({});
        setLihatPassword(true);
        setDialog({ mode: 'tambah' });
    };

    const bukaUbah = (s) => {
        setForm({
            nama: s.nama,
            nis: String(s.nis),
            kelompok: s.id_kelompok ? String(s.id_kelompok) : '',
            status: s.status,
            password: '',
        });

        setErrors({});
        setLihatPassword(false);
        setDialog({ mode: 'ubah', id: s.id });
    };

    const tutupDialog = () => {
        setDialog(null);
        setErrors({});
    };

    const ubahForm = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    // =====================================
    // SIMPAN DATA SANTRI
    // =====================================
    const simpan = async (e) => {
        e.preventDefault();

        const nama = form.nama.trim();
        const nis = form.nis.trim();
        const password = form.password;
        const adaPassword = password.length > 0;

        const baru = {};

        if (!nama) {
            baru.nama = 'Nama santri wajib diisi.';
        }

        if (!nis) {
            baru.nis = 'NIS wajib diisi.';
        } else if (!/^\d+$/.test(nis)) {
            baru.nis = 'NIS hanya boleh berisi angka.';
        }

        if (!form.kelompok) {
            baru.kelompok = 'Pilih kelompok tahfidz.';
        }

        if (dialog?.mode === 'tambah' && !adaPassword) {
            baru.password = 'Password wajib diisi.';
        } else if (adaPassword && password.length < 6) {
            baru.password = 'Password minimal 6 karakter.';
        }

        setErrors(baru);

        if (Object.keys(baru).length > 0) return;

        const payload = {
            nama,
            nis,
            id_kelompok: Number(form.kelompok),
            status: form.status,
        };

        if (adaPassword) {
            payload.password = password;
        }

        try {
            const url =
                dialog.mode === 'tambah'
                    ? `${API_URL}/api/pengguna/santri`
                    : `${API_URL}/api/pengguna/santri/${dialog.id}`;

            const response = await fetch(url, {
                method: dialog.mode === 'tambah' ? 'POST' : 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            const hasil = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setErrors((prev) => ({
                        ...prev,
                        nis: hasil.message || 'NIS sudah digunakan.',
                    }));
                    return;
                }

                throw new Error(hasil.message || 'Gagal menyimpan data Santri.');
            }

            if (dialog.mode === 'tambah') {
                setAkunBaru({
                    nama,
                    nis,
                    password,
                });
            } else {
                setNotif(
                    adaPassword
                        ? `Data dan password ${nama} berhasil diubah.`
                        : `Data ${nama} berhasil diubah.`
                );
            }

            tutupDialog();
            await muatData();
        } catch (error) {
            console.error(error);
            setNotif(error.message || 'Gagal menyimpan data.');
        }
    };

    // =====================================
    // MENONAKTIFKAN AKUN SANTRI
    // =====================================
    const konfirmasiHapus = async () => {
        if (!hapus) return;

        try {
            const response = await fetch(
                `${API_URL}/api/pengguna/santri/${hapus.id}`,
                {
                    method: 'DELETE',
                    headers: getHeaders(),
                }
            );

            const hasil = await response.json();

            if (!response.ok) {
                throw new Error(
                    hasil.message || 'Gagal menonaktifkan akun Santri.'
                );
            }

            setNotif(`Akun ${hapus.nama} berhasil dinonaktifkan.`);
            setHapus(null);

            await muatData();
        } catch (error) {
            console.error(error);
            setNotif(error.message || 'Gagal menonaktifkan akun.');
        }
    };

    // =====================================
    // SALIN AKUN BARU
    // =====================================
    const salinAkun = async () => {
        try {
            await navigator.clipboard.writeText(
                `NIS: ${akunBaru.nis}\nPassword: ${akunBaru.password}`
            );

            setNotif('NIS dan password disalin.');
        } catch {
            setNotif('Tidak bisa menyalin otomatis. Catat secara manual.');
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Kelola data dan akun login santri Pondok Tahfidz RSQ
            </Typography>

            {errorApi && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={muatData}>
                            Coba Lagi
                        </Button>
                    }
                >
                    {errorApi}
                </Alert>
            )}

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
                    {kelompok.map((k) => (
                        <MenuItem
                            key={k.id_kelompok}
                            value={String(k.id_kelompok)}
                        >
                            {k.nama_kelompok}
                        </MenuItem>
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

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={bukaTambah}
                    disabled={loading || kelompok.length === 0}
                >
                    Tambah Santri
                </Button>
            </Box>

            {kelompok.length === 0 && !loading && (
                <Alert severity="warning">
                    Belum ada kelompok tahfidz. Tambahkan kelompok terlebih dahulu sebelum membuat akun Santri.
                </Alert>
            )}

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
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
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        Memuat data Santri...
                                    </TableCell>
                                </TableRow>
                            ) : tampil.map((s, i) => (
                                <TableRow key={s.id} hover>
                                    <TableCell>{mulai + i + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {s.nama}
                                    </TableCell>
                                    <TableCell>{s.nis}</TableCell>
                                    <TableCell>{s.kelompok}</TableCell>
                                    <TableCell>{s.pembimbing}</TableCell>
                                    <TableCell align="center">
                                        {s.beasiswa ? (
                                            <Chip
                                                label="Penerima"
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
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
                                        <Tooltip title="Ubah / reset password">
                                            <IconButton
                                                size="small"
                                                onClick={() => bukaUbah(s)}
                                                aria-label={`Ubah ${s.nama}`}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title={
                                            s.status === 'Tidak Aktif'
                                                ? 'Akun sudah tidak aktif'
                                                : 'Nonaktifkan akun'
                                        }>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    disabled={s.status === 'Tidak Aktif'}
                                                    onClick={() => setHapus(s)}
                                                    aria-label={`Nonaktifkan ${s.nama}`}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!loading && terfilter.length === 0 && (
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

            {/* Dialog tambah / ubah */}
            <Dialog
                open={Boolean(dialog)}
                onClose={tutupDialog}
                fullWidth
                maxWidth="xs"
                slotProps={{
                    paper: {
                        component: 'form',
                        onSubmit: simpan,
                        noValidate: true,
                    },
                }}
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
                        helperText={
                            errors.nis ||
                            'Nomor induk santri, harus unik. Dipakai santri untuk masuk.'
                        }
                        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
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
                                : 'Minimal 6 karakter. Berikan ke santri setelah akun dibuat.')
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
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        password: buatPassword(),
                                                    }));
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        password: '',
                                                    }));
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
                                            aria-label={
                                                lihatPassword
                                                    ? 'Sembunyikan password'
                                                    : 'Tampilkan password'
                                            }
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
                        label="Kelompok tahfidz"
                        name="kelompok"
                        value={form.kelompok}
                        onChange={ubahForm}
                        error={Boolean(errors.kelompok)}
                        helperText={
                            errors.kelompok ||
                            (form.kelompok
                                ? `Pembimbing: ${pembimbingDari(form.kelompok)}`
                                : ' ')
                        }
                        fullWidth
                    >
                        {kelompok.map((k) => (
                            <MenuItem
                                key={k.id_kelompok}
                                value={String(k.id_kelompok)}
                            >
                                {k.nama_kelompok}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={ubahForm}
                        helperText="Santri Tidak Aktif tetap dapat login untuk melihat data dan riwayat."
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

            {/* Dialog akun berhasil dibuat */}
            <Dialog
                open={Boolean(akunBaru)}
                onClose={() => setAkunBaru(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Akun santri berhasil dibuat
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Berikan data ini kepada <strong>{akunBaru?.nama}</strong>.
                        Password tidak akan ditampilkan lagi setelah jendela ini ditutup.
                    </DialogContentText>

                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: palette.honeydew,
                            border: `1px solid ${palette.aquamarine}`,
                            fontFamily: 'monospace',
                            display: 'grid',
                            gap: 0.5,
                        }}
                    >
                        <Box>NIS: <strong>{akunBaru?.nis}</strong></Box>
                        <Box>Password: <strong>{akunBaru?.password}</strong></Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button startIcon={<ContentCopy />} onClick={salinAkun}>
                        Salin
                    </Button>
                    <Button variant="contained" onClick={() => setAkunBaru(null)}>
                        Selesai
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog konfirmasi menonaktifkan akun */}
            <Dialog
                open={Boolean(hapus)}
                onClose={() => setHapus(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Nonaktifkan akun Santri?
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Akun <strong>{hapus?.nama}</strong> (NIS {hapus?.nis})
                        akan diubah menjadi Tidak Aktif. Data, riwayat hafalan,
                        dan riwayat pembayaran tetap tersimpan.
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setHapus(null)}>Batal</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={konfirmasiHapus}
                    >
                        Nonaktifkan
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifikasi */}
            <Snackbar
                open={Boolean(notif)}
                autoHideDuration={3000}
                onClose={() => setNotif('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="success"
                    onClose={() => setNotif('')}
                    variant="filled"
                >
                    {notif}
                </Alert>
            </Snackbar>
        </Box>
    );
}
