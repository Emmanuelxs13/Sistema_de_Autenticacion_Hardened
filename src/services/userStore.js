const fs = require("node:fs/promises");
const path = require("node:path");

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

async function findById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id) || null;
}

async function insertUser(user) {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
}

async function updateUser(userId, updater) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return null;
  }

  users[index] = updater(users[index]);
  await writeUsers(users);
  return users[index];
}

module.exports = {
  findByEmail,
  findById,
  insertUser,
  updateUser,
};
