
const express = require("express");
const router = express.Router();

const {
    getAllPengguna,
    getAllKelompok,
    createUstadz,
    createSantri,
    updateUstadz,
    updateSantri,
    deleteUstadz,
    deleteSantri,
} = require("../controllers/penggunaController");

const {
    verifyToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// Semua endpoint hanya bisa diakses Admin
router.use(verifyToken, authorizeRoles("Admin"));

// =====================================
// MENAMPILKAN KELOMPOK TAHFIDZ
// =====================================
router.get("/kelompok", getAllKelompok);

// =====================================
// MENAMPILKAN SEMUA DATA PENGGUNA
// =====================================
router.get("/", getAllPengguna);

// =====================================
// MEMBUAT AKUN
// =====================================
router.post("/ustadz", createUstadz);
router.post("/santri", createSantri);

// =====================================
// MENGEDIT AKUN
// =====================================
router.put("/ustadz/:id", updateUstadz);
router.put("/santri/:id", updateSantri);

// =====================================
// MENONAKTIFKAN AKUN
// =====================================
router.delete("/ustadz/:id", deleteUstadz);
router.delete("/santri/:id", deleteSantri);

module.exports = router;
