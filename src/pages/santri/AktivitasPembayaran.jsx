
import { useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import PaymentsIcon from "@mui/icons-material/Payments";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

const NOMOR_REKENING = "1234567890";
const NAMA_BANK = "Bank Syariah Indonesia";
const ATAS_NAMA = "PONDOK TAHFIDZ RSQ";

const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(angka);

export default function AktivitasPembayaran() {
    const [openRekening, setOpenRekening] = useState(false);
    const [fileBukti, setFileBukti] = useState(null);

    // Status sementara. Nantinya akan diambil dari database.
    const [statusPembayaran, setStatusPembayaran] = useState("Menunggu");

    const [pesan, setPesan] = useState("");
    const [openPesan, setOpenPesan] = useState(false);

    const tagihan = {
        bulan: "November 2026",
        nominal: 500000,
        jatuhTempo: "10 November 2026",
    };

    const riwayatPembayaran = [
        {
            bulan: "Oktober 2026",
            tanggal: "8 Oktober 2026",
            nominal: 500000,
            status: "Disetujui",
        },
        {
            bulan: "September 2026",
            tanggal: "9 September 2026",
            nominal: 500000,
            status: "Disetujui",
        },
        {
            bulan: "Agustus 2026",
            tanggal: "11 Agustus 2026",
            nominal: 500000,
            status: "Ditolak",
        },
    ];

    const salinRekening = async () => {
        try {
            await navigator.clipboard.writeText(NOMOR_REKENING);
            setPesan("Nomor rekening berhasil disalin.");
        } catch {
            setPesan("Nomor rekening tidak dapat disalin. Silakan salin secara manual.");
        }

        setOpenPesan(true);
    };

    const pilihFile = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const formatDiizinkan = [
            "image/jpeg",
            "image/png",
            "application/pdf",
        ];

        if (!formatDiizinkan.includes(file.type)) {
            setPesan("Format file harus JPG, PNG, atau PDF.");
            setOpenPesan(true);
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setPesan("Ukuran file maksimal 5 MB.");
            setOpenPesan(true);
            event.target.value = "";
            return;
        }

        setFileBukti(file);
    };

    const kirimBukti = () => {
        if (!fileBukti) {
            setPesan("Silakan pilih bukti pembayaran terlebih dahulu.");
            setOpenPesan(true);
            return;
        }

        // Simulasi pengiriman. Backend belum dihubungkan.
        setStatusPembayaran("Menunggu");
        setFileBukti(null);

        setPesan("Bukti pembayaran berhasil dikirim dan menunggu verifikasi.");
        setOpenPesan(true);
    };

    const warnaStatus = (status) => {
        if (status === "Disetujui") return "success";
        if (status === "Ditolak") return "error";
        return "warning";
    };

    return (
        <Box sx={{ pb: 4 }}>
            {/* HEADER */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="#064E3B">
                    SPP dan Pembayaran
                </Typography>

                <Typography color="text.secondary">
                    Informasi tagihan dan riwayat pembayaran SPP Santri.
                </Typography>
            </Box>

            {/* TAGIHAN SPP */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={2}
                    >
                        <Box>
                            <Typography color="text.secondary" variant="body2">
                                Tagihan SPP
                            </Typography>

                            <Typography variant="h6" fontWeight="bold">
                                {tagihan.bulan}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Jatuh tempo: {tagihan.jatuhTempo}
                            </Typography>
                        </Box>

                        <Chip
                            label={statusPembayaran}
                            color={warnaStatus(statusPembayaran)}
                            sx={{ fontWeight: "bold" }}
                        />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={2}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Total Tagihan
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="#047857"
                            >
                                {formatRupiah(tagihan.nominal)}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<PaymentsIcon />}
                            onClick={() => setOpenRekening(true)}
                            sx={{
                                bgcolor: "#047857",
                                borderRadius: 2,
                                px: 3,
                                "&:hover": { bgcolor: "#064E3B" },
                            }}
                        >
                            Bayar Sekarang
                        </Button>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* KONDISI PEMBAYARAN DITOLAK */}
                    {statusPembayaran === "Ditolak" && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Bukti pembayaran sebelumnya ditolak.
                            Silakan periksa kembali bukti pembayaran dan kirim ulang.
                        </Alert>
                    )}

                    {statusPembayaran === "Disetujui" ? (
                        <Alert severity="success">
                            Pembayaran SPP bulan ini sudah disetujui.
                        </Alert>
                    ) : (
                        <Box>
                            <Typography fontWeight="bold" sx={{ mb: 1 }}>
                                {statusPembayaran === "Ditolak"
                                    ? "Kirim Ulang Bukti Pembayaran"
                                    : "Upload Bukti Pembayaran"}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Pilih bukti transfer dalam format JPG, PNG, atau PDF.
                                Ukuran maksimal 5 MB.
                            </Typography>

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                alignItems={{ xs: "stretch", sm: "center" }}
                            >
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        borderColor: "#047857",
                                        color: "#047857",
                                    }}
                                >
                                    Pilih Bukti Pembayaran

                                    <input
                                        hidden
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={pilihFile}
                                    />
                                </Button>

                                <Button
                                    variant="contained"
                                    disabled={!fileBukti}
                                    onClick={kirimBukti}
                                    sx={{
                                        bgcolor: "#047857",
                                        "&:hover": { bgcolor: "#064E3B" },
                                    }}
                                >
                                    {statusPembayaran === "Ditolak"
                                        ? "Kirim Ulang Bukti"
                                        : "Kirim Bukti"}
                                </Button>
                            </Stack>

                            {fileBukti && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    File dipilih: {fileBukti.name}
                                </Alert>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* RIWAYAT PEMBAYARAN */}
            <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Riwayat Pembayaran
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ bgcolor: "#ECFDF5" }}>
                                <TableRow>
                                    <TableCell>
                                        <b>Bulan</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Tanggal</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Nominal</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Status</b>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {riwayatPembayaran.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.bulan}</TableCell>
                                        <TableCell>{item.tanggal}</TableCell>
                                        <TableCell>
                                            {formatRupiah(item.nominal)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.status}
                                                color={warnaStatus(item.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* POPUP INFORMASI REKENING */}
            <Dialog
                open={openRekening}
                onClose={() => setOpenRekening(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle fontWeight="bold">
                    Informasi Pembayaran SPP
                </DialogTitle>

                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Silakan transfer sesuai nominal tagihan ke rekening berikut.
                    </Alert>

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "#F0FDF4",
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <AccountBalanceIcon color="success" />
                            <Typography fontWeight="bold">
                                {NAMA_BANK}
                            </Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Nomor Rekening
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                        >
                            <Typography variant="h6" fontWeight="bold">
                                {NOMOR_REKENING}
                            </Typography>

                            <Button
                                size="small"
                                onClick={salinRekening}
                                startIcon={<ContentCopyIcon />}
                            >
                                Salin
                            </Button>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" color="text.secondary">
                            Atas Nama
                        </Typography>

                        <Typography fontWeight="bold">
                            {ATAS_NAMA}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" color="text.secondary">
                            Nominal Transfer
                        </Typography>

                        <Typography variant="h6" fontWeight="bold" color="#047857">
                            {formatRupiah(tagihan.nominal)}
                        </Typography>
                    </Paper>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Setelah transfer, tutup popup ini lalu upload bukti
                        pembayaran pada halaman SPP dan Pembayaran.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setOpenRekening(false)}
                        variant="contained"
                        sx={{ bgcolor: "#047857" }}
                    >
                        Mengerti
                    </Button>
                </DialogActions>
            </Dialog>

            {/* NOTIFIKASI */}
            <Snackbar
                open={openPesan}
                autoHideDuration={3500}
                onClose={() => setOpenPesan(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenPesan(false)}
                    severity="info"
                    variant="filled"
                >
                    {pesan}
                </Alert>
            </Snackbar>
        </Box>
    );
}
