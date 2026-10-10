import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Pagination,
    Snackbar, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockReset from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Autorenew from '@mui/icons-material/Autorenew';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { useAuth } from '../auth';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
// PENTING: password disimpan polos hanya untuk dummy frontend.
// Di backend, password wajib di-hash dan tidak boleh dikirim kembali ke browser.
const K_ADMIN = 'akunAdmin';
const K_USTADZ = 'dataUstadz'; // dikelola di halaman Data Ustadz
const K_SANTRI = 'akunSantri';

const ADMIN_AWAL = [
    { id: 1, username: 'admin', nama: 'Admin RSQ', password: 'admin123', aktif: true },
];

// Sama dengan data awal di halaman Data Ustadz
const USTADZ_AWAL = [
    { id: 1, nama: 'Ust. Hilman', nip: '011', username: 'ustadz01', password: 'ustadz123', kelompok: 'Al-Fatih', status: 'Aktif' },
    { id: 2, nama: 'Ust. Nur', nip: '012', username: 'ustadz02', password: 'ustadz123', kelompok: 'Al-Nur', status: 'Aktif' },
    { id: 3, nama: 'Ust. Fatih', nip: '013', username: 'ustadz03', password: 'ustadz123', kelompok: 'An-Naba', status: 'Cuti' },
    { id: 4, nama: 'Ust. Hasan', nip: '014', username: 'ustadz04', password: 'ustadz123', kelompok: '', status: 'Aktif' },
];

const SANTRI_AWAL = [
    { id: 1, nis: '2024001', nama: 'Ahmad Fauzan', password: 'santri123', aktif: true },
];

const ROLE_LABEL = { admin: 'Admin', ustadz: 'Ustadz', santri: 'Santri' };
const PER_PAGE = 10;

const muat = (kunci, awal) => {
    try {
        const saved = JSON.parse(localStorage.getItem(kunci));
        if (Array.isArray(saved)) return saved;
    } catch {
        /* data rusak: pakai data awal */
    }
    return awal;
};

const simpanKe = (kunci, data) => {
    try {
        localStorage.setItem(kunci, JSON.stringify(data));
    } catch {
        /* penyimpanan penuh atau diblokir: abaikan */
    }
};

const buatPassword = () => {
    const huruf = 'abcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 8 }, () => huruf[Math.floor(Math.random() * huruf.length)]).join('');
};

const FORM_KOSONG = { role: 'santri', nama: '', identifier: '', password: '' };

