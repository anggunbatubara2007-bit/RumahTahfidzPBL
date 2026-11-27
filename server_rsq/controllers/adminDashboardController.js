const db = require("../config/db");

// Mengambil seluruh data yang dibutuhkan Dashboard Admin
const getDashboard = async (req, res) => {
    try {
        // Membuat helper agar query MySQL dapat digunakan dengan Promise
        const query = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        };

        // 1. Statistik jumlah santri, ustadz, dan kelompok
        const statistikSQL = `
            SELECT
                (SELECT COUNT(*) FROM santri) AS totalSantri,
                (SELECT COUNT(*) FROM ustadz) AS totalUstadz,
                (SELECT COUNT(*) FROM kelompok_tahfidz) AS totalKelompok
        `;

        // 2. Setoran hafalan terbaru beserta status beasiswa
        const setoranSQL = `
            SELECT
                st.id_setoran,
                DATE_FORMAT(st.tanggal, '%Y-%m-%d') AS tanggal,
                sa.nama AS santri,
                COALESCE(kt.nama_kelompok, '-') AS kelompok,
                st.jenis,
                COALESCE(st.surat_ayat, '-') AS surat,
                COALESCE(st.jumlah_halaman, 0) AS halaman,
                COALESCE(
                    (
                        SELECT th.status_beasiswa
                        FROM target_hafalan th
                        WHERE
                            th.id_santri = sa.id_santri
                            AND DATE_FORMAT(th.bulan, '%Y-%m') =
                                DATE_FORMAT(CURDATE(), '%Y-%m')
                        ORDER BY th.id_target DESC
                        LIMIT 1
                    ),
                    'Tertinggal'
                ) AS statusBeasiswa
            FROM setoran st
            INNER JOIN santri sa
                ON st.id_santri = sa.id_santri
            LEFT JOIN kelompok_tahfidz kt
                ON sa.id_kelompok = kt.id_kelompok
            ORDER BY st.tanggal DESC, st.id_setoran DESC
            LIMIT 50
        `;

        // 3. Pembayaran yang masih menunggu verifikasi
        const verifikasiSQL = `
            SELECT
                p.id_pembayaran AS id,
                sa.nama AS santri,
                DATE_FORMAT(t.bulan, '%Y-%m') AS bulan,
                p.status_verifikasi
            FROM pembayaran p
            INNER JOIN tagihan_spp t
                ON p.id_tagihan = t.id_tagihan
            INNER JOIN santri sa
                ON t.id_santri = sa.id_santri
            WHERE p.status_verifikasi = 'Menunggu'
            ORDER BY p.tgl_bayar DESC, p.id_pembayaran DESC
            LIMIT 10
        `;

        // Menjalankan ketiga query
        const [statistik, setoran, verifikasi] = await Promise.all([
            query(statistikSQL),
            query(setoranSQL),
            query(verifikasiSQL),
        ]);

        return res.status(200).json({
            message: "Data Dashboard Admin berhasil diambil.",
            data: {
                stats: statistik[0] || {
                    totalSantri: 0,
                    totalUstadz: 0,
                    totalKelompok: 0,
                },
                setoranTerbaru: setoran,
                verifikasi,
            },
        });
    } catch (error) {
        console.error("Dashboard Admin error:", error.message);

        return res.status(500).json({
            message: "Gagal mengambil data Dashboard Admin.",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboard,
};