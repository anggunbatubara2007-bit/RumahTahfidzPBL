const express = require("express");
const router = express.Router();

const {
    getDashboard,
} = require("../controllers/adminDashboardController");

const {
    verifyToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// Hanya Admin yang dapat mengakses Dashboard Admin
router.get(
    "/dashboard",
    verifyToken,
    authorizeRoles("Admin"),
    getDashboard
);

module.exports = router;