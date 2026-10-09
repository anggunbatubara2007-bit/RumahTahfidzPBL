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

// TODO: ganti penyimpanan localStorage ini dengan API backend.
// Jumlah santri dan rerata capaian bersifat dummy: nanti dihitung otomatis dari
// data santri (FR-02) dan capaian target bulanan (FR-06), bukan diisi manual.
const KUNCI = 'dataKelompok';
const KUNCI_USTADZ = 'dataUstadz';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

// Pilihan jam 00-23 dan menit per 5 menit (format 24 jam, waktu Indonesia)
const OPSI_JAM = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const OPSI_MENIT = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const DATA_AWAL = [
    { id: 1, nama: 'Al-Fatih', pembina: 'Ust. Hilman', hari: ['Senin', 'Rabu'], jamMulai: '07:00', jamSelesai: '08:30', jumlahSantri: 18, rerata: 78 },
    { id: 2, nama: 'Al-Nur', pembina: 'Ust. Nur', hari: ['Selasa', 'Kamis'], jamMulai: '07:00', jamSelesai: '08:30', jumlahSantri: 18, rerata: 65 },
    { id: 3, nama: 'Ar-Rahman', pembina: 'Ust. Zainal', hari: ['Senin', 'Kamis'], jamMulai: '16:00', jamSelesai: '17:30', jumlahSantri: 18, rerata: 71 },
    { id: 4, nama: 'Al-Ikhlas', pembina: 'Ust. Muslih', hari: ['Rabu', 'Sabtu'], jamMulai: '16:00', jamSelesai: '17:30', jumlahSantri: 18, rerata: 82 },
    { id: 5, nama: 'Al-Falah', pembina: 'Ust. Rafi', hari: ['Selasa', 'Jumat'], jamMulai: '08:00', jamSelesai: '09:30', jumlahSantri: 18, rerata: 60 },
    { id: 6, nama: 'An-Naba', pembina: 'Ust. Fatih', hari: ['Sabtu', 'Ahad'], jamMulai: '08:00', jamSelesai: '09:30', jumlahSantri: 18, rerata: 68 },
];

const FORM_KOSONG = { nama: '', pembina: '', hari: [], jamMulai: '07:00', jamSelesai: '08:30' };

// Tambah menit ke jam "HH:MM", dibatasi sampai 23:59
const tambahMenit = (jam, menit) => {
    const [h, m] = jam.split(':').map(Number);
    const total = Math.min(h * 60 + m + menit, 23 * 60 + 59);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Data lama yang hanya punya `jam` diubah ke jamMulai + jamSelesai (default 90 menit)
const rapikan = (k) =>
    k.jamMulai
        ? k
        : { ...k, jamMulai: k.jam ?? '07:00', jamSelesai: tambahMenit(k.jam ?? '07:00', 90) };

const muatKelompok = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI));
        if (Array.isArray(saved)) return saved.map(rapikan);
    } catch {
        /* data rusak: pakai data awal */
    }
    return DATA_AWAL;
};

// Daftar pembina diambil dari ustadz aktif di halaman Data Ustadz
const muatNamaUstadz = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI_USTADZ));
        if (Array.isArray(saved)) {
            return saved.filter((u) => u.status === 'Aktif').map((u) => u.nama);
        }
    } catch {
        /* abaikan */
    }
    return ['Ust. Hilman', 'Ust. Nur', 'Ust. Hasan', 'Ust. Fatih'];
};

const urutHari = (daftar) => [...daftar].sort((a, b) => HARI.indexOf(a) - HARI.indexOf(b));

const titik = (jam) => jam.replace(':', '.');
const formatJadwal = (k) =>
    `${urutHari(k.hari).join(', ')} · ${titik(k.jamMulai)}–${titik(k.jamSelesai)} WIB`;

