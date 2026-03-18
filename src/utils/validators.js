function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").toLowerCase());
}

function isStrongPassword(password) {
  // Regla mínima de Sprint 1 para evitar claves triviales.
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(
    String(password || ""),
  );
}

module.exports = {
  isValidEmail,
  isStrongPassword,
};
