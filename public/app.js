async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Error de servidor");
  }

  return data;
}

function renderResult(elementId, payload, isError = false) {
  const target = document.getElementById(elementId);
  target.classList.toggle("error", isError);
  target.classList.toggle("success", !isError);

  if (typeof payload === "string") {
    target.textContent = payload;
    return;
  }

  target.textContent = JSON.stringify(payload, null, 2);
}

document
  .getElementById("register-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);
      const data = await postJson("/api/auth/register", {
        email: formData.get("email"),
        password: formData.get("password"),
      });

      renderResult("register-result", data);
    } catch (error) {
      renderResult("register-result", error.message, true);
    }
  });

document
  .getElementById("mfa-setup-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);
      const data = await postJson("/api/auth/mfa/setup", {
        email: formData.get("email"),
      });

      renderResult("mfa-setup-result", data);

      if (data?.mfaSetup?.qrCodeDataUrl) {
        const img = document.createElement("img");
        img.src = data.mfaSetup.qrCodeDataUrl;
        img.alt = "QR MFA";
        img.style.maxWidth = "180px";
        img.style.marginTop = "8px";
        img.style.borderRadius = "8px";

        document.getElementById("mfa-setup-result").appendChild(img);
      }
    } catch (error) {
      renderResult("mfa-setup-result", error.message, true);
    }
  });

document
  .getElementById("mfa-verify-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);
      const data = await postJson("/api/auth/mfa/verify-setup", {
        email: formData.get("email"),
        token: formData.get("token"),
      });

      renderResult("mfa-verify-result", data);
    } catch (error) {
      renderResult("mfa-verify-result", error.message, true);
    }
  });

document
  .getElementById("login-step1-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);
      const data = await postJson("/api/auth/login", {
        email: formData.get("email"),
        password: formData.get("password"),
      });

      renderResult("login-step1-result", data);
    } catch (error) {
      renderResult("login-step1-result", error.message, true);
    }
  });

document
  .getElementById("login-step2-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);
      const data = await postJson("/api/auth/login/2fa", {
        tempToken: formData.get("tempToken"),
        mfaCode: formData.get("mfaCode"),
      });

      renderResult("login-step2-result", data);
    } catch (error) {
      renderResult("login-step2-result", error.message, true);
    }
  });

document.getElementById("me-btn").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No autorizado");
    }

    renderResult("session-result", data);
  } catch (error) {
    renderResult("session-result", error.message, true);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    const data = await postJson("/api/auth/logout", {});
    renderResult("session-result", data);
  } catch (error) {
    renderResult("session-result", error.message, true);
  }
});
