
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validasi input
        if (!identifier || !password) {
            return res.status(400).json({
                message: "Username/NIS dan password wajib diisi.",
            });
        }

        // Mencari akun berdasarkan username atau NIS
        const sql = `
            SELECT
                p.id_pengguna,
                p.username,
                p.nis,
                p.password,
                p.role,
                a.id_admin,
                a.nama AS nama_admin,
                u.id_ustadz,
                u.nama AS nama_ustadz,
                u.status AS status_ustadz,
                s.id_santri,
                s.id_kelompok,
                s.nama AS nama_santri,
                s.status AS status_santri
            FROM pengguna p
            LEFT JOIN admin a ON p.id_pengguna = a.id_pengguna
            LEFT JOIN ustadz u ON p.id_pengguna = u.id_pengguna
            LEFT JOIN santri s ON p.id_pengguna = s.id_pengguna
            WHERE
                (p.username = ? AND p.role IN ('Admin', 'Ustadz'))
                OR
                (p.nis = ? AND p.role = 'Santri')
            LIMIT 1
        `;

        db.query(sql, [identifier, identifier], async (err, results) => {
            if (err) {
                console.error("Login error:", err.message);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server.",
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Username/NIS atau password salah.",
                });
            }

            const user = results[0];

            // Memeriksa password menggunakan bcrypt
            const passwordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordValid) {
                return res.status(401).json({
                    message: "Username/NIS atau password salah.",
                });
            }

            // Memastikan kunci JWT tersedia
            if (!process.env.JWT_SECRET) {
                console.error("JWT_SECRET belum dikonfigurasi.");
                return res.status(500).json({
                    message: "Konfigurasi autentikasi belum tersedia.",
                });
            }

            // Menentukan profil berdasarkan role
            let profile = {};

            if (user.role === "Admin") {
                profile = {
                    id_admin: user.id_admin,
                    nama: user.nama_admin,
                };
            } else if (user.role === "Ustadz") {
                profile = {
                    id_ustadz: user.id_ustadz,
                    nama: user.nama_ustadz,
                    status: user.status_ustadz,
                };
            } else if (user.role === "Santri") {
                profile = {
                    id_santri: user.id_santri,
                    id_kelompok: user.id_kelompok,
                    nama: user.nama_santri,
                    nis: user.nis,
                    status: user.status_santri,
                };
            }

            // Membuat token JWT
            const token = jwt.sign(
                {
                    id_pengguna: user.id_pengguna,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
                }
            );

            return res.status(200).json({
                message: "Login berhasil.",
                token,
                user: {
                    id_pengguna: user.id_pengguna,
                    username: user.username,
                    nis: user.nis,
                    role: user.role,
                    ...profile,
                },
            });
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            message: "Terjadi kesalahan pada server.",
        });
    }
};

module.exports = { login };
