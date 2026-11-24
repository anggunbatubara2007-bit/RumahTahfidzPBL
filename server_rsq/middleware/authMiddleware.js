
const jwt = require("jsonwebtoken");

// Memeriksa token JWT pengguna
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Memastikan token tersedia
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Akses ditolak. Silakan login terlebih dahulu.",
        });
    }

    const token = authHeader.split(" ")[1];

    // Memverifikasi token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: "Token tidak valid atau sudah kedaluwarsa.",
            });
        }

        req.user = decoded;
        next();
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
