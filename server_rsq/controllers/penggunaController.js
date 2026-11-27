
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// =====================================
// HELPER DATABASE
// =====================================
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const transaksi = async (callback) => {
    await new Promise((resolve, reject) => {
        db.beginTransaction((err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    try {
        const hasil = await callback();

        await new Promise((resolve, reject) => {
            db.commit((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        return hasil;
    } catch (error) {
        await new Promise((resolve) => {
            db.rollback(() => resolve());
        });

        throw error;
    }
};

const buatError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// =====================================
// HELPER PENUGASAN KELOMPOK USTADZ
// =====================================
const simpanKelompokUstadz = async (idUstadz, kelompokIds) => {
    const ids = [...new Set(
        (Array.isArray(kelompokIds) ? kelompokIds : [])
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0)
    )];

    if (ids.length > 0) {
        const kelompok = await query(
            `
                SELECT id_kelompok, id_ustadz
                FROM kelompok_tahfidz
                WHERE id_kelompok IN (?)
                FOR UPDATE
            `,
            [ids]
        );

        if (kelompok.length !== ids.length) {
            throw buatError(
                "Salah satu kelompok tahfidz tidak ditemukan.",
                404
            );
        }

        const sudahDibina = kelompok.find(
            (k) => k.id_ustadz !== null &&
                Number(k.id_ustadz) !== Number(idUstadz)
        );

        if (sudahDibina) {
            throw buatError(
                "Salah satu kelompok sudah dibina oleh Ustadz lain.",
                409
            );
        }
    }

    // Lepaskan kelompok lama milik Ustadz ini.
    await query(
        `
            UPDATE kelompok_tahfidz
            SET id_ustadz = NULL
            WHERE id_ustadz = ?
        `,
        [idUstadz]
    );

    // Simpan semua kelompok pilihan baru.
    if (ids.length > 0) {
        await query(
            `
                UPDATE kelompok_tahfidz
                SET id_ustadz = ?
                WHERE id_kelompok IN (?)
            `,
            [idUstadz, ids]
        );
    }
};

// =====================================
// 1. MENAMPILKAN SEMUA DATA PENGGUNA
// =====================================
const getAllPengguna = async (req, res) => {
    const sql = `
        SELECT
            p.id_pengguna,
            p.username,
            p.nis AS nis_pengguna,
            p.role,

            a.id_admin,
            a.nama AS nama_admin,

            u.id_ustadz,
            u.nama AS nama_ustadz,
            u.nip,
            u.status AS status_ustadz,

            s.id_santri,
            s.nama AS nama_santri,
            s.nis AS nis_santri,
            s.id_kelompok,
            s.status AS status_santri,

            k.nama_kelompok,
            u_pembimbing.nama AS nama_pembimbing,

            th.status_beasiswa,

            (
                SELECT GROUP_CONCAT(kk.id_kelompok)
                FROM kelompok_tahfidz kk
                WHERE kk.id_ustadz = u.id_ustadz
            ) AS kelompok_ids,

            (
                SELECT GROUP_CONCAT(
                    kk.nama_kelompok SEPARATOR ', '
                )
                FROM kelompok_tahfidz kk
                WHERE kk.id_ustadz = u.id_ustadz
            ) AS kelompok_binaan

        FROM pengguna p

        LEFT JOIN admin a
            ON p.id_pengguna = a.id_pengguna

        LEFT JOIN ustadz u
            ON p.id_pengguna = u.id_pengguna

        LEFT JOIN santri s
            ON p.id_pengguna = s.id_pengguna

        LEFT JOIN kelompok_tahfidz k
            ON s.id_kelompok = k.id_kelompok

        LEFT JOIN ustadz u_pembimbing
            ON k.id_ustadz = u_pembimbing.id_ustadz

        LEFT JOIN target_hafalan th
            ON s.id_santri = th.id_santri
            AND YEAR(th.bulan) = YEAR(CURDATE())
            AND MONTH(th.bulan) = MONTH(CURDATE())

        ORDER BY p.id_pengguna DESC
    `;

    try {
        const results = await query(sql);

        res.status(200).json({
            message: "Data pengguna berhasil diambil.",
            data: results,
        });
    } catch (err) {
        console.error("Gagal mengambil pengguna:", err.message);

        res.status(500).json({
            message: "Gagal mengambil data pengguna.",
        });
    }
};

// =====================================
// 2. MENAMPILKAN KELOMPOK TAHFIDZ
// =====================================
const getAllKelompok = async (req, res) => {
    const sql = `
        SELECT
            k.id_kelompok,
            k.nama_kelompok,
            k.id_ustadz,
            u.nama AS nama_pembimbing
        FROM kelompok_tahfidz k
        LEFT JOIN ustadz u
            ON k.id_ustadz = u.id_ustadz
        ORDER BY k.nama_kelompok ASC
    `;

    try {
        const results = await query(sql);

        res.status(200).json({
            message: "Data kelompok berhasil diambil.",
            data: results,
        });
    } catch (err) {
        console.error("Gagal mengambil kelompok:", err.message);

        res.status(500).json({
            message: "Gagal mengambil data kelompok tahfidz.",
        });
    }
};

// =====================================
// 3. MEMBUAT AKUN USTADZ
// =====================================
const createUstadz = async (req, res) => {
    const {
        username,
        password,
        nama,
        nip,
        status,
        kelompok_ids,
    } = req.body;

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

        await transaksi(async () => {
            const pengguna = await query(
                `
                    INSERT INTO pengguna
                    (username, nis, password, role)
                    VALUES (?, NULL, ?, 'Ustadz')
                `,
                [username, hashedPassword]
            );

            const ustadz = await query(
                `
                    INSERT INTO ustadz
                    (id_pengguna, nama, nip, status)
                    VALUES (?, ?, ?, ?)
                `,
                [
                    pengguna.insertId,
                    nama,
                    nip || null,
                    statusUstadz,
                ]
            );

            await simpanKelompokUstadz(
                ustadz.insertId,
                kelompok_ids
            );
        });

        res.status(201).json({
            message: "Akun Ustadz berhasil dibuat.",
        });
    } catch (error) {
        console.error("Gagal membuat Ustadz:", error.message);

        res.status(error.status || (
            error.code === "ER_DUP_ENTRY" ? 409 : 500
        )).json({
            message:
                error.status
                    ? error.message
                    : error.code === "ER_DUP_ENTRY"
                        ? "Username atau NIP sudah digunakan."
                        : "Gagal membuat akun Ustadz.",
        });
    }
};

// =====================================
// 4. MEMBUAT AKUN SANTRI
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

    if (!/^\d+$/.test(String(nis))) {
        return res.status(400).json({
            message: "NIS hanya boleh berisi angka.",
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

        await transaksi(async () => {
            const pengguna = await query(
                `
                    INSERT INTO pengguna
                    (username, nis, password, role)
                    VALUES (NULL, ?, ?, 'Santri')
                `,
                [nis, hashedPassword]
            );

            await query(
                `
                    INSERT INTO santri
                    (id_pengguna, id_kelompok, nis, nama, status)
                    VALUES (?, ?, ?, ?, ?)
                `,
                [
                    pengguna.insertId,
                    id_kelompok || null,
                    nis,
                    nama,
                    statusSantri,
                ]
            );
        });

        res.status(201).json({
            message: "Akun Santri berhasil dibuat.",
        });
    } catch (error) {
        console.error("Gagal membuat Santri:", error.message);

        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
            message:
                error.code === "ER_DUP_ENTRY"
                    ? "NIS sudah digunakan."
                    : "Gagal membuat akun Santri.",
        });
    }
};

// =====================================
// 5. MENGEDIT DATA USTADZ
// =====================================
const updateUstadz = async (req, res) => {
    const { id } = req.params;

    const {
        username,
        nama,
        nip,
        password,
        status,
        kelompok_ids,
    } = req.body;

    if (!username || !nama) {
        return res.status(400).json({
            message: "Username dan nama wajib diisi.",
        });
    }

    const statusUstadz = status || "Aktif";

    if (!["Aktif", "Cuti"].includes(statusUstadz)) {
        return res.status(400).json({
            message: "Status Ustadz tidak valid.",
        });
    }

    if (password && password.length < 6) {
        return res.status(400).json({
            message: "Password minimal 6 karakter.",
        });
    }

    try {
        const hashedPassword = password
            ? await bcrypt.hash(password, 10)
            : null;

        await transaksi(async () => {
            const data = await query(
                `
                    SELECT id_pengguna
                    FROM ustadz
                    WHERE id_ustadz = ?
                    FOR UPDATE
                `,
                [id]
            );

            if (data.length === 0) {
                throw buatError(
                    "Data Ustadz tidak ditemukan.",
                    404
                );
            }

            const idPengguna = data[0].id_pengguna;

            if (hashedPassword) {
                await query(
                    `
                        UPDATE pengguna
                        SET username = ?, password = ?
                        WHERE id_pengguna = ?
                    `,
                    [username, hashedPassword, idPengguna]
                );
            } else {
                await query(
                    `
                        UPDATE pengguna
                        SET username = ?
                        WHERE id_pengguna = ?
                    `,
                    [username, idPengguna]
                );
            }

            await query(
                `
                    UPDATE ustadz
                    SET nama = ?, nip = ?, status = ?
                    WHERE id_ustadz = ?
                `,
                [nama, nip || null, statusUstadz, id]
            );

            // Jika kelompok_ids dikirim, perbarui penugasan kelompok.
            if (Array.isArray(kelompok_ids)) {
                await simpanKelompokUstadz(id, kelompok_ids);
            }
        });

        res.status(200).json({
            message: password
                ? "Data dan password Ustadz berhasil diperbarui."
                : "Data Ustadz berhasil diperbarui.",
        });
    } catch (error) {
        console.error("Gagal memperbarui Ustadz:", error.message);

        res.status(error.status || (
            error.code === "ER_DUP_ENTRY" ? 409 : 500
        )).json({
            message:
                error.status
                    ? error.message
                    : error.code === "ER_DUP_ENTRY"
                        ? "Username atau NIP sudah digunakan."
                        : "Gagal memperbarui data Ustadz.",
        });
    }
};

// =====================================
// 6. MENGEDIT DATA SANTRI
// =====================================
const updateSantri = async (req, res) => {
    const { id } = req.params;

    const {
        nis,
        nama,
        id_kelompok,
        password,
        status,
    } = req.body;

    if (!nis || !nama) {
        return res.status(400).json({
            message: "NIS dan nama wajib diisi.",
        });
    }

    if (!/^\d+$/.test(String(nis))) {
        return res.status(400).json({
            message: "NIS hanya boleh berisi angka.",
        });
    }

    if (password && password.length < 6) {
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
        const hashedPassword = password
            ? await bcrypt.hash(password, 10)
            : null;

        await transaksi(async () => {
            const data = await query(
                `
                    SELECT id_pengguna
                    FROM santri
                    WHERE id_santri = ?
                    FOR UPDATE
                `,
                [id]
            );

            if (data.length === 0) {
                throw buatError(
                    "Data Santri tidak ditemukan.",
                    404
                );
            }

            const idPengguna = data[0].id_pengguna;

            if (hashedPassword) {
                await query(
                    `
                        UPDATE pengguna
                        SET nis = ?, password = ?
                        WHERE id_pengguna = ?
                    `,
                    [nis, hashedPassword, idPengguna]
                );
            } else {
                await query(
                    `
                        UPDATE pengguna
                        SET nis = ?
                        WHERE id_pengguna = ?
                    `,
                    [nis, idPengguna]
                );
            }

            await query(
                `
                    UPDATE santri
                    SET nis = ?,
                        nama = ?,
                        id_kelompok = ?,
                        status = ?
                    WHERE id_santri = ?
                `,
                [
                    nis,
                    nama,
                    id_kelompok || null,
                    statusSantri,
                    id,
                ]
            );
        });

        res.status(200).json({
            message: password
                ? "Data dan password Santri berhasil diperbarui."
                : "Data Santri berhasil diperbarui.",
        });
    } catch (error) {
        console.error("Gagal memperbarui Santri:", error.message);

        res.status(error.status || (
            error.code === "ER_DUP_ENTRY" ? 409 : 500
        )).json({
            message:
                error.status
                    ? error.message
                    : error.code === "ER_DUP_ENTRY"
                        ? "NIS sudah digunakan."
                        : "Gagal memperbarui data Santri.",
        });
    }
};

// =====================================
// 7. MENONAKTIFKAN AKUN USTADZ
// =====================================
const deleteUstadz = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query(
            `
                UPDATE ustadz
                SET status = 'Cuti'
                WHERE id_ustadz = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Data Ustadz tidak ditemukan.",
            });
        }

        res.status(200).json({
            message: "Akun Ustadz berhasil dinonaktifkan.",
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Gagal menonaktifkan akun Ustadz.",
        });
    }
};

// =====================================
// 8. MENONAKTIFKAN AKUN SANTRI
// =====================================
const deleteSantri = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query(
            `
                UPDATE santri
                SET status = 'Tidak Aktif'
                WHERE id_santri = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Data Santri tidak ditemukan.",
            });
        }

        res.status(200).json({
            message: "Akun Santri berhasil dinonaktifkan.",
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Gagal menonaktifkan akun Santri.",
        });
    }
};

module.exports = {
    getAllPengguna,
    getAllKelompok,
    createUstadz,
    createSantri,
    updateUstadz,
    updateSantri,
    deleteUstadz,
    deleteSantri,
};
