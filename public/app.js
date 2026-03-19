function resolveApiError(response, data, url) {
  if (data?.error) {
    return data.error;
  }

  if (response.status === 404) {
    return `No se encontró ${url}. Por favor, verifica que la aplicación esté iniciada correctamente.`;
  }

  if (response.status >= 500) {
    return "El servidor está experimentando dificultades. Por favor, intenta de nuevo en unos momentos.";
  }

  return `Error en la solicitud: ${response.status}`;
}

async function postJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `No hay conexión con el servidor. Por favor, verifica que la aplicación esté ejecutándose.`,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resolveApiError(response, data, url));
  }

  return data;
}

function checkBackendStatus() {
  const statusEl = document.getElementById("api-status");

  return fetch("/api/health", { credentials: "include" })
    .then((response) =>
      response
        .json()
        .catch(() => ({}))
        .then((data) => ({ response, data })),
    )
    .then(({ response, data }) => {
      if (response.ok && data?.ok) {
        statusEl.textContent =
          "Servicio disponible y funcionando correctamente.";
        statusEl.classList.add("ok");
        statusEl.classList.remove("warn", "error");
        return;
      }

      statusEl.textContent =
        "Servicio disponible pero reporta problemas internos.";
      statusEl.classList.add("warn");
      statusEl.classList.remove("ok", "error");
    })
    .catch((error) => {
      statusEl.textContent = `No hay conexión con el servidor. Por favor, verifica que la aplicación esté ejecutándose.`;
      statusEl.classList.add("error");
      statusEl.classList.remove("ok", "warn");
    });
}

function activateView(viewName) {
  const tabs = document.querySelectorAll(".nav-tab");
  const views = document.querySelectorAll(".view");

  tabs.forEach((tab) => {
    const isActive = tab.dataset.view === viewName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  views.forEach((view) => {
    const isActive = view.id === `view-${viewName}`;
    view.classList.toggle("active", isActive);
    view.hidden = !isActive;
  });
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => activateView(tab.dataset.view));
});

document.getElementById("go-demo-btn").addEventListener("click", () => {
  activateView("demo");
});

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
        img.alt = "Código QR de autenticación";
        img.className = "mfa-qr";

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
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(resolveApiError(response, data, "/api/auth/me"));
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

document.getElementById("refresh-btn").addEventListener("click", async () => {
  try {
    const data = await postJson("/api/auth/refresh", {});
    renderResult("security-result", data);
  } catch (error) {
    renderResult("security-result", error.message, true);
  }
});

document.getElementById("audit-btn").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/auth/audit-log?limit=20", {
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(resolveApiError(response, data, "/api/auth/audit-log"));
    }

    renderResult("security-result", data);
  } catch (error) {
    renderResult("security-result", error.message, true);
  }
});

void checkBackendStatus();
