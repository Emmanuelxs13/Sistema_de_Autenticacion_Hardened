const http = require("node:http");

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

function getJson(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${pathname}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const body = JSON.parse(data || "{}");
          resolve({ statusCode: res.statusCode || 0, body });
        } catch (error) {
          reject(new Error(`Respuesta inválida en ${pathname}: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Error HTTP en ${pathname}: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy(new Error(`Timeout en ${pathname}`));
    });
  });
}

async function run() {
  const health = await getJson("/api/health");
  const live = await getJson("/api/health/live");
  const ready = await getJson("/api/health/ready");

  if (health.statusCode !== 200 || !health.body.ok) {
    throw new Error("/api/health no está OK");
  }

  if (live.statusCode !== 200 || !live.body.ok) {
    throw new Error("/api/health/live no está OK");
  }

  if (ready.statusCode !== 200 || !ready.body.ok) {
    throw new Error("/api/health/ready no está OK");
  }

  console.log("Smoke test OK", {
    health: health.body.ok,
    live: live.body.ok,
    ready: ready.body.ok,
  });
}

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