// Pilihan jam dan menit format 24 jam (tanpa AM/PM), zona WIB
function JamField({ label, value, onChange, error, helperText }) {
    const [jam, menit] = value.split(':');
    // menit di luar kelipatan 5 (dari data lama) tetap ditampilkan
    const opsiMenit = OPSI_MENIT.includes(menit) ? OPSI_MENIT : [...OPSI_MENIT, menit].sort();

    const menuProps = { slotProps: { paper: { style: { maxHeight: 240 } } } };

    return (
        <Box>
            <Typography
                variant="body2"
                sx={{ fontWeight: 600, mb: 0.75, color: error ? 'error.main' : 'text.primary' }}
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

                <Typography variant="body2" sx={{ fontWeight: 700, color: palette.turfGreen }}>
                    WIB
                </Typography>
            </Box>

            {helperText && <FormHelperText error={Boolean(error)}>{helperText}</FormHelperText>}
        </Box>
    );
}

export default function KelompokTahfidz() {
    const [kelompok, setKelompok] = useState(muatKelompok);
    const daftarUstadz = useMemo(muatNamaUstadz, []);

    const [dialog, setDialog] = useState(null); // { mode: 'tambah' | 'ubah', id? }
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [hapus, setHapus] = useState(null);
    const [notif, setNotif] = useState('');

    useEffect(() => {
        try {
            localStorage.setItem(KUNCI, JSON.stringify(kelompok));
        } catch {
            /* penyimpanan penuh atau diblokir: abaikan */
        }
    }, [kelompok]);

    // Pilihan pembina: ustadz aktif + pembina kelompok yang sedang diubah
    const pilihanPembina = useMemo(() => {
        const set = new Set(daftarUstadz);
        if (form.pembina) set.add(form.pembina);
        return [...set];
    }, [daftarUstadz, form.pembina]);

    // ---------- Form tambah / ubah ----------
    const bukaTambah = () => {
        setForm(FORM_KOSONG);
        setErrors({});
        setDialog({ mode: 'tambah' });
    };

    const bukaUbah = (k) => {
        setForm({
            nama: k.nama, pembina: k.pembina, hari: k.hari,
            jamMulai: k.jamMulai, jamSelesai: k.jamSelesai,
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

    // jam mulai dan selesai saling terkait: hapus kedua pesan kesalahannya
    const ubahJam = (nama) => (nilai) => {
        setForm((prev) => ({ ...prev, [nama]: nilai }));
        setErrors((prev) => ({ ...prev, jamMulai: '', jamSelesai: '' }));
    };

    const simpan = (e) => {
        e.preventDefault();

        const nama = form.nama.trim();
        const baru = {};

        if (!nama) {
            baru.nama = 'Nama kelompok wajib diisi.';
        } else if (
            kelompok.some((k) => k.nama.toLowerCase() === nama.toLowerCase() && k.id !== dialog.id)
        ) {
            baru.nama = 'Nama kelompok sudah ada.';
        }

        if (!form.pembina) baru.pembina = 'Pilih pembina kelompok.';
        if (form.hari.length === 0) baru.hari = 'Pilih minimal satu hari setoran.';

        if (form.jamSelesai <= form.jamMulai) {
            baru.jamSelesai = 'Jam selesai harus setelah jam mulai.';
        }

        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        const data = {
            nama,
            pembina: form.pembina,
            hari: urutHari(form.hari),
            jamMulai: form.jamMulai,
            jamSelesai: form.jamSelesai,
        };

        if (dialog.mode === 'tambah') {
            // Kelompok baru belum punya santri dan capaian
            setKelompok((prev) => [...prev, { id: Date.now(), ...data, jumlahSantri: 0, rerata: null }]);
            setNotif(`Kelompok ${nama} berhasil ditambahkan.`);
        } else {
            setKelompok((prev) => prev.map((k) => (k.id === dialog.id ? { ...k, ...data } : k)));
            setNotif(`Kelompok ${nama} berhasil diubah.`);
        }
        tutupDialog();
    };

    // ---------- Hapus ----------
    const konfirmasiHapus = () => {
        setKelompok((prev) => prev.filter((k) => k.id !== hapus.id));
        setNotif(`Kelompok ${hapus.nama} berhasil dihapus.`);
        setHapus(null);
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Jumlah kelompok + tombol tambah */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Typography color="text.secondary">
                    {kelompok.length} kelompok aktif
                </Typography>

                <Button variant="contained" startIcon={<AddIcon />} onClick={bukaTambah}>
                    Tambah Kelompok
                </Button>
            </Box>

            {/* Kartu kelompok */}
            <Box
                sx={{
                    display: 'grid', gap: 3,
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
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.pineTeal }}>
                                    {k.nama}
                                </Typography>

                                <Box sx={{ mt: -0.5, mr: -1, whiteSpace: 'nowrap' }}>
                                    <Tooltip title="Ubah">
                                        <IconButton size="small" onClick={() => bukaUbah(k)} aria-label={`Ubah ${k.nama}`}>
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

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: palette.turfGreen }}>
                                <ScheduleIcon sx={{ fontSize: 18 }} />
                                <Typography variant="body2">{formatJadwal(k)}</Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', mt: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <GroupsIcon sx={{ color: palette.pineTeal }} />
                                    <Typography sx={{ fontWeight: 700 }}>{k.jumlahSantri} santri</Typography>
                                </Box>

                                <Chip
                                    size="small"
                                    label={k.rerata == null ? 'Rerata –' : `Rerata ${k.rerata}%`}
                                    sx={{ bgcolor: '#fff', fontWeight: 700, color: palette.pineTeal }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                ))}

                {/* Kartu tambah kelompok baru */}
                <Card
                    sx={{
                        borderStyle: 'dashed', borderWidth: 2, borderColor: palette.shamrock,
                        borderRadius: 4, bgcolor: 'transparent',
                    }}
                >
                    <CardActionArea
                        onClick={bukaTambah}
                        sx={{
                            height: '100%', minHeight: 150, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 1, color: palette.turfGreen,
                        }}
                    >
                        <AddIcon />
                        <Typography sx={{ fontWeight: 600 }}>Tambah Kelompok Baru</Typography>
                    </CardActionArea>
                </Card>
            </Box>

            {kelompok.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                    Belum ada kelompok tahfidz. Klik "Tambah Kelompok" untuk membuat yang pertama.
                </Typography>
            )}

            {/* Dialog tambah / ubah */}
            <Dialog
                open={Boolean(dialog)}
                onClose={tutupDialog}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpan, noValidate: true } }}
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
                        name="pembina"
                        value={form.pembina}
                        onChange={ubahForm}
                        error={Boolean(errors.pembina)}
                        helperText={errors.pembina || 'Dipilih dari ustadz aktif di Data Ustadz.'}
                        fullWidth
                    >
                        {pilihanPembina.map((nama) => (
                            <MenuItem key={nama} value={nama}>{nama}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Hari setoran"
                        name="hari"
                        value={form.hari}
                        onChange={ubahForm}
                        error={Boolean(errors.hari)}
                        helperText={errors.hari || 'Boleh lebih dari satu hari.'}
                        slotProps={{
                            select: {
                                multiple: true,
                                renderValue: (selected) => urutHari(selected).join(', '),
                            },
                        }}
                        fullWidth
                    >
                        {HARI.map((h) => (
                            <MenuItem key={h} value={h}>{h}</MenuItem>
                        ))}
                    </TextField>

                    {/* Jam setoran: format 24 jam, waktu Indonesia Barat */}
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
                    <Button type="submit" variant="contained">
                        {dialog?.mode === 'ubah' ? 'Simpan' : 'Tambah'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={Boolean(hapus)} onClose={() => setHapus(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus kelompok?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Kelompok <strong>{hapus?.nama}</strong> akan dihapus dan tidak bisa dikembalikan.
                        {hapus?.jumlahSantri > 0 &&
                            ` ${hapus.jumlahSantri} santri di dalamnya perlu dipindahkan ke kelompok lain.`}
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