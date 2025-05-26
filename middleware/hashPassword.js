const bcrypt = require('bcrypt');

// Used only when you want to generate a hash manually
async function generateHash() {
  const password = 'leave';  // put your new password here
  const hash = await bcrypt.hash(password, 10);
  console.log("Hashed password:", hash);
}

// This is the function used in login
async function comparePasswords(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Export only the compare function
module.exports = {
  comparePasswords
};

// If you want to generate manually, uncomment this:
generateHash();
