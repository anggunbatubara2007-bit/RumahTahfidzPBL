
import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, FormHelperText, IconButton, MenuItem,
    Snackbar, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { palette } from '../../theme/theme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

const OPSI_JAM = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, '0')
);

const OPSI_MENIT = Array.from({ length: 12 }, (_, i) =>
    String(i * 5).padStart(2, '0')
);

const FORM_KOSONG = {
    nama: '',
    id_ustadz: '',
    hari: [],
    jamMulai: '07:00',
    jamSelesai: '08:30',
};

const urutHari = (daftar = []) =>
    [...daftar].sort((a, b) => HARI.indexOf(a) - HARI.indexOf(b));

const titik = (jam) => String(jam || '').slice(0, 5).replace(':', '.');

const formatJadwal = (k) =>
    `${urutHari(k.hari).join(', ')} · ${titik(k.jamMulai)}–${titik(k.jamSelesai)} WIB`;

const formatWaktu = (value) => {
    if (!value) return '07:00';
    return String(value).slice(0, 5);
};

function JamField({ label, value, onChange, error, helperText }) {
    const [jam, menit] = value.split(':');
    const opsiMenit = OPSI_MENIT.includes(menit)
        ? OPSI_MENIT
        : [...OPSI_MENIT, menit].sort();

    const menuProps = {
        slotProps: {
            paper: { style: { maxHeight: 240 } },
        },
    };

    return (
        <Box>
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    mb: 0.75,
                    color: error ? 'error.main' : 'text.primary',
                }}
            >
                {label}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                    select
                    size="small"
                    value={jam}
                    onChange={(e) => onChange(`${e.target.value}:${menit}`)}
                    error={Boolean(error)}
                    sx={{ flex: 1 }}
                    slotProps={{
                        select: { MenuProps: menuProps },
                        htmlInput: { 'aria-label': `${label}, jam` },
                    }}
                >
                    {OPSI_JAM.map((j) => (
                        <MenuItem key={j} value={j}>{j}</MenuItem>
                    ))}
                </TextField>

                <Typography sx={{ fontWeight: 700 }}>:</Typography>

                <TextField
                    select
                    size="small"
                    value={menit}
                    onChange={(e) => onChange(`${jam}:${e.target.value}`)}
                    error={Boolean(error)}
                    sx={{ flex: 1 }}
                    slotProps={{
                        select: { MenuProps: menuProps },
                        htmlInput: { 'aria-label': `${label}, menit` },
                    }}
                >
                    {opsiMenit.map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                </TextField>

                <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: palette.turfGreen }}
                >
                    WIB
                </Typography>
            </Box>

            {helperText && (
                <FormHelperText error={Boolean(error)}>
                    {helperText}
                </FormHelperText>
            )}
        </Box>
    );
}

