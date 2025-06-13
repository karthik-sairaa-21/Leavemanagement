const bcrypt = require("bcrypt");

async function generateHash(password) {
  if (!password) throw new Error("Password is required to hash.");
  return await bcrypt.hash(password, 10);
}

async function comparePasswords(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  generateHash,
  comparePasswords
};
