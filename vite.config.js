import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/* Mounts api/analyse.js during `npm run dev`. In production the
   same file is a Vercel serverless function — one handler, both
   environments, so the demo and the deploy can't drift apart. */
function apiRoutes() {
  return {
    name: "api-routes",
    configureServer(server) {
      server.middlewares.use("/api/analyse", async (req, res, next) => {
        if (req.method !== "POST") return next();
        let raw = "";
        for await (const chunk of req) raw += chunk;
        req.body = raw;
        try {
          const { default: handler } = await server.ssrLoadModule("/api/analyse.js");
          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: err?.message ?? "handler failed" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  /* Vite only exposes VITE_-prefixed vars, and only to the client.
     The API handler runs in Node and reads process.env, so lift the
     key across explicitly — otherwise a .env file looks configured
     and silently does nothing. The empty prefix means "load all". */
  const env = loadEnv(mode, process.cwd(), "");
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [react(), tailwindcss(), apiRoutes()],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  };
});
