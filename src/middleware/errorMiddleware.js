function errorMiddleware(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    // Log interno para depuración sin exponer stack al cliente.
    console.error(err);
  }

  return res.status(statusCode).json({
    error: err.message || "Error interno del servidor",
  });
}

module.exports = {
  errorMiddleware,
};
