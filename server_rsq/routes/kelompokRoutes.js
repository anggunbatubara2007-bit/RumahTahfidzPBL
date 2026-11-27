
const express = require("express");
const router = express.Router();

const {
    getAllKelompok,
    createKelompok,
    updateKelompok,
    deleteKelompok,
} = require("../controllers/kelompokController");

const {
    verifyToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", getAllKelompok);
router.post("/", createKelompok);
router.put("/:id", updateKelompok);
router.delete("/:id", deleteKelompok);

module.exports = router;
