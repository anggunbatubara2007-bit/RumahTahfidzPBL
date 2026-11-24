
const express = require("express");
const router = express.Router();

const {
    getAllPengguna,
    createUstadz,
    createSantri,
} = require("../controllers/penggunaController");

const {
    verifyToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// Semua endpoint hanya bisa diakses Admin
router.use(verifyToken, authorizeRoles("Admin"));

// Menampilkan semua pengguna
router.get("/", getAllPengguna);

// Membuat akun Ustadz
router.post("/ustadz", createUstadz);

// Membuat akun Santri
router.post("/santri", createSantri);

module.exports = router;
