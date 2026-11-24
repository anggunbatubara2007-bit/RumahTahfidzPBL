
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// =====================================
// 1. MENAMPILKAN SEMUA DATA PENGGUNA
// =====================================
const getAllPengguna = (req, res) => {
    const sql = `
        SELECT
            p.id_pengguna,
            p.username,
            p.nis,
            p.role,
            a.id_admin,
            a.nama AS nama_admin,
            u.id_ustadz,
            u.nama AS nama_ustadz,
            u.nip,
            u.status AS status_ustadz,
            s.id_santri,
            s.nama AS nama_santri,
            s.id_kelompok,
            s.status AS status_santri
        FROM pengguna p
        LEFT JOIN admin a ON p.id_pengguna = a.id_pengguna
        LEFT JOIN ustadz u ON p.id_pengguna = u.id_pengguna
        LEFT JOIN santri s ON p.id_pengguna = s.id_pengguna
        ORDER BY p.id_pengguna DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Gagal mengambil pengguna:", err.message);
            return res.status(500).json({
                message: "Gagal mengambil data pengguna.",
            });
        }

        res.status(200).json({
            message: "Data pengguna berhasil diambil.",
            data: results,
        });
    });
};

// =====================================
// 2. MEMBUAT AKUN USTADZ
// =====================================
const createUstadz = async (req, res) => {
    const { username, password, nama, nip, status } = req.body;

    if (!username || !password || !nama) {
        return res.status(400).json({
            message: "Username, password, dan nama wajib diisi.",
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password minimal 6 karakter.",
        });
    }

    const statusUstadz = status || "Aktif";

    if (!["Aktif", "Cuti"].includes(statusUstadz)) {
        return res.status(400).json({
            message: "Status Ustadz tidak valid.",
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.beginTransaction((transactionError) => {
            if (transactionError) {
                return res.status(500).json({
                    message: "Gagal memulai transaksi database.",
                });
            }

            const sqlPengguna = `
                INSERT INTO pengguna (username, nis, password, role)
                VALUES (?, NULL, ?, 'Ustadz')
            `;

            db.query(
                sqlPengguna,
                [username, hashedPassword],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            if (err.code === "ER_DUP_ENTRY") {
                                return res.status(409).json({
                                    message: "Username atau NIP sudah digunakan.",
                                });
                            }

                            console.error(err.message);
                            return res.status(500).json({
                                message: "Gagal membuat akun Ustadz.",
                            });
                        });
                    }

                    const idPengguna = result.insertId;

                    const sqlUstadz = `
                        INSERT INTO ustadz
                        (id_pengguna, nama, nip, status)
                        VALUES (?, ?, ?, ?)
                    `;

                    db.query(
                        sqlUstadz,
                        [
                            idPengguna,
                            nama,
                            nip || null,
                            statusUstadz,
                        ],
                        (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    if (err.code === "ER_DUP_ENTRY") {
                                        return res.status(409).json({
                                            message: "NIP sudah digunakan.",
                                        });
                                    }

                                    console.error(err.message);
                                    return res.status(500).json({
                                        message: "Gagal menyimpan profil Ustadz.",
                                    });
                                });
                            }

                            db.commit((commitError) => {
                                if (commitError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            message: "Gagal menyimpan transaksi.",
                                        });
                                    });
                                }

                                res.status(201).json({
                                    message: "Akun Ustadz berhasil dibuat.",
                                });
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Terjadi kesalahan pada server.",
        });
    }
};

// =====================================
// 3. MEMBUAT AKUN SANTRI
// =====================================
const createSantri = async (req, res) => {
    const {
        nis,
        password,
        nama,
        id_kelompok,
        status,
    } = req.body;

    if (!nis || !password || !nama) {
        return res.status(400).json({
            message: "NIS, password, dan nama wajib diisi.",
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password minimal 6 karakter.",
        });
    }

    const statusSantri = status || "Aktif";

    if (!["Aktif", "Tidak Aktif"].includes(statusSantri)) {
        return res.status(400).json({
            message: "Status Santri tidak valid.",
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.beginTransaction((transactionError) => {
            if (transactionError) {
                return res.status(500).json({
                    message: "Gagal memulai transaksi database.",
                });
            }

            const sqlPengguna = `
                INSERT INTO pengguna (username, nis, password, role)
                VALUES (NULL, ?, ?, 'Santri')
            `;

            db.query(
                sqlPengguna,
                [nis, hashedPassword],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            if (err.code === "ER_DUP_ENTRY") {
                                return res.status(409).json({
                                    message: "NIS sudah digunakan.",
                                });
                            }

                            console.error(err.message);
                            return res.status(500).json({
                                message: "Gagal membuat akun Santri.",
                            });
                        });
                    }

                    const idPengguna = result.insertId;

                    const sqlSantri = `
                        INSERT INTO santri
                        (id_pengguna, id_kelompok, nis, nama, status)
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    db.query(
                        sqlSantri,
                        [
                            idPengguna,
                            id_kelompok || null,
                            nis,
                            nama,
                            statusSantri,
                        ],
                        (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    if (err.code === "ER_DUP_ENTRY") {
                                        return res.status(409).json({
                                            message: "NIS sudah digunakan.",
                                        });
                                    }

                                    console.error(err.message);
                                    return res.status(500).json({
                                        message: "Gagal menyimpan profil Santri.",
                                    });
                                });
                            }

                            db.commit((commitError) => {
                                if (commitError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            message: "Gagal menyimpan transaksi.",
                                        });
                                    });
                                }

                                res.status(201).json({
                                    message: "Akun Santri berhasil dibuat.",
                                });
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Terjadi kesalahan pada server.",
        });
    }
};

module.exports = {
    getAllPengguna,
    createUstadz,
    createSantri,
};
