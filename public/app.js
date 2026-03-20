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

function getEyeIcon(isHidden) {
  return isHidden
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5C6.5 5 2.1 8.4.5 12c1.6 3.6 6 7 11.5 7s9.9-3.4 11.5-7c-1.6-3.6-6-7-11.5-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.3 1 1 2.3l3.1 3.1C2.5 6.7 1.2 8.3.5 10c1.6 3.6 6 7 11.5 7 2.1 0 4-.5 5.7-1.4l4 4L23 18.3 2.3 1zM12 15a4 4 0 0 1-4-4c0-.5.1-1 .3-1.4l5.1 5.1c-.4.2-.9.3-1.4.3zm0-8c2.2 0 4 1.8 4 4 0 .5-.1 1-.3 1.4l2.8 2.8c1.8-1.1 3.2-2.8 4-4.7-1.6-3.6-6-7-11.5-7-.9 0-1.8.1-2.7.3l2.3 2.3c.6-.2 1.2-.4 1.9-.4z" fill="currentColor"/></svg>';
}

function enhancePasswordInputs() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach((input) => {
    if (input.dataset.enhanced === "true") {
      return;
    }

    const label = input.parentElement;
    const wrapper = document.createElement("div");
    wrapper.className = "password-input-wrap";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "password-toggle";
    toggleButton.setAttribute("aria-label", "Mostrar contraseña");
    toggleButton.setAttribute("aria-pressed", "false");
    toggleButton.innerHTML = getEyeIcon(true);

    const capsWarning = document.createElement("small");
    capsWarning.className = "caps-warning";
    capsWarning.hidden = true;
    capsWarning.textContent = "Bloq Mayús activado.";

    wrapper.appendChild(toggleButton);
    if (label) {
      label.appendChild(capsWarning);
    }

    const updateCapsWarning = (event) => {
      const isCapsOn =
        typeof event.getModifierState === "function" &&
        event.getModifierState("CapsLock");
      capsWarning.hidden = !isCapsOn;
    };

    input.addEventListener("keydown", updateCapsWarning);
    input.addEventListener("keyup", updateCapsWarning);
    input.addEventListener("blur", () => {
      capsWarning.hidden = true;
    });

    toggleButton.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      toggleButton.setAttribute("aria-pressed", String(isHidden));
      toggleButton.setAttribute(
        "aria-label",
        isHidden ? "Ocultar contraseña" : "Mostrar contraseña",
      );
      toggleButton.innerHTML = getEyeIcon(!isHidden);
      input.focus({ preventScroll: true });
    });

    input.dataset.enhanced = "true";
  });
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => activateView(tab.dataset.view));
});

document.getElementById("go-demo-btn").addEventListener("click", () => {
  activateView("demo");
});

enhancePasswordInputs();

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
