const fs = require("fs/promises");
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "data", "users.json");

async function readUsers() {
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw);
}

async function writeUsers(users) {
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2), "utf8");
}

async function findByEmail(email) {
  const users = await readUsers();
  return users.find((user) => user.email === email.toLowerCase()) || null;
}

async function insertUser(user) {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
}

module.exports = {
  findByEmail,
  insertUser,
};
