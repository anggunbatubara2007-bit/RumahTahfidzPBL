
import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, Chip, Checkbox, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, FormControl,
    IconButton, InputAdornment, InputLabel, ListItemText, MenuItem,
    OutlinedInput, Pagination, Select, Snackbar, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField,
    Tooltip, Typography,
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
const PER_PAGE = 10;

const FORM_KOSONG = {
    nama: '',
    nip: '',
    username: '',
    password: '',
    kelompok: [],
    status: 'Aktif',
};

const buatPassword = () => {
    const huruf = 'abcdefghjkmnpqrstuvwxyz23456789';

    return Array.from(
        { length: 8 },
        () => huruf[Math.floor(Math.random() * huruf.length)]
    ).join('');
};

export default function DataUstadz() {
    const [ustadz, setUstadz] = useState([]);
    const [daftarKelompok, setDaftarKelompok] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cari, setCari] = useState('');
    const [filterKelompok, setFilterKelompok] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(null);
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [lihatPassword, setLihatPassword] = useState(false);

    const [hapus, setHapus] = useState(null);
    const [akunBaru, setAkunBaru] = useState(null);
    const [notif, setNotif] = useState('');
    const [jenisNotif, setJenisNotif] = useState('success');

    const token = localStorage.getItem('token');

    // =====================================
    // HEADER API
    // =====================================
    const getHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    });

    // =====================================
    // MEMUAT DATA DARI DATABASE
    // =====================================
    const muatData = async () => {
        try {
            setLoading(true);

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
                throw new Error(
                    hasilPengguna.message || 'Gagal mengambil data pengguna.'
                );
            }

            if (!resKelompok.ok) {
                throw new Error(
                    hasilKelompok.message || 'Gagal mengambil data kelompok.'
                );
            }

            const kelompok = hasilKelompok.data || [];
            setDaftarKelompok(kelompok);

            const dataUstadz = (hasilPengguna.data || [])
                .filter((item) => item.role === 'Ustadz')
                .map((item) => {
                    const kelompokBinaan = kelompok.filter(
                        (k) => Number(k.id_ustadz) === Number(item.id_ustadz)
                    );

                    return {
                        id: item.id_ustadz,
                        nama: item.nama_ustadz || '',
                        nip: item.nip || '',
                        username: item.username || '',
                        kelompokIds: kelompokBinaan.map(
                            (k) => Number(k.id_kelompok)
                        ),
                        kelompok: kelompokBinaan.map(
                            (k) => k.nama_kelompok
                        ),
                        status: item.status_ustadz || 'Aktif',
                    };
                });

            setUstadz(dataUstadz);
        } catch (error) {
            console.error('Gagal memuat Data Ustadz:', error);

            setJenisNotif('error');
            setNotif(error.message || 'Gagal mengambil data Ustadz.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        muatData();
    }, []);

    // =====================================
    // FILTER DAN PAGINATION
    // =====================================
    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();

        return ustadz.filter((u) => {
            const cocokCari =
                !q ||
                u.nama.toLowerCase().includes(q) ||
                u.nip.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q) ||
                u.kelompok.join(' ').toLowerCase().includes(q);

            const cocokKelompok =
                filterKelompok === 'all' ||
                (
                    filterKelompok === 'none'
                        ? u.kelompokIds.length === 0
                        : u.kelompokIds.includes(Number(filterKelompok))
                );

            return cocokCari && cocokKelompok;
        });
    }, [ustadz, cari, filterKelompok]);

    const totalHalaman = Math.max(
        1,
        Math.ceil(terfilter.length / PER_PAGE)
    );

    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = terfilter.slice(mulai, mulai + PER_PAGE);

    const ubahCari = (e) => {
        setCari(e.target.value);
        setHalaman(1);
    };

    const ubahFilterKelompok = (e) => {
        setFilterKelompok(e.target.value);
        setHalaman(1);
    };

    // =====================================
    // DIALOG TAMBAH USTADZ
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

    // =====================================
    // DIALOG UBAH USTADZ
    // =====================================
    const bukaUbah = (u) => {
        setForm({
            nama: u.nama,
            nip: u.nip,
            username: u.username,
            password: '',
            kelompok: [...u.kelompokIds],
            status: u.status,
        });

        setErrors({});
        setLihatPassword(false);
        setDialog({ mode: 'ubah', id: u.id });
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
    // SIMPAN DATA USTADZ KE DATABASE
    // =====================================
    const simpan = async (e) => {
        e.preventDefault();

        const nama = form.nama.trim();
        const nip = form.nip.trim();
        const username = form.username.trim().toLowerCase();
        const password = form.password;
        const adaPassword = password.length > 0;

        const baru = {};

        if (!nama) {
            baru.nama = 'Nama ustadz wajib diisi.';
        }

        if (!nip) {
            baru.nip = 'NIP wajib diisi.';
        } else if (!/^\d+$/.test(nip)) {
            baru.nip = 'NIP hanya boleh berisi angka.';
        } else if (
            ustadz.some((u) => u.nip === nip && u.id !== dialog.id)
        ) {
            baru.nip = 'NIP sudah dipakai ustadz lain.';
        }

        if (!username) {
            baru.username = 'Username wajib diisi.';
        } else if (!/^[a-z0-9._]{4,}$/.test(username)) {
            baru.username =
                'Minimal 4 karakter: huruf kecil, angka, titik, atau garis bawah.';
        } else if (
            username === 'admin' ||
            ustadz.some(
                (u) => u.username === username && u.id !== dialog.id
            )
        ) {
            baru.username = 'Username sudah dipakai.';
        }

        if (dialog.mode === 'tambah' && !adaPassword) {
            baru.password = 'Password wajib diisi.';
        } else if (adaPassword && password.length < 6) {
            baru.password = 'Password minimal 6 karakter.';
        }

        setErrors(baru);

        if (Object.keys(baru).length > 0) return;

        const payload = {
            nama,
            nip,
            username,
            password,
            status: form.status,
            kelompok_ids: form.kelompok,
        };

        try {
            const isTambah = dialog.mode === 'tambah';

            const url = isTambah
                ? `${API_URL}/api/pengguna/ustadz`
                : `${API_URL}/api/pengguna/ustadz/${dialog.id}`;

            const response = await fetch(url, {
                method: isTambah ? 'POST' : 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            const hasil = await response.json();

            if (!response.ok) {
                throw new Error(
                    hasil.message || 'Gagal menyimpan data Ustadz.'
                );
            }

            if (isTambah) {
                setAkunBaru({
                    nama,
                    username,
                    password,
                });
            } else {
                setJenisNotif('success');
                setNotif(hasil.message || 'Data Ustadz berhasil diperbarui.');
            }

            tutupDialog();
            await muatData();
        } catch (error) {
            setJenisNotif('error');
            setNotif(error.message || 'Gagal menyimpan data Ustadz.');
        }
    };

    // =====================================
    // MENONAKTIFKAN USTADZ
    // =====================================
    const konfirmasiHapus = async () => {
        if (!hapus) return;

        try {
            const response = await fetch(
                `${API_URL}/api/pengguna/ustadz/${hapus.id}`,
                {
                    method: 'DELETE',
                    headers: getHeaders(),
                }
            );

            const hasil = await response.json();

            if (!response.ok) {
                throw new Error(
                    hasil.message || 'Gagal menonaktifkan akun Ustadz.'
                );
            }

            setJenisNotif('success');
            setNotif(hasil.message || 'Akun Ustadz berhasil dinonaktifkan.');

            setHapus(null);
            await muatData();
        } catch (error) {
            setJenisNotif('error');
            setNotif(error.message || 'Gagal menonaktifkan akun Ustadz.');
        }
    };

    // =====================================
    // SALIN AKUN BARU
    // =====================================
    const salinAkun = async () => {
        if (!akunBaru) return;

        try {
            await navigator.clipboard.writeText(
                `Username: ${akunBaru.username}\nPassword: ${akunBaru.password}`
            );

            setJenisNotif('success');
            setNotif('Username dan password disalin.');
        } catch {
            setJenisNotif('warning');
            setNotif('Tidak bisa menyalin otomatis. Catat secara manual.');
        }
    };

    // =====================================
    // TAMPILAN
    // =====================================
    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Kelola data dan akun login ustadz Pondok Tahfidz RSQ
            </Typography>

            {/* Pencarian, filter, dan tambah */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'center',
                }}
            >
                <TextField
                    size="small"
                    placeholder="Cari nama ustadz..."
                    value={cari}
                    onChange={ubahCari}
                    sx={{
                        flex: '1 1 260px',
                        maxWidth: 360,
                        bgcolor: '#fff',
                    }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: {
                            'aria-label': 'Cari ustadz',
                        },
                    }}
                />

                <TextField
                    select
                    size="small"
                    value={filterKelompok}
                    onChange={ubahFilterKelompok}
                    sx={{ minWidth: 190, bgcolor: '#fff' }}
                    slotProps={{
                        htmlInput: {
                            'aria-label': 'Filter kelompok',
                        },
                    }}
                >
                    <MenuItem value="all">Semua Kelompok</MenuItem>

                    {daftarKelompok.map((k) => (
                        <MenuItem
                            key={k.id_kelompok}
                            value={String(k.id_kelompok)}
                        >
                            {k.nama_kelompok}
                        </MenuItem>
                    ))}

                    <MenuItem value="none">Belum ada kelompok</MenuItem>
                </TextField>

                <Box sx={{ flex: 1 }} />

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={bukaTambah}
                >
                    Tambah Ustadz
                </Button>
            </Box>

            {/* Tabel Ustadz */}
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
                                    <TableCell>
                                        {mulai + i + 1}
                                    </TableCell>

                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {u.nama}
                                    </TableCell>

                                    <TableCell>{u.username}</TableCell>

                                    <TableCell>
                                        {u.kelompok.length > 0 ? (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.5,
                                                }}
                                            >
                                                {u.kelompok.map((nama) => (
                                                    <Chip
                                                        key={nama}
                                                        label={nama}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography
                                                component="span"
                                                color="text.secondary"
                                            >
                                                Belum ada
                                            </Typography>
                                        )}
                                    </TableCell>

                                    <TableCell>{u.nip}</TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            label={u.status}
                                            size="small"
                                            color={
                                                u.status === 'Aktif'
                                                    ? 'primary'
                                                    : 'warning'
                                            }
                                            sx={{
                                                fontWeight: 600,
                                                minWidth: 64,
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell
                                        align="center"
                                        sx={{ whiteSpace: 'nowrap' }}
                                    >
                                        <Tooltip title="Ubah / reset password">
                                            <IconButton
                                                size="small"
                                                onClick={() => bukaUbah(u)}
                                                aria-label={`Ubah ${u.nama}`}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Nonaktifkan akun">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setHapus(u)}
                                                aria-label={`Nonaktifkan ${u.nama}`}
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

                {loading && (
                    <Typography
                        color="text.secondary"
                        sx={{ p: 3, textAlign: 'center' }}
                    >
                        Memuat data Ustadz...
                    </Typography>
                )}

                {!loading && terfilter.length === 0 && (
                    <Typography
                        color="text.secondary"
                        sx={{ p: 4, textAlign: 'center' }}
                    >
                        Tidak ada ustadz yang cocok. Ubah kata kunci atau
                        filter, atau tambahkan ustadz baru.
                    </Typography>
                )}
            </Card>

            {/* Keterangan dan pagination */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                }}
            >
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

            {/* Dialog tambah dan ubah */}
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
                    {dialog?.mode === 'ubah'
                        ? 'Ubah Akun Ustadz'
                        : 'Tambah Akun Ustadz'}
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: 'grid',
                        gap: 2,
                        pt: '8px !important',
                    }}
                >
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
                        helperText={
                            errors.nip || 'Nomor induk pegawai, harus unik.'
                        }
                        slotProps={{
                            htmlInput: {
                                inputMode: 'numeric',
                            },
                        }}
                        fullWidth
                    />

                    <TextField
                        label="Username login"
                        name="username"
                        value={form.username}
                        onChange={ubahForm}
                        error={Boolean(errors.username)}
                        helperText={
                            errors.username ||
                            'Dipakai ustadz untuk masuk. Contoh: ustadz05'
                        }
                        slotProps={{
                            htmlInput: {
                                autoCapitalize: 'none',
                                autoComplete: 'off',
                            },
                        }}
                        fullWidth
                    />

                    <TextField
                        label={
                            dialog?.mode === 'ubah'
                                ? 'Password baru'
                                : 'Password'
                        }
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
                            htmlInput: {
                                autoComplete: 'new-password',
                            },
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
                                            onClick={() =>
                                                setLihatPassword((v) => !v)
                                            }
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

                    {/* PILIH BEBERAPA KELOMPOK */}
                    <FormControl fullWidth>
                        <InputLabel id="kelompok-ustadz-label">
                            Kelompok dibina
                        </InputLabel>

                        <Select
                            labelId="kelompok-ustadz-label"
                            multiple
                            name="kelompok"
                            value={form.kelompok}
                            onChange={ubahForm}
                            input={
                                <OutlinedInput label="Kelompok dibina" />
                            }
                            renderValue={(selected) => (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 0.5,
                                    }}
                                >
                                    {selected.map((id) => {
                                        const kelompok = daftarKelompok.find(
                                            (k) =>
                                                Number(k.id_kelompok) ===
                                                Number(id)
                                        );

                                        return (
                                            <Chip
                                                key={id}
                                                label={
                                                    kelompok?.nama_kelompok ||
                                                    id
                                                }
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                            disabled={daftarKelompok.length === 0}
                        >
                            {daftarKelompok.map((k) => {
                                const sudahDibinaUstadzLain =
                                    k.id_ustadz !== null &&
                                    Number(k.id_ustadz) !==
                                        Number(dialog?.id);

                                return (
                                    <MenuItem
                                        key={k.id_kelompok}
                                        value={Number(k.id_kelompok)}
                                        disabled={sudahDibinaUstadzLain}
                                    >
                                        <Checkbox
                                            checked={form.kelompok.includes(
                                                Number(k.id_kelompok)
                                            )}
                                        />

                                        <ListItemText
                                            primary={k.nama_kelompok}
                                            secondary={
                                                sudahDibinaUstadzLain
                                                    ? `Dibina oleh ${k.nama_pembimbing || 'Ustadz lain'}`
                                                    : 'Belum ditugaskan / dibina oleh Ustadz ini'
                                            }
                                        />
                                    </MenuItem>
                                );
                            })}
                        </Select>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.75, ml: 1.75 }}
                        >
                            {daftarKelompok.length === 0
                                ? 'Belum ada kelompok tahfidz. Buat akun Ustadz terlebih dahulu, kemudian tambahkan kelompok melalui menu Kelompok Tahfidz.'
                                : 'Kamu dapat memilih lebih dari satu kelompok. Kelompok yang sudah dibina Ustadz lain tidak dapat dipilih.'}
                        </Typography>
                    </FormControl>

                    <TextField
                        select
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={ubahForm}
                        fullWidth
                    >
                        <MenuItem value="Aktif">Aktif</MenuItem>
                        <MenuItem value="Cuti">Cuti</MenuItem>
                    </TextField>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={tutupDialog}>
                        Batal
                    </Button>

                    <Button type="submit" variant="contained">
                        {dialog?.mode === 'ubah'
                            ? 'Simpan'
                            : 'Buat Akun'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog akun baru */}
            <Dialog
                open={Boolean(akunBaru)}
                onClose={() => setAkunBaru(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Akun ustadz berhasil dibuat
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Berikan data ini kepada{' '}
                        <strong>{akunBaru?.nama}</strong>. Password tidak
                        akan ditampilkan lagi setelah jendela ini ditutup.
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
                        <Box>
                            Username: <strong>{akunBaru?.username}</strong>
                        </Box>

                        <Box>
                            Password: <strong>{akunBaru?.password}</strong>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        startIcon={<ContentCopy />}
                        onClick={salinAkun}
                    >
                        Salin
                    </Button>

                    <Button
                        variant="contained"
                        onClick={() => setAkunBaru(null)}
                    >
                        Selesai
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog konfirmasi nonaktif */}
            <Dialog
                open={Boolean(hapus)}
                onClose={() => setHapus(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Nonaktifkan akun Ustadz?
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Akun <strong>{hapus?.nama}</strong> (NIP{' '}
                        {hapus?.nip}) akan diubah statusnya menjadi Cuti.
                        Ustadz tetap dapat login untuk melihat data dan
                        riwayat, tetapi tidak dapat melakukan perubahan
                        data baru.
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setHapus(null)}>
                        Batal
                    </Button>

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
                autoHideDuration={3500}
                onClose={() => setNotif('')}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <Alert
                    severity={jenisNotif}
                    onClose={() => setNotif('')}
                    variant="filled"
                >
                    {notif}
                </Alert>
            </Snackbar>
        </Box>
    );
}
