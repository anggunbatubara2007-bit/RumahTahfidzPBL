import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Alert, Avatar, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
    DialogTitle, MenuItem, Pagination, Snackbar, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
// Bukti transfer diunggah santri (FR-26). Nanti halaman santri menambahkan data ke
// 'buktiTransfer' dan mengubah status tagihannya menjadi "Menunggu verifikasi".
const KUNCI = 'buktiTransfer';
const KUNCI_TAGIHAN = 'dataTagihanSpp'; // dikelola di halaman Data SPP

const PER_PAGE = 5;
const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_TAB = ['Menunggu', 'Disetujui', 'Ditolak'];

// tagihanId menghubungkan bukti ke tagihan di Data SPP. Data contoh nomor 1-5
// memakai nama yang sama dengan dashboard admin dan belum terhubung ke tagihan.
const BUKTI_AWAL = [
    { id: 1, tagihanId: null, nama: 'Ahmad Fauzan', bulan: '2026-09', jumlah: 350000, jatuhTempo: '2026-09-20', namaFile: 'bukti-transfer.jpg', tanggalUnggah: '2026-09-18', status: 'Menunggu' },
    { id: 2, tagihanId: null, nama: 'Mhd. Iqbal', bulan: '2026-08', jumlah: 350000, jatuhTempo: '2026-08-20', namaFile: 'bukti-transfer.jpg', tanggalUnggah: '2026-09-02', status: 'Menunggu' },
    { id: 3, tagihanId: null, nama: 'Miftahul Jannah', bulan: '2026-09', jumlah: 350000, jatuhTempo: '2026-09-20', namaFile: 'bukti-transfer.jpg', tanggalUnggah: '2026-09-15', status: 'Menunggu' },
    { id: 4, tagihanId: null, nama: 'Rizki Hanafi', bulan: '2026-08', jumlah: 350000, jatuhTempo: '2026-08-20', namaFile: 'bukti-transfer.jpg', tanggalUnggah: '2026-09-05', status: 'Menunggu' },
    { id: 5, tagihanId: null, nama: 'Citra Anggun', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-20', namaFile: 'bukti-spp-oktober.png', tanggalUnggah: '2026-10-09', status: 'Menunggu' },
    { id: 6, tagihanId: 's5', nama: 'Fauzan Ahmad', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-20', namaFile: 'transfer-bank.jpg', tanggalUnggah: '2026-10-12', status: 'Menunggu' },
    { id: 7, tagihanId: 's3', nama: 'Tesa Damayanti', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-20', namaFile: 'bukti-transfer.jpg', tanggalUnggah: '2026-10-04', status: 'Disetujui', diprosesPada: '2026-10-06' },
];

// ---------- Fungsi bantu ----------
const muat = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI));
        if (Array.isArray(saved)) return saved;
    } catch {
        /* data rusak: pakai data awal */
    }
    return BUKTI_AWAL;
};

// Setelah diproses, status tagihan di Data SPP ikut diperbarui
const perbaruiTagihan = (tagihanId, perubahan) => {
    if (!tagihanId) return;
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI_TAGIHAN));
        if (!Array.isArray(saved)) return;
        localStorage.setItem(
            KUNCI_TAGIHAN,
            JSON.stringify(saved.map((t) => (t.id === tagihanId ? { ...t, ...perubahan } : t)))
        );
    } catch {
        /* abaikan */
    }
};

const dua = (n) => String(n).padStart(2, '0');
const hariIniIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
};

const labelBulan = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return `${NAMA_BULAN[m - 1]} ${y}`;
};

const formatTanggal = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

const rupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    }).format(n);

const inisial = (nama = '') =>
    nama.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const terlambat = (b) => b.tanggalUnggah > b.jatuhTempo;

// Dibuka dari tautan ?id=... (dashboard, Data SPP): cocok dengan id bukti atau id tagihan
const cocok = (b, id) => id != null && (String(b.id) === id || b.tagihanId === id);

