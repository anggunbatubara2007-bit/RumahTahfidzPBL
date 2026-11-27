
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Memeriksa token dan status akun pengguna
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Akses ditolak. Silakan login terlebih dahulu.",
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: "Token tidak valid atau sudah kedaluwarsa.",
            });
        }

        const sql = `
            SELECT
                p.id_pengguna,
                p.role,
                u.status AS status_ustadz,
                s.status AS status_santri
            FROM pengguna p
            LEFT JOIN ustadz u
                ON p.id_pengguna = u.id_pengguna
            LEFT JOIN santri s
                ON p.id_pengguna = s.id_pengguna
            WHERE p.id_pengguna = ?
            LIMIT 1
        `;

        db.query(sql, [decoded.id_pengguna], (dbErr, results) => {
            if (dbErr) {
                console.error("Pemeriksaan status akun gagal:", dbErr.message);

                return res.status(500).json({
                    message: "Gagal memeriksa status akun.",
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Akun pengguna tidak ditemukan.",
                });
            }

            const account = results[0];

            // Memastikan role pada token sesuai dengan database
            if (account.role !== decoded.role) {
                return res.status(403).json({
                    message: "Role akun tidak sesuai.",
                });
            }

            let statusAkun = "Aktif";

            if (account.role === "Ustadz") {
                statusAkun = account.status_ustadz;

                if (!statusAkun) {
                    return res.status(403).json({
                        message: "Data status Ustadz tidak ditemukan.",
                    });
                }
            } else if (account.role === "Santri") {
                statusAkun = account.status_santri;

                if (!statusAkun) {
                    return res.status(403).json({
                        message: "Data status Santri tidak ditemukan.",
                    });
                }
            }

            req.user = {
                ...decoded,
                status: statusAkun,
            };

            // Ustadz Cuti dan Santri Tidak Aktif hanya boleh melihat data.
            const akunHanyaBisaMelihat =
                (account.role === "Ustadz" && statusAkun === "Cuti") ||
                (account.role === "Santri" && statusAkun === "Tidak Aktif");

            const metodePerubahanData = [
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
            ];

            if (
                akunHanyaBisaMelihat &&
                metodePerubahanData.includes(req.method)
            ) {
                return res.status(403).json({
                    message:
                        "Akun Anda berstatus " +
                        statusAkun +
                        ". Anda hanya dapat melihat data dan riwayat.",
                });
            }

            next();
        });
    });
};

// Membatasi akses berdasarkan role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Akses ditolak. Kamu tidak memiliki izin.",
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    authorizeRoles,
};