export default function KelompokTahfidz() {
    const [kelompok, setKelompok] = useState([]);
    const [daftarUstadz, setDaftarUstadz] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialog, setDialog] = useState(null);
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [hapus, setHapus] = useState(null);
    const [notif, setNotif] = useState('');
    const [errorNotif, setErrorNotif] = useState('');

    const token = localStorage.getItem('token');

    const headers = useMemo(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }), [token]);

    const tampilkanError = (pesan) => {
        setErrorNotif(pesan || 'Terjadi kesalahan.');
    };

    // Memuat kelompok dan daftar Ustadz dari database.
    const muatData = async () => {
        setLoading(true);

        try {
            const [resKelompok, resPengguna] = await Promise.all([
                fetch(`${API_URL}/api/kelompok`, { headers }),
                fetch(`${API_URL}/api/pengguna`, { headers }),
            ]);

            const dataKelompok = await resKelompok.json();
            const dataPengguna = await resPengguna.json();

            if (!resKelompok.ok) {
                throw new Error(dataKelompok.message || 'Gagal memuat kelompok.');
            }

            if (!resPengguna.ok) {
                throw new Error(dataPengguna.message || 'Gagal memuat Ustadz.');
            }

            const daftarKelompok = Array.isArray(dataKelompok)
                ? dataKelompok
                : dataKelompok.data || [];

            const daftarPengguna = Array.isArray(dataPengguna)
                ? dataPengguna
                : dataPengguna.data || [];

            setKelompok(daftarKelompok.map((k) => ({
                id: Number(k.id_kelompok),
                nama: k.nama_kelompok,
                id_ustadz: k.id_ustadz ? Number(k.id_ustadz) : '',
                pembina: k.nama_pembina || 'Belum ada pembina',
                hari: k.hari_setoran
                    ? k.hari_setoran.split(',').map((h) => h.trim())
                    : [],
                jamMulai: formatWaktu(k.jam_mulai),
                jamSelesai: formatWaktu(k.jam_selesai),
                jumlahSantri: Number(k.jumlah_santri || 0),
                rerata: k.rerata == null ? null : Number(k.rerata),
            })));

            // Menggunakan nama kolom yang benar sesuai respons API /api/pengguna.
            const ustadzAktif = daftarPengguna
                .filter((u) =>
                    u.role === 'Ustadz' &&
                    u.status_ustadz === 'Aktif'
                )
                .map((u) => ({
                    id: Number(u.id_ustadz),
                    nama: u.nama_ustadz,
                }))
                .filter((u) => u.id && u.nama);

            setDaftarUstadz(ustadzAktif);

        } catch (error) {
            tampilkanError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        muatData();
    }, []);

    const pilihanPembina = useMemo(() => {
        const hasil = [...daftarUstadz];

        if (
            form.id_ustadz &&
            !hasil.some((u) => u.id === Number(form.id_ustadz))
        ) {
            const kelompokLama = kelompok.find(
                (k) => k.id_ustadz === Number(form.id_ustadz)
            );

            if (kelompokLama) {
                hasil.push({
                    id: kelompokLama.id_ustadz,
                    nama: kelompokLama.pembina,
                });
            }
        }

        return hasil;
    }, [daftarUstadz, form.id_ustadz, kelompok]);

    const bukaTambah = () => {
        setForm(FORM_KOSONG);
        setErrors({});
        setDialog({ mode: 'tambah' });
    };

    const bukaUbah = (k) => {
        setForm({
            nama: k.nama,
            id_ustadz: k.id_ustadz,
            hari: k.hari,
            jamMulai: k.jamMulai,
            jamSelesai: k.jamSelesai,
        });

        setErrors({});
        setDialog({ mode: 'ubah', id: k.id });
    };

    const tutupDialog = () => setDialog(null);

    const ubahForm = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const ubahJam = (nama) => (nilai) => {
        setForm((prev) => ({ ...prev, [nama]: nilai }));
        setErrors((prev) => ({
            ...prev,
            jamMulai: '',
            jamSelesai: '',
        }));
    };

    const simpan = async (e) => {
        e.preventDefault();

        const nama = form.nama.trim();
        const baru = {};

        if (!nama) {
            baru.nama = 'Nama kelompok wajib diisi.';
        }

        if (!form.id_ustadz) {
            baru.id_ustadz = 'Pilih pembina kelompok.';
        }

        if (form.hari.length === 0) {
            baru.hari = 'Pilih minimal satu hari setoran.';
        }

        if (form.jamSelesai <= form.jamMulai) {
            baru.jamSelesai = 'Jam selesai harus setelah jam mulai.';
        }

        setErrors(baru);

        if (Object.keys(baru).length > 0) return;

        const payload = {
            nama_kelompok: nama,
            id_ustadz: Number(form.id_ustadz),
            hari_setoran: urutHari(form.hari).join(', '),
            jam_mulai: form.jamMulai,
            jam_selesai: form.jamSelesai,
        };

        try {
            const url = dialog.mode === 'tambah'
                ? `${API_URL}/api/kelompok`
                : `${API_URL}/api/kelompok/${dialog.id}`;

            const response = await fetch(url, {
                method: dialog.mode === 'tambah' ? 'POST' : 'PUT',
                headers,
                body: JSON.stringify(payload),
            });

            const hasil = await response.json();

            if (!response.ok) {
                throw new Error(hasil.message || 'Gagal menyimpan kelompok.');
            }

            setNotif(hasil.message || 'Data kelompok berhasil disimpan.');
            tutupDialog();
            await muatData();
        } catch (error) {
            tampilkanError(error.message);
        }
    };

    const konfirmasiHapus = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/kelompok/${hapus.id}`,
                {
                    method: 'DELETE',
                    headers,
                }
            );

            const hasil = await response.json();

            if (!response.ok) {
                throw new Error(hasil.message || 'Gagal menghapus kelompok.');
            }

            setNotif(hasil.message || 'Kelompok berhasil dihapus.');
            setHapus(null);
            await muatData();
        } catch (error) {
            setHapus(null);
            tampilkanError(error.message);
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Typography color="text.secondary">
                    {kelompok.length} kelompok aktif
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={bukaTambah}
                >
                    Tambah Kelompok
                </Button>
            </Box>

            {loading && (
                <Typography color="text.secondary">
                    Memuat data kelompok...
                </Typography>
            )}

            {!loading && (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    }}
                >
                    {kelompok.map((k) => (
                        <Card
                            key={k.id}
                            sx={{
                                bgcolor: palette.frostedMint,
                                borderColor: palette.aquamarine,
                                borderRadius: 4,
                            }}
                        >
                            <CardContent sx={{ display: 'grid', gap: 1.25 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 700,
                                            color: palette.pineTeal,
                                        }}
                                    >
                                        {k.nama}
                                    </Typography>

                                    <Box sx={{ mt: -0.5, mr: -1, whiteSpace: 'nowrap' }}>
                                        <Tooltip title="Ubah">
                                            <IconButton
                                                size="small"
                                                onClick={() => bukaUbah(k)}
                                                aria-label={`Ubah ${k.nama}`}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Hapus">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setHapus(k)}
                                                aria-label={`Hapus ${k.nama}`}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                <Typography variant="body2">
                                    Pembina: <strong>{k.pembina}</strong>
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        color: palette.turfGreen,
                                    }}
                                >
                                    <ScheduleIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="body2">
                                        {formatJadwal(k)}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mt: 1,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <GroupsIcon sx={{ color: palette.pineTeal }} />
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {k.jumlahSantri} santri
                                        </Typography>
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={
                                            k.rerata == null
                                                ? 'Rerata –'
                                                : `Rerata ${k.rerata}%`
                                        }
                                        sx={{
                                            bgcolor: '#fff',
                                            fontWeight: 700,
                                            color: palette.pineTeal,
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    ))}

                    <Card
                        sx={{
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            borderColor: palette.shamrock,
                            borderRadius: 4,
                            bgcolor: 'transparent',
                        }}
                    >
                        <CardActionArea
                            onClick={bukaTambah}
                            sx={{
                                height: '100%',
                                minHeight: 150,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: palette.turfGreen,
                            }}
                        >
                            <AddIcon />
                            <Typography sx={{ fontWeight: 600 }}>
                                Tambah Kelompok Baru
                            </Typography>
                        </CardActionArea>
                    </Card>
                </Box>
            )}

            {!loading && kelompok.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                    Belum ada kelompok tahfidz. Klik "Tambah Kelompok" untuk membuat yang pertama.
                </Typography>
            )}

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
                    {dialog?.mode === 'ubah' ? 'Ubah Kelompok' : 'Tambah Kelompok'}
                </DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        label="Nama kelompok"
                        name="nama"
                        value={form.nama}
                        onChange={ubahForm}
                        error={Boolean(errors.nama)}
                        helperText={errors.nama || 'Contoh: Al-Fatih'}
                        autoFocus
                        fullWidth
                    />

                    <TextField
                        select
                        label="Pembina"
                        name="id_ustadz"
                        value={form.id_ustadz}
                        onChange={ubahForm}
                        error={Boolean(errors.id_ustadz)}
                        helperText={
                            errors.id_ustadz ||
                            (daftarUstadz.length > 0
                                ? 'Dipilih dari Ustadz berstatus Aktif.'
                                : 'Belum ada Ustadz berstatus Aktif.')
                        }
                        fullWidth
                    >
                        {pilihanPembina.length > 0 ? (
                            pilihanPembina.map((u) => (
                                <MenuItem key={u.id} value={u.id}>
                                    {u.nama}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled value="">
                                Tidak ada Ustadz aktif
                            </MenuItem>
                        )}
                    </TextField>

                    <TextField
                        select
                        label="Hari setoran"
                        name="hari"
                        value={form.hari}
                        onChange={ubahForm}
                        error={Boolean(errors.hari)}
                        helperText={errors.hari || 'Boleh memilih lebih dari satu hari.'}
                        slotProps={{
                            select: {
                                multiple: true,
                                renderValue: (selected) => urutHari(selected).join(', '),
                            },
                        }}
                        fullWidth
                    >
                        {HARI.map((h) => (
                            <MenuItem key={h} value={h}>
                                {h}
                            </MenuItem>
                        ))}
                    </TextField>

                    <JamField
                        label="Jam mulai"
                        value={form.jamMulai}
                        onChange={ubahJam('jamMulai')}
                        error={errors.jamMulai}
                        helperText={errors.jamMulai}
                    />

                    <JamField
                        label="Jam selesai"
                        value={form.jamSelesai}
                        onChange={ubahJam('jamSelesai')}
                        error={errors.jamSelesai}
                        helperText={errors.jamSelesai || 'Format 24 jam, Waktu Indonesia Barat (WIB).'}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={tutupDialog}>Batal</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={daftarUstadz.length === 0 && dialog?.mode === 'tambah'}
                    >
                        {dialog?.mode === 'ubah' ? 'Simpan' : 'Tambah'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(hapus)}
                onClose={() => setHapus(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Hapus kelompok?
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Kelompok <strong>{hapus?.nama}</strong> akan dihapus.
                        {hapus?.jumlahSantri > 0 &&
                            ` ${hapus.jumlahSantri} santri masih terdaftar di kelompok ini. Pindahkan santri terlebih dahulu.`}
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setHapus(null)}>Batal</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={konfirmasiHapus}
                    >
                        Hapus
                    </Button>
                </DialogActions>
            </Dialog>

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

            <Snackbar
                open={Boolean(errorNotif)}
                autoHideDuration={4000}
                onClose={() => setErrorNotif('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    onClose={() => setErrorNotif('')}
                    variant="filled"
                >
                    {errorNotif}
                </Alert>
            </Snackbar>
        </Box>
    );
}
