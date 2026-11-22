
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_rsq",
    port: 3306,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const tanya = (pesan) =>
    new Promise((resolve) => rl.question(pesan, resolve));

async function buatAdmin() {
    let koneksi;

    try {
        console.log("\n=== INISIALISASI ADMIN RSQ ===");

        const nama = (await tanya("Nama Admin: ")).trim();
        const username = (await tanya("Username: ")).trim();
        const password = await tanya("Password: ");

        if (!nama || !username || !password) {
            throw new Error("Semua data wajib diisi.");
        }

        if (password.length < 8) {
            throw new Error("Password minimal 8 karakter.");
        }

        koneksi = await db.getConnection();
        await koneksi.beginTransaction();

        const [akun] = await koneksi.query(
            "SELECT id_pengguna FROM pengguna WHERE username = ?",
            [username]
        );

        if (akun.length > 0) {
            throw new Error("Username sudah digunakan.");
        }

        const hash = await bcrypt.hash(password, 10);

        const [hasil] = await koneksi.query(
            `INSERT INTO pengguna (username, password, role)
             VALUES (?, ?, 'admin')`,
            [username, hash]
        );

        await koneksi.query(
            `INSERT INTO admin (id_pengguna, nama)
             VALUES (?, ?)`,
            [hasil.insertId, nama]
        );

        await koneksi.commit();

        console.log("\nAdmin berhasil dibuat!");
        console.log("Nama:", nama);
        console.log("Username:", username);
        console.log("Role: admin");

    } catch (error) {
        if (koneksi) {
            await koneksi.rollback();
        }

        console.error("\nGagal:", error.message);

    } finally {
        if (koneksi) koneksi.release();
        await db.end();
        rl.close();
    }
}

buatAdmin();