// Kolom password dengan tombol "buat acak" dan "tampilkan"
function PasswordField({ label, value, onChange, error, helperText, lihat, setLihat, onAcak }) {
    return (
        <TextField
            label={label}
            name="password"
            type={lihat ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            error={Boolean(error)}
            helperText={error || helperText}
            fullWidth
            slotProps={{
                htmlInput: { autoComplete: 'new-password' },
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <Tooltip title="Buat password acak">
                                <IconButton size="small" aria-label="Buat password acak" onClick={onAcak}>
                                    <Autorenew fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <IconButton
                                size="small"
                                edge="end"
                                onClick={() => setLihat((v) => !v)}
                                aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {lihat ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}

export default function AkunPengguna() {
    const { user } = useAuth();

    const [admins, setAdmins] = useState(() => muat(K_ADMIN, ADMIN_AWAL));
    const [ustadzList, setUstadzList] = useState(() => muat(K_USTADZ, USTADZ_AWAL));
    const [santriList, setSantriList] = useState(() => muat(K_SANTRI, SANTRI_AWAL));

    const [cari, setCari] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [dialogTambah, setDialogTambah] = useState(false);
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [lihat, setLihat] = useState(false);

    const [reset, setReset] = useState(null); // akun yang password-nya direset
    const [passwordBaru, setPasswordBaru] = useState('');
    const [errorReset, setErrorReset] = useState('');

    const [hapus, setHapus] = useState(null);
    const [kredensial, setKredensial] = useState(null); // { judul, nama, label, identifier, password }
    const [notif, setNotif] = useState('');

    // Simpan setiap perubahan agar halaman Login membaca akun terbaru
    useEffect(() => simpanKe(K_ADMIN, admins), [admins]);
    useEffect(() => simpanKe(K_USTADZ, ustadzList), [ustadzList]);
    useEffect(() => simpanKe(K_SANTRI, santriList), [santriList]);

    // ---------- Gabungan semua akun ----------
    const semua = useMemo(
        () => [
            ...admins.map((a) => ({
                key: `admin-${a.id}`, role: 'admin', ref: a.id, nama: a.nama,
                identifier: a.username, aktif: a.aktif !== false,
            })),
            ...ustadzList.map((u) => ({
                key: `ustadz-${u.id}`, role: 'ustadz', ref: u.id, nama: u.nama,
                identifier: u.username, aktif: u.akunAktif !== false,
            })),
            ...santriList.map((s) => ({
                key: `santri-${s.id}`, role: 'santri', ref: s.id, nama: s.nama,
                identifier: s.nis, aktif: s.aktif !== false,
            })),
        ],
        [admins, ustadzList, santriList]
    );

    const ringkasan = useMemo(
        () => ({
            total: semua.length,
            ustadz: semua.filter((a) => a.role === 'ustadz').length,
            santri: semua.filter((a) => a.role === 'santri').length,
            nonaktif: semua.filter((a) => !a.aktif).length,
        }),
        [semua]
    );

    // ---------- Filter & halaman ----------
    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return semua.filter(
            (a) =>
                (!q || a.nama.toLowerCase().includes(q) || a.identifier.toLowerCase().includes(q)) &&
                (filterRole === 'all' || a.role === filterRole) &&
                (filterStatus === 'all' || (filterStatus === 'aktif' ? a.aktif : !a.aktif))
        );
    }, [semua, cari, filterRole, filterStatus]);

    const totalHalaman = Math.max(1, Math.ceil(terfilter.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = terfilter.slice(mulai, mulai + PER_PAGE);

    const ubahFilter = (setter) => (e) => {
        setter(e.target.value);
        setHalaman(1);
    };

    // Akun admin yang sedang dipakai tidak boleh dinonaktifkan atau dihapus
    const diriSendiri = (a) => a.role === 'admin' && a.identifier === user?.username;

    // ---------- Ubah data akun ----------
    const perbarui = (akun, perubahan) => {
        const ubah = (daftar) => daftar.map((x) => (x.id === akun.ref ? { ...x, ...perubahan } : x));
        if (akun.role === 'admin') setAdmins(ubah);
        else if (akun.role === 'ustadz') setUstadzList(ubah);
        else setSantriList(ubah);
    };

    const ubahStatus = (akun, aktif) => {
        perbarui(akun, akun.role === 'ustadz' ? { akunAktif: aktif } : { aktif });
        setNotif(`Akun ${akun.nama} ${aktif ? 'diaktifkan' : 'dinonaktifkan'}.`);
    };

    // ---------- Tambah akun ----------
    const bukaTambah = () => {
        setForm({ ...FORM_KOSONG, password: buatPassword() });
        setErrors({});
        setLihat(true);
        setDialogTambah(true);
    };

    const ubahForm = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'role' ? { identifier: '' } : {}), // ganti role: kosongkan username/NIS
        }));
        setErrors((prev) => ({ ...prev, [name]: '', ...(name === 'role' ? { identifier: '' } : {}) }));
    };

    const simpanAkun = (e) => {
        e.preventDefault();

        const nama = form.nama.trim();
        const identifier = form.identifier.trim().toLowerCase();
        const baru = {};
        const adminBaru = form.role === 'admin';

        if (!nama) baru.nama = 'Nama wajib diisi.';

        if (!identifier) {
            baru.identifier = adminBaru ? 'Username wajib diisi.' : 'NIS wajib diisi.';
        } else if (adminBaru) {
            const dipakai =
                admins.some((a) => a.username === identifier) ||
                ustadzList.some((u) => u.username === identifier);
            if (!/^[a-z0-9._]{4,}$/.test(identifier)) {
                baru.identifier = 'Minimal 4 karakter: huruf kecil, angka, titik, atau garis bawah.';
            } else if (dipakai) {
                baru.identifier = 'Username sudah dipakai.';
            }
        } else if (!/^\d+$/.test(identifier)) {
            baru.identifier = 'NIS hanya boleh berisi angka.';
        } else if (santriList.some((s) => s.nis === identifier)) {
            baru.identifier = 'NIS sudah punya akun.';
        }

        if (form.password.length < 6) baru.password = 'Password minimal 6 karakter.';

        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        if (adminBaru) {
            setAdmins((prev) => [
                ...prev,
                { id: Date.now(), username: identifier, nama, password: form.password, aktif: true },
            ]);
        } else {
            setSantriList((prev) => [
                ...prev,
                { id: Date.now(), nis: identifier, nama, password: form.password, aktif: true },
            ]);
        }

        setKredensial({
            judul: 'Akun berhasil dibuat',
            nama,
            label: adminBaru ? 'Username' : 'NIS',
            identifier,
            password: form.password,
        });
        setDialogTambah(false);
    };

    // ---------- Reset password ----------
    const bukaReset = (akun) => {
        setReset(akun);
        setPasswordBaru(buatPassword());
        setErrorReset('');
        setLihat(true);
    };

    const simpanReset = (e) => {
        e.preventDefault();
        if (passwordBaru.length < 6) {
            setErrorReset('Password minimal 6 karakter.');
            return;
        }
        perbarui(reset, { password: passwordBaru });
        setKredensial({
            judul: 'Password berhasil direset',
            nama: reset.nama,
            label: reset.role === 'santri' ? 'NIS' : 'Username',
            identifier: reset.identifier,
            password: passwordBaru,
        });
        setReset(null);
    };

    // ---------- Hapus ----------
    const konfirmasiHapus = () => {
        const akun = hapus;
        if (akun.role === 'admin') setAdmins((prev) => prev.filter((x) => x.id !== akun.ref));
        else setSantriList((prev) => prev.filter((x) => x.id !== akun.ref));
        setNotif(`Akun ${akun.nama} berhasil dihapus.`);
        setHapus(null);
    };

    const salin = async () => {
        try {
            await navigator.clipboard.writeText(
                `${kredensial.label}: ${kredensial.identifier}\nPassword: ${kredensial.password}`
            );
            setNotif('Data login disalin.');
        } catch {
            setNotif('Tidak bisa menyalin otomatis. Catat secara manual.');
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Kelola akun login admin, ustadz, dan santri. Akun ustadz dibuat di menu Data Ustadz.
            </Typography>

            {/* Ringkasan */}
            <Box
                sx={{
                    display: 'grid', gap: 2,
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                }}
            >
                {[
                    ['Total akun', ringkasan.total],
                    ['Akun ustadz', ringkasan.ustadz],
                    ['Akun santri', ringkasan.santri],
                    ['Dinonaktifkan', ringkasan.nonaktif],
                ].map(([label, nilai]) => (
                    <Card
                        key={label}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 3, borderColor: palette.aquamarine }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: palette.pineTeal }}>
                            {label}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: palette.pineTeal, mt: 0.5 }}>
                            {nilai}
                        </Typography>
                    </Card>
                ))}
            </Box>

            {/* Pencarian, filter, tombol tambah */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Cari nama, username, atau NIS..."
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
                        htmlInput: { 'aria-label': 'Cari akun' },
                    }}
                />

                <TextField
                    select
                    size="small"
                    value={filterRole}
                    onChange={ubahFilter(setFilterRole)}
                    sx={{ minWidth: 150, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter role' } }}
                >
                    <MenuItem value="all">Semua Role</MenuItem>
                    {Object.entries(ROLE_LABEL).map(([nilai, label]) => (
                        <MenuItem key={nilai} value={nilai}>{label}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    size="small"
                    value={filterStatus}
                    onChange={ubahFilter(setFilterStatus)}
                    sx={{ minWidth: 150, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter status akun' } }}
                >
                    <MenuItem value="all">Semua Status</MenuItem>
                    <MenuItem value="aktif">Aktif</MenuItem>
                    <MenuItem value="nonaktif">Nonaktif</MenuItem>
                </TextField>

                <Box sx={{ flex: 1 }} />

                <Button variant="contained" startIcon={<AddIcon />} onClick={bukaTambah}>
                    Tambah Akun
                </Button>
            </Box>

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>Nama</TableCell>
                                <TableCell>Username / NIS</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((a, i) => {
                                const sendiri = diriSendiri(a);
                                return (
                                    <TableRow key={a.key} hover>
                                        <TableCell>{mulai + i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {a.nama}
                                            {sendiri && (
                                                <Chip label="Anda" size="small" sx={{ ml: 1, height: 20 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>{a.identifier}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ROLE_LABEL[a.role]}
                                                size="small"
                                                sx={{
                                                    bgcolor: palette.frostedMint,
                                                    color: palette.pineTeal,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={a.aktif ? 'Aktif' : 'Nonaktif'}
                                                size="small"
                                                color={a.aktif ? 'primary' : 'default'}
                                                sx={{ fontWeight: 600, minWidth: 74 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                            <Tooltip title="Reset password">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => bukaReset(a)}
                                                    aria-label={`Reset password ${a.nama}`}
                                                >
                                                    <LockReset fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip
                                                title={
                                                    sendiri
                                                        ? 'Akun yang sedang dipakai tidak bisa dinonaktifkan'
                                                        : a.aktif ? 'Nonaktifkan akun' : 'Aktifkan akun'
                                                }
                                            >
                                                <span>
                                                    <Switch
                                                        size="small"
                                                        checked={a.aktif}
                                                        disabled={sendiri}
                                                        onChange={(e) => ubahStatus(a, e.target.checked)}
                                                        slotProps={{
                                                            input: { 'aria-label': `Akun ${a.nama} aktif` },
                                                        }}
                                                    />
                                                </span>
                                            </Tooltip>

                                            <Tooltip
                                                title={
                                                    a.role === 'ustadz'
                                                        ? 'Hapus akun ustadz lewat menu Data Ustadz'
                                                        : sendiri
                                                            ? 'Akun yang sedang dipakai tidak bisa dihapus'
                                                            : 'Hapus'
                                                }
                                            >
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={a.role === 'ustadz' || sendiri}
                                                        onClick={() => setHapus(a)}
                                                        aria-label={`Hapus ${a.nama}`}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {terfilter.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        Tidak ada akun yang cocok. Ubah kata kunci atau filter, atau tambahkan akun baru.
                    </Typography>
                )}
            </Card>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {terfilter.length === 0
                        ? 'Menampilkan 0 akun'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${terfilter.length} akun`}
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

            {/* Dialog tambah akun */}
            <Dialog
                open={dialogTambah}
                onClose={() => setDialogTambah(false)}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpanAkun, noValidate: true } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Tambah Akun</DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        select
                        label="Role"
                        name="role"
                        value={form.role}
                        onChange={ubahForm}
                        helperText="Akun ustadz dibuat di menu Data Ustadz karena butuh NIP dan kelompok."
                        fullWidth
                    >
                        <MenuItem value="santri">Santri</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </TextField>

                    <TextField
                        label="Nama"
                        name="nama"
                        value={form.nama}
                        onChange={ubahForm}
                        error={Boolean(errors.nama)}
                        helperText={errors.nama}
                        autoFocus
                        fullWidth
                    />

                    <TextField
                        label={form.role === 'admin' ? 'Username' : 'NIS'}
                        name="identifier"
                        value={form.identifier}
                        onChange={ubahForm}
                        error={Boolean(errors.identifier)}
                        helperText={
                            errors.identifier ||
                            (form.role === 'admin'
                                ? 'Dipakai untuk masuk. Contoh: admin2'
                                : 'Santri masuk memakai NIS, harus unik.')
                        }
                        slotProps={{
                            htmlInput: {
                                inputMode: form.role === 'santri' ? 'numeric' : 'text',
                                autoCapitalize: 'none',
                                autoComplete: 'off',
                            },
                        }}
                        fullWidth
                    />

                    <PasswordField
                        label="Password"
                        value={form.password}
                        onChange={ubahForm}
                        error={errors.password}
                        helperText="Minimal 6 karakter. Berikan ke pemilik akun setelah dibuat."
                        lihat={lihat}
                        setLihat={setLihat}
                        onAcak={() => {
                            setForm((prev) => ({ ...prev, password: buatPassword() }));
                            setErrors((prev) => ({ ...prev, password: '' }));
                            setLihat(true);
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogTambah(false)}>Batal</Button>
                    <Button type="submit" variant="contained">Buat Akun</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog reset password */}
            <Dialog
                open={Boolean(reset)}
                onClose={() => setReset(null)}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpanReset, noValidate: true } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Reset password</DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <DialogContentText>
                        Buat password baru untuk <strong>{reset?.nama}</strong>. Password lama tidak bisa
                        dipakai lagi.
                    </DialogContentText>

                    <PasswordField
                        label="Password baru"
                        value={passwordBaru}
                        onChange={(e) => {
                            setPasswordBaru(e.target.value);
                            setErrorReset('');
                        }}
                        error={errorReset}
                        helperText="Minimal 6 karakter."
                        lihat={lihat}
                        setLihat={setLihat}
                        onAcak={() => {
                            setPasswordBaru(buatPassword());
                            setErrorReset('');
                            setLihat(true);
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setReset(null)}>Batal</Button>
                    <Button type="submit" variant="contained">Reset Password</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog data login (password hanya tampil sekali) */}
            <Dialog open={Boolean(kredensial)} onClose={() => setKredensial(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{kredensial?.judul}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Berikan data ini kepada <strong>{kredensial?.nama}</strong>. Password tidak akan
                        ditampilkan lagi setelah jendela ini ditutup.
                    </DialogContentText>
                    <Box
                        sx={{
                            p: 2, borderRadius: 2, bgcolor: palette.honeydew,
                            border: `1px solid ${palette.aquamarine}`, fontFamily: 'monospace',
                            display: 'grid', gap: 0.5,
                        }}
                    >
                        <Box>{kredensial?.label}: <strong>{kredensial?.identifier}</strong></Box>
                        <Box>Password: <strong>{kredensial?.password}</strong></Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button startIcon={<ContentCopy />} onClick={salin}>Salin</Button>
                    <Button variant="contained" onClick={() => setKredensial(null)}>Selesai</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={Boolean(hapus)} onClose={() => setHapus(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus akun?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Akun <strong>{hapus?.nama}</strong> ({hapus?.identifier}) akan dihapus dan tidak bisa
                        dikembalikan. Kalau hanya ingin menahan akses sementara, nonaktifkan saja akunnya.
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