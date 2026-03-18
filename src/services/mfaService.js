const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

async function generateMfaSecret(email, issuer) {
  const secret = speakeasy.generateSecret({
    name: `${issuer}:${email}`,
    issuer,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeDataUrl,
  };
}

function verifyTotpToken(secretBase32, token) {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: "base32",
    token,
    window: 1,
  });
}

module.exports = {
  generateMfaSecret,
  verifyTotpToken,
};
