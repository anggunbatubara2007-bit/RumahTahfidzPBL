
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Routes
const authRoutes = require("./routes/authRoutes");
const penggunaRoutes = require("./routes/penggunaRoutes");

// Middleware autentikasi
const {
    verifyToken,
    authorizeRoles,
} = require("./middleware/authMiddleware");

// Middleware utama
app.use(cors());
app.use(express.json());

// Menghubungkan routes
app.use("/api/auth", authRoutes);
app.use("/api/pengguna", penggunaRoutes);

// =====================================
// ENDPOINT PENGUJIAN ROLE
// =====================================

// Menguji akses khusus Admin
app.get(
    "/api/admin/test",
    verifyToken,
    authorizeRoles("Admin"),
    (req, res) => {
        res.json({
            message: "Akses berhasil! Kamu login sebagai Admin.",
            user: req.user,
        });
    }
);

// Menguji akses khusus Ustadz
app.get(
    "/api/ustadz/test",
    verifyToken,
    authorizeRoles("Ustadz"),
    (req, res) => {
        res.json({
            message: "Akses berhasil! Kamu login sebagai Ustadz.",
            user: req.user,
        });
    }
);

// Menguji akses khusus Santri
app.get(
    "/api/santri/test",
    verifyToken,
    authorizeRoles("Santri"),
    (req, res) => {
        res.json({
            message: "Akses berhasil! Kamu login sebagai Santri.",
            user: req.user,
        });
    }
);

// =====================================
// ENDPOINT UTAMA
// =====================================

app.get("/", (req, res) => {
    res.json({
        message: "Backend Aplikasi Pondok Tahfidz RSQ Berhasil Berjalan",
    });
});

// =====================================
// MENGUJI KONEKSI DATABASE
// =====================================

app.get("/test-db", (req, res) => {
    db.query("SELECT 1 AS hasil", (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Koneksi database gagal",
                error: err.message,
            });
        }

        res.json({
            message: "Database RSQ berhasil terhubung!",
            data: results,
        });
    });
});

// =====================================
// MENGECEK DAFTAR TABEL DATABASE
// =====================================

app.get("/api/tables", (req, res) => {
    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Gagal mengambil daftar tabel",
                error: err.message,
            });
        }

        res.json({
            message: "Daftar tabel database RSQ",
            data: results,
        });
    });
});

// =====================================
// MENJALANKAN SERVER
// =====================================

app.listen(PORT, () => {
    console.log(`Server RSQ berjalan di http://localhost:${PORT}`);
});
