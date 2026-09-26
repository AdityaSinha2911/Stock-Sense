const db = require("../config/database");

const createUser = (name, email, password, role) => {
    if (getUserByEmail(email)) {
        const error = new Error("User with this email already exists");
        error.code = "USER_EMAIL_EXISTS";
        throw error;
    }

    const stmt = db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        name,
        email,
        password,
        role
    );

    return getUserById(result.lastInsertRowid);
};

const getUserByEmail = (email) => {
    return db.prepare(`
        SELECT id, name, email, password, role, created_at, updated_at
        FROM users
        WHERE email = ? COLLATE NOCASE
    `).get(email);
};

const getUserById = (id) => {
    return db.prepare(`
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = ?
    `).get(id);
};

const updatePassword = (email, hashedPassword) => {
    return db.prepare(`
        UPDATE users
        SET password = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
    `).run(hashedPassword, email);
};

const saveResetOtp = (email, otp, expiry) => db.prepare(`
    UPDATE users
    SET reset_otp = ?, reset_otp_expiry = ?, updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
`).run(otp, expiry, email);

const consumeResetOtp = (email, otp) => db.prepare(`
    UPDATE users
    SET reset_otp = NULL, reset_otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE email = ? AND reset_otp = ? AND reset_otp_expiry > CURRENT_TIMESTAMP
`).run(email, otp);

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    updatePassword,
    saveResetOtp,
    consumeResetOtp
};