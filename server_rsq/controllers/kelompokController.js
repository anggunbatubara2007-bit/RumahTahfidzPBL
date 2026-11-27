
const db = require("../config/db");

const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });

// Menampilkan kelompok beserta pembina, jumlah santri,
// dan rerata capaian target hafalan bulan berjalan.
const getAllKelompok = async (req, res) => {
    try {
        const sql = `
            SELECT
                k.id_kelompok,
                k.nama_kelompok,
                k.id_ustadz,
                u.nama AS nama_pembina,
                k.hari_setoran,
                k.jam_mulai,
                k.jam_selesai,
                COUNT(DISTINCT s.id_santri) AS jumlah_santri,
                ROUND(AVG(t.persentase), 0) AS rerata
            FROM kelompok_tahfidz k
            LEFT JOIN ustadz u
                ON k.id_ustadz = u.id_ustadz
            LEFT JOIN santri s
                ON s.id_kelompok = k.id_kelompok
                AND s.status = 'Aktif'
            LEFT JOIN (
                SELECT
                    id_santri,
                    bulan,
                    CASE
                        WHEN target_halaman > 0
                        THEN (halaman_tercapai / target_halaman) * 100
                        ELSE NULL
                    END AS persentase
                FROM target_hafalan
                WHERE bulan = DATE_FORMAT(CURDATE(), '%Y-%m-01')
            ) t ON t.id_santri = s.id_santri
            GROUP BY
                k.id_kelompok,
                k.nama_kelompok,
                k.id_ustadz,
                u.nama,
                k.hari_setoran,
                k.jam_mulai,
                k.jam_selesai
            ORDER BY k.id_kelompok ASC
        `;

        const results = await query(sql);

        res.json({
            message: "Data kelompok berhasil diambil.",
            data: results,
        });
    } catch (error) {
        console.error("Gagal mengambil kelompok:", error.message);
        res.status(500).json({
            message: "Gagal mengambil data kelompok.",
        });
    }
};

// Menambahkan kelompok.
const createKelompok = async (req, res) => {
    try {
        const {
            nama_kelompok,
            id_ustadz,
            hari_setoran,
            jam_mulai,
            jam_selesai,
        } = req.body;

        if (
            !nama_kelompok ||
            !id_ustadz ||
            !hari_setoran ||
            !jam_mulai ||
            !jam_selesai
        ) {
            return res.status(400).json({
                message: "Semua data kelompok wajib diisi.",
            });
        }

        if (jam_selesai <= jam_mulai) {
            return res.status(400).json({
                message: "Jam selesai harus setelah jam mulai.",
            });
        }

        const ustadz = await query(
            `SELECT id_ustadz
             FROM ustadz
             WHERE id_ustadz = ? AND status = 'Aktif'`,
            [id_ustadz]
        );

        if (ustadz.length === 0) {
            return res.status(400).json({
                message: "Pembina tidak ditemukan atau tidak aktif.",
            });
        }

        const namaAda = await query(
            `SELECT id_kelompok
             FROM kelompok_tahfidz
             WHERE LOWER(nama_kelompok) = LOWER(?)`,
            [nama_kelompok.trim()]
        );

        if (namaAda.length > 0) {
            return res.status(409).json({
                message: "Nama kelompok sudah digunakan.",
            });
        }

        const result = await query(
            `INSERT INTO kelompok_tahfidz
                (nama_kelompok, id_ustadz, hari_setoran, jam_mulai, jam_selesai)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nama_kelompok.trim(),
                id_ustadz,
                hari_setoran,
                jam_mulai,
                jam_selesai,
            ]
        );

        res.status(201).json({
            message: "Kelompok berhasil ditambahkan.",
            id_kelompok: result.insertId,
        });
    } catch (error) {
        console.error("Gagal menambahkan kelompok:", error.message);
        res.status(500).json({
            message: "Gagal menambahkan kelompok.",
        });
    }
};

// Mengubah kelompok.
const updateKelompok = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nama_kelompok,
            id_ustadz,
            hari_setoran,
            jam_mulai,
            jam_selesai,
        } = req.body;

        if (
            !nama_kelompok ||
            !id_ustadz ||
            !hari_setoran ||
            !jam_mulai ||
            !jam_selesai
        ) {
            return res.status(400).json({
                message: "Semua data kelompok wajib diisi.",
            });
        }

        if (jam_selesai <= jam_mulai) {
            return res.status(400).json({
                message: "Jam selesai harus setelah jam mulai.",
            });
        }

        const ustadz = await query(
            `SELECT id_ustadz
             FROM ustadz
             WHERE id_ustadz = ? AND status = 'Aktif'`,
            [id_ustadz]
        );

        if (ustadz.length === 0) {
            return res.status(400).json({
                message: "Pembina tidak ditemukan atau tidak aktif.",
            });
        }

        const namaAda = await query(
            `SELECT id_kelompok
             FROM kelompok_tahfidz
             WHERE LOWER(nama_kelompok) = LOWER(?)
             AND id_kelompok <> ?`,
            [nama_kelompok.trim(), id]
        );

        if (namaAda.length > 0) {
            return res.status(409).json({
                message: "Nama kelompok sudah digunakan.",
            });
        }

        const result = await query(
            `UPDATE kelompok_tahfidz
             SET nama_kelompok = ?,
                 id_ustadz = ?,
                 hari_setoran = ?,
                 jam_mulai = ?,
                 jam_selesai = ?
             WHERE id_kelompok = ?`,
            [
                nama_kelompok.trim(),
                id_ustadz,
                hari_setoran,
                jam_mulai,
                jam_selesai,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Kelompok tidak ditemukan.",
            });
        }

        res.json({
            message: "Kelompok berhasil diperbarui.",
        });
    } catch (error) {
        console.error("Gagal mengubah kelompok:", error.message);
        res.status(500).json({
            message: "Gagal mengubah kelompok.",
        });
    }
};

// Menghapus kelompok hanya jika belum memiliki santri.
const deleteKelompok = async (req, res) => {
    try {
        const { id } = req.params;

        const santri = await query(
            `SELECT id_santri
             FROM santri
             WHERE id_kelompok = ?
             LIMIT 1`,
            [id]
        );

        if (santri.length > 0) {
            return res.status(409).json({
                message:
                    "Kelompok masih memiliki santri. Pindahkan santri ke kelompok lain terlebih dahulu.",
            });
        }

        const result = await query(
            `DELETE FROM kelompok_tahfidz
             WHERE id_kelompok = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Kelompok tidak ditemukan.",
            });
        }

        res.json({
            message: "Kelompok berhasil dihapus.",
        });
    } catch (error) {
        console.error("Gagal menghapus kelompok:", error.message);
        res.status(500).json({
            message: "Gagal menghapus kelompok.",
        });
    }
};

module.exports = {
    getAllKelompok,
    createKelompok,
    updateKelompok,
    deleteKelompok,
};
