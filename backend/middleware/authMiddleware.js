const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = null;

        if (authHeader) {
            const tokenMatch = /^Bearer\s+(\S+)$/.exec(authHeader.trim());
            if (tokenMatch) {
                token = tokenMatch[1];
            }
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const secret = process.env.JWT_SECRET || "stocksense_jwt_secret_key_2026";
            const decoded = jwt.verify(token, secret);
            if (decoded && (decoded.userId !== undefined || decoded.id !== undefined)) {
                req.user = {
                    id: decoded.userId || decoded.id,
                    userId: decoded.userId || decoded.id,
                    name: decoded.name || "User",
                    email: decoded.email || "",
                    role: decoded.role
                };
                res.locals.currentUser = req.user;
                return next();
            }
        }

        // Check stocksense_user session cookie
        if (req.cookies && req.cookies.stocksense_user) {
            try {
                const sessionUser = typeof req.cookies.stocksense_user === "string" 
                    ? JSON.parse(req.cookies.stocksense_user) 
                    : req.cookies.stocksense_user;
                if (sessionUser && (sessionUser.id || sessionUser.userId)) {
                    req.user = {
                        id: sessionUser.id || sessionUser.userId,
                        userId: sessionUser.id || sessionUser.userId,
                        name: sessionUser.name,
                        email: sessionUser.email,
                        role: sessionUser.role
                    };
                    res.locals.currentUser = req.user;
                    return next();
                }
            } catch (e) {}
        }

        // If unauthenticated:
        if (req.originalUrl && req.originalUrl.startsWith("/api")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        return res.redirect("/login");

    } catch (error) {
        if (req.originalUrl && req.originalUrl.startsWith("/api")) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }
        return res.redirect("/login");
    }
};

module.exports = protect;