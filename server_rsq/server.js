
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi database MySQL Laragon
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_rsq",
    port: 3306,
});

// Endpoint utama
app.get("/", (req, res) => {
    res.json({
        message: "Backend Aplikasi Pondok Tahfidz RSQ Berhasil Berjalan",
    });
});

// Menguji koneksi database
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

// Mengecek daftar tabel database
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

// Menghubungkan database sebelum menjalankan server
db.connect((err) => {
    if (err) {
        console.error("Koneksi database gagal!");
        console.error("Kode error:", err.code);
        console.error("Pesan error:", err.message);
        return;
    }

    console.log("Database RSQ berhasil terhubung!");

    app.listen(PORT, () => {
        console.log(`Server RSQ berjalan di http://localhost:${PORT}`);
    });
});
