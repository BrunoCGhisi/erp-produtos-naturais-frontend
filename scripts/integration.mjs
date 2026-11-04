// Own every service used by this run; never target an existing backend/database.
import { spawn } from "node:child_process";
import { openSync, closeSync } from "node:fs";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const commit = "e0f312e611d56ab73a4a8e3d5832f8b8874ff362";
const logs = path.join(root, "integration-artifacts");
const temp = await mkdtemp(path.join(os.tmpdir(), "vila-integration-"));
const backend = path.join(temp, "backend");
const frontend = path.join(temp, "frontend");
const container = `vila-integration-${randomUUID()}`;
const password = randomUUID();
const children = new Set();
const streams = [];
let stopping = false;
let databaseCreated = false;
const env = { ...process.env, BACKEND_API_URL: "http://127.0.0.1:8081" };
await rm(logs, { recursive: true, force: true });
await mkdir(logs, { recursive: true });
function start(command, args, cwd, extraEnv = {}, log) {
  const stream = log ? openSync(path.join(temp, log), "w") : undefined;
  if (stream !== undefined) streams.push([stream, log]);
  const child = spawn(command, args, {
    cwd, env: { ...env, ...extraEnv }, detached: true,
    stdio: ["ignore", stream ?? "inherit", stream ?? "inherit"],
  });
  // Install listeners immediately, including for commands missing from PATH.
  child.done = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} terminou (${signal || code}); consulte ${log || "a saída"}.`)));
  });
  child.done.catch(() => {});
  children.add(child);
  return child;
}
async function run(command, args, cwd = root, extraEnv = {}, log) {
  const child = start(command, args, cwd, extraEnv, log);
  try { await child.done; } finally { children.delete(child); }
}
async function freePort(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", () => reject(new Error(`Porta ${port} ocupada. Encerre o serviço antes de executar; nenhum servidor existente será reutilizado.`)));
    server.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => server.close(resolve));
}
async function ready(url, child, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (stopping) throw new Error("Execução interrompida.");
    if (child.exitCode !== null || child.signalCode) { await child.done; throw new Error("Servidor encerrado antes da prontidão."); }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok && Array.isArray(await response.json())) return;
    } catch { /* Retry until the owned API is ready. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`API não ficou pronta: ${url}`);
}
async function stop(child) {
  if (!child.pid) return;
  try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  await Promise.race([child.done.catch(() => {}), new Promise((resolve) => setTimeout(resolve, 3000))]);
  try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
}
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  stopping = true;
  for (const child of children) if (child.pid) { try { process.kill(-child.pid, "SIGTERM"); } catch {} }
});
try {
  await Promise.all([freePort(8081), freePort(3100)]);
  if (!process.version.startsWith("v24.")) throw new Error("Use Node.js 24.");
  await run("java", ["-version"], root, {}, "java.log");
  if (!/version "21[."]/.test(await readFile(path.join(temp, "java.log"), "utf8")))
    throw new Error("Use Java 21 (confira JAVA_HOME e PATH).");
  await mkdir(backend);
  await run("git", ["init", "--quiet", backend]);
  await run("git", ["fetch", "--depth=1", "https://github.com/Zayma1/erp-produtos-naturais-backend.git", commit], backend);
  await run("git", ["checkout", "--quiet", "--detach", "FETCH_HEAD"], backend);
  databaseCreated = true; // Also clean up if Docker is interrupted during startup.
  await run("docker", ["run", "--detach", "--rm", "--name", container,
    "--publish", "127.0.0.1::5432", "--env", "POSTGRES_DB=catalog",
    "--env", "POSTGRES_USER=catalog", "--env", "POSTGRES_PASSWORD", "postgres:16"], root,
    { POSTGRES_PASSWORD: password }, "database-start.log");
  const inspect = start("docker", ["inspect", "--format", '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}', container], root, {}, "database-port.log");
  await inspect.done; children.delete(inspect);
  const port = (await readFile(path.join(temp, "database-port.log"), "utf8")).trim();
  for (let attempt = 0; ; attempt++) {
    try { await run("docker", ["exec", container, "pg_isready", "-U", "catalog", "-d", "catalog"]); break; }
    catch (error) { if (attempt === 60 || stopping) throw error; await new Promise((resolve) => setTimeout(resolve, 1000)); }
  }
  await run("chmod", ["+x", "mvnw"], backend);
  const api = start("./mvnw", ["--batch-mode", "--no-transfer-progress", "spring-boot:run"], backend, {
    SERVER_ADDRESS: "127.0.0.1", SERVER_PORT: "8081",
    SPRING_DATASOURCE_URL: `jdbc:postgresql://127.0.0.1:${port}/catalog`,
    SPRING_DATASOURCE_USERNAME: "catalog", SPRING_DATASOURCE_PASSWORD: password,
  }, "backend.log");
  console.log(`Backend fixado em ${commit}; aguardando API real…`);
  await ready("http://127.0.0.1:8081/api/categorias", api, 600000);
  await cp(root, frontend, { recursive: true, filter: (source) =>
    ![".git", ".next", "node_modules", "integration-artifacts", "playwright-report", "playwright-live-report", "test-results"].includes(path.basename(source)) && !path.basename(source).startsWith(".env") });
  // Reuse only installed dependencies, never a running server or build directory.
  await run("ln", ["-s", path.join(root, "node_modules"), path.join(frontend, "node_modules")]);
  await run("npm", ["run", "build"], frontend, {}, "frontend-build.log");
  const web = start("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", "3100"], frontend, {}, "frontend.log");
  await ready("http://127.0.0.1:3100/api/categorias", web, 60000);
  const testEnv = { SMOKE_BASE_URL: "http://127.0.0.1:3100", CATALOG_DISPOSABLE: "1" };
  await run("npm", ["run", "test:live"], root, testEnv);
  await run("npx", ["playwright", "test", "--config=playwright.live.config.ts"], root, testEnv);
  console.log("Integração real concluída: smoke e Chromium desktop/mobile.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const child of children) {
    try { await stop(child); }
    catch (error) { process.exitCode = 1; console.error(`Falha ao encerrar processo: ${error.message}`); }
  }
  // rm -f is idempotent even when startup failed before container creation.
  try { if (databaseCreated) await run("docker", ["rm", "--force", container], root, {}, "database-cleanup.log"); }
  catch { process.exitCode = 1; console.error(`Falha ao remover ${container}.`); }
  for (const [stream, name] of streams) {
    closeSync(stream);
    const raw = await readFile(path.join(temp, name), "utf8");
    await writeFile(path.join(logs, name), raw.replaceAll(password, "[REDACTED]").replace(/(Using generated security password:) .*/g, "$1 [REDACTED]"));
  }
  await rm(temp, { recursive: true, force: true });
  if (stopping) process.exitCode = 1;
}
