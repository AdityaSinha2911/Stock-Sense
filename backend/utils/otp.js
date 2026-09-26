const crypto = require("crypto");

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

module.exports = { generateOtp };
