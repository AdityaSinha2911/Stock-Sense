const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    createUser,
    getUserByEmail,
    getUserById,
    updatePassword,
    saveResetOtp,
    consumeResetOtp
} = require("../models/userModel");
const { generateOtp } = require("../utils/otp");


// ========================================
// REGISTER
// ========================================
const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
        } = req.body;

        // Validation
        if (!name || !email || !password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Name, email and a password of at least 6 characters are required"
            });
        }

        // Check existing user
        const existingUser = getUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Allowed roles
        const userRole = "warehouse_staff";

        // Create user
        const user = createUser(
            name,
            email,
            hashedPassword,
            userRole
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });

    } catch (error) {
        console.error("Register error:", error);

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "USER_EMAIL_EXISTS") {
            return res.status(409).json({ success: false, message: "User with this email already exists" });
        }

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ========================================
// LOGIN
// ========================================
const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = getUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT
        const secret = process.env.JWT_SECRET || "stocksense_jwt_secret_key_2026";
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            secret,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ========================================
// LOGOUT
// ========================================
const logout = (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


// ========================================
// GET CURRENT USER
// ========================================
const getMe = (req, res) => {
    try {
        const user = getUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const forgotPassword = (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = getUserByEmail(email);
        const response = {
            success: true,
            message: "If the account exists, a reset OTP has been generated"
        };

        if (user) {
            const otp = generateOtp();
            const expiry = new Date(Date.now() + 10 * 60 * 1000)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ");
            saveResetOtp(email, otp, expiry);
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and a password of at least 6 characters are required"
            });
        }

        const result = consumeResetOtp(email, otp);
        if (result.changes === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        updatePassword(email, await bcrypt.hash(newPassword, 10));
        return res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    getMe
};