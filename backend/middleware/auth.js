const bcrypt = require('bcrypt');

/**
 * Simple admin authentication middleware
 */
async function authenticateAdmin(req, res, next) {
    // Check both headers and body for password
    const password = req.headers.password || req.body.password;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!password) {
        return res.status(401).json({ error: '비밀번호가 필요합니다.' });
    }

    if (password === adminPassword) {
        next();
    } else {
        res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }
}

module.exports = {
    authenticateAdmin
};