function ChipStatus({ b }) {
    if (b.status === 'Disetujui') {
        return <Chip label="Disetujui" size="small" color="success" sx={{ fontWeight: 600, minWidth: 96 }} />;
    }
    if (b.status === 'Ditolak') {
        return <Chip label="Ditolak" size="small" color="error" variant="outlined" sx={{ fontWeight: 600, minWidth: 96 }} />;
    }
    return terlambat(b) ? (
        <Chip label="Terlambat" size="small" color="error" sx={{ fontWeight: 600, minWidth: 96 }} />
    ) : (
        <Chip label="Menunggu" size="small" color="warning" sx={{ fontWeight: 600, minWidth: 96 }} />
    );
}

export default function Verifikasi() {
    const [searchParams] = useSearchParams();

    const [bukti, setBukti] = useState(muat);
    const [idBuka, setIdBuka] = useState(() => searchParams.get('id'));
    const [tab, setTab] = useState(() => {
        const awal = muat().find((b) => cocok(b, searchParams.get('id')));
        return awal ? awal.status : 'Menunggu';
    });
    const [filterBulan, setFilterBulan] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [tolak, setTolak] = useState(false);
    const [alasan, setAlasan] = useState('');
    const [errorAlasan, setErrorAlasan] = useState('');
    const [notif, setNotif] = useState('');

    useEffect(() => {
        try {
            localStorage.setItem(KUNCI, JSON.stringify(bukti));
        } catch {
            /* penyimpanan penuh atau diblokir: abaikan */
        }
    }, [bukti]);

    const detail = bukti.find((b) => cocok(b, idBuka)) ?? null;

    // ---------- Daftar ----------
    const menunggu = bukti.filter((b) => b.status === 'Menunggu').length;

    const opsiBulan = useMemo(
        () => [...new Set(bukti.map((b) => b.bulan))].sort().reverse(),
        [bukti]
    );

    const dalamBulan = useMemo(
        () => bukti.filter((b) => filterBulan === 'all' || b.bulan === filterBulan),
        [bukti, filterBulan]
    );

    const hitung = useMemo(
        () =>
            STATUS_TAB.reduce(
                (acc, s) => ({ ...acc, [s]: dalamBulan.filter((b) => b.status === s).length }),
                {}
            ),
        [dalamBulan]
    );

    const daftar = useMemo(
        () =>
            dalamBulan
                .filter((b) => b.status === tab)
                .sort((a, b) =>
                    tab === 'Menunggu'
                        ? a.tanggalUnggah.localeCompare(b.tanggalUnggah) // terlama dulu
                        : b.tanggalUnggah.localeCompare(a.tanggalUnggah)
                ),
        [dalamBulan, tab]
    );

    const totalHalaman = Math.max(1, Math.ceil(daftar.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const tampil = daftar.slice((halamanAman - 1) * PER_PAGE, halamanAman * PER_PAGE);

    // ---------- Detail & proses ----------
    const bukaDetail = (b) => {
        setTolak(false);
        setAlasan('');
        setErrorAlasan('');
        setIdBuka(String(b.id));
    };

    const tutupDetail = () => {
        setIdBuka(null);
        setTolak(false);
        setAlasan('');
        setErrorAlasan('');
    };

    const setujui = () => {
        const b = detail;
        setBukti((prev) =>
            prev.map((x) =>
                x.id === b.id ? { ...x, status: 'Disetujui', diprosesPada: hariIniIso(), alasanTolak: '' } : x
            )
        );
        perbaruiTagihan(b.tagihanId, { status: 'Sudah bayar' });
        setNotif(`Pembayaran ${b.nama} (${labelBulan(b.bulan)}) disetujui.`);
        tutupDetail();
    };

    const tolakBukti = () => {
        const teks = alasan.trim();
        if (teks.length < 5) {
            setErrorAlasan('Tuliskan alasan penolakan (minimal 5 karakter) agar santri tahu apa yang perlu diperbaiki.');
            return;
        }
        const b = detail;
        setBukti((prev) =>
            prev.map((x) =>
                x.id === b.id ? { ...x, status: 'Ditolak', diprosesPada: hariIniIso(), alasanTolak: teks } : x
            )
        );
        perbaruiTagihan(b.tagihanId, { status: 'Belum bayar', alasanTolak: teks });
        setNotif(`Bukti transfer ${b.nama} (${labelBulan(b.bulan)}) ditolak.`);
        tutupDetail();
    };

    const kosong = {
        Menunggu: 'Tidak ada bukti transfer yang menunggu verifikasi. Bukti yang diunggah santri akan muncul di sini.',
        Disetujui: 'Belum ada pembayaran yang disetujui.',
        Ditolak: 'Belum ada bukti transfer yang ditolak.',
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Ringkasan + filter bulan */}
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 2,
                }}
            >
                <Typography color="text.secondary">
                    {menunggu} bukti transfer menunggu
                </Typography>

                <TextField
                    select
                    size="small"
                    value={filterBulan}
                    onChange={(e) => {
                        setFilterBulan(e.target.value);
                        setHalaman(1);
                    }}
                    sx={{ minWidth: 200, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter bulan tagihan' } }}
                >
                    <MenuItem value="all">Semua Bulan</MenuItem>
                    {opsiBulan.map((b) => (
                        <MenuItem key={b} value={b}>{labelBulan(b)}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Tab status */}
            <Tabs
                value={tab}
                onChange={(_, nilai) => {
                    setTab(nilai);
                    setHalaman(1);
                }}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                {STATUS_TAB.map((s) => (
                    <Tab key={s} value={s} label={`${s} (${hitung[s]})`} sx={{ fontWeight: 700 }} />
                ))}
            </Tabs>

            {/* Daftar bukti transfer */}
            <Box sx={{ display: 'grid', gap: 2 }}>
                {tampil.map((b) => (
                    <Card
                        key={b.id}
                        sx={{
                            p: 2.5, borderRadius: 3, borderColor: palette.aquamarine,
                            display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap',
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 56, height: 56, fontWeight: 700,
                                bgcolor: palette.frostedMint, color: palette.pineTeal,
                                border: `1px solid ${palette.aquamarine}`,
                            }}
                        >
                            {inisial(b.nama)}
                        </Avatar>

                        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{b.nama}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                SPP {labelBulan(b.bulan)} · {rupiah(b.jumlah)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Diunggah {formatTanggal(b.tanggalUnggah)}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 1,
                                color: 'text.secondary', minWidth: 0,
                            }}
                        >
                            <InsertDriveFileOutlined />
                            <Typography variant="body2" noWrap>{b.namaFile}</Typography>
                        </Box>

                        <ChipStatus b={b} />

                        <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => bukaDetail(b)}
                            sx={{ borderColor: palette.pineTeal, color: palette.pineTeal }}
                        >
                            Lihat bukti
                        </Button>
                    </Card>
                ))}

                {daftar.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        {filterBulan === 'all'
                            ? kosong[tab]
                            : `Tidak ada data ${tab.toLowerCase()} untuk ${labelBulan(filterBulan)}.`}
                    </Typography>
                )}
            </Box>

            {/* Halaman */}
            {daftar.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Menampilkan {(halamanAman - 1) * PER_PAGE + 1}-
                        {(halamanAman - 1) * PER_PAGE + tampil.length} dari {daftar.length} bukti
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
            )}

            {/* Dialog detail bukti */}
            <Dialog open={Boolean(detail)} onClose={tutupDetail} fullWidth maxWidth="sm">
                {detail && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>
                            Bukti transfer {detail.nama}
                        </DialogTitle>

                        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
                            {/* Pratinjau bukti */}
                            <Box
                                sx={{
                                    minHeight: 200, borderRadius: 2, bgcolor: palette.honeydew,
                                    border: `1px dashed ${palette.aquamarine}`, display: 'grid',
                                    placeItems: 'center', p: 2, textAlign: 'center',
                                }}
                            >
                                {detail.dataUrl && detail.dataUrl.startsWith('data:image') ? (
                                    <Box
                                        component="img"
                                        src={detail.dataUrl}
                                        alt={`Bukti transfer ${detail.nama}`}
                                        sx={{ maxWidth: '100%', maxHeight: 320, display: 'block' }}
                                    />
                                ) : (
                                    <Box>
                                        <InsertDriveFileOutlined sx={{ fontSize: 48, color: palette.turfGreen }} />
                                        <Typography sx={{ fontWeight: 600 }}>{detail.namaFile}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pratinjau tidak tersedia pada data contoh. Berkas asli yang
                                            diunggah santri akan tampil di sini.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Rincian */}
                            <Box
                                sx={{
                                    display: 'grid', gridTemplateColumns: '140px 1fr',
                                    gap: 0.75, rowGap: 1,
                                }}
                            >
                                {[
                                    ['Santri', detail.nama],
                                    ['Tagihan', `SPP ${labelBulan(detail.bulan)}`],
                                    ['Jumlah', rupiah(detail.jumlah)],
                                    ['Jatuh tempo', formatTanggal(detail.jatuhTempo)],
                                    [
                                        'Diunggah',
                                        `${formatTanggal(detail.tanggalUnggah)}${terlambat(detail) ? ' (melewati jatuh tempo)' : ''}`,
                                    ],
                                ].map(([label, nilai]) => (
                                    <Box key={label} sx={{ display: 'contents' }}>
                                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{nilai}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Hasil verifikasi untuk bukti yang sudah diproses */}
                            {detail.status === 'Disetujui' && (
                                <Alert severity="success">
                                    Pembayaran disetujui pada {formatTanggal(detail.diprosesPada)}.
                                </Alert>
                            )}
                            {detail.status === 'Ditolak' && (
                                <Alert severity="error">
                                    Ditolak pada {formatTanggal(detail.diprosesPada)}. Alasan: {detail.alasanTolak}
                                </Alert>
                            )}

                            {/* Alasan penolakan */}
                            {tolak && (
                                <TextField
                                    label="Alasan penolakan"
                                    value={alasan}
                                    onChange={(e) => {
                                        setAlasan(e.target.value);
                                        setErrorAlasan('');
                                    }}
                                    error={Boolean(errorAlasan)}
                                    helperText={
                                        errorAlasan ||
                                        'Alasan ini akan dilihat santri. Contoh: nominal tidak sesuai atau foto buram.'
                                    }
                                    multiline
                                    minRows={2}
                                    autoFocus
                                    fullWidth
                                />
                            )}
                        </DialogContent>

                        <DialogActions sx={{ px: 3, py: 2 }}>
                            {detail.status !== 'Menunggu' && (
                                <Button onClick={tutupDetail}>Tutup</Button>
                            )}

                            {detail.status === 'Menunggu' && !tolak && (
                                <>
                                    <Button onClick={tutupDetail}>Tutup</Button>
                                    <Button color="error" variant="outlined" onClick={() => setTolak(true)}>
                                        Tolak
                                    </Button>
                                    <Button variant="contained" onClick={setujui}>
                                        Setujui pembayaran
                                    </Button>
                                </>
                            )}

                            {detail.status === 'Menunggu' && tolak && (
                                <>
                                    <Button onClick={() => { setTolak(false); setErrorAlasan(''); }}>
                                        Kembali
                                    </Button>
                                    <Button color="error" variant="contained" onClick={tolakBukti}>
                                        Tolak bukti transfer
                                    </Button>
                                </>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Pemberitahuan */}
            <Snackbar
                open={Boolean(notif)}
                autoHideDuration={3500}
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