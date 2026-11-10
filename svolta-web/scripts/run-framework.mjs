import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";
import { readFileSync, writeFileSync } from 'node:fs';

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build", "prepare"].includes(command)) throw new Error("Expected dev, build or prepare.");
const { website } = JSON.parse(readFileSync(new URL('../src/data/site-content.json', import.meta.url), 'utf8'));
writeFileSync(new URL('../public/robots.txt', import.meta.url), `User-agent: *\n${website.indexingEnabled ? 'Allow: /\nDisallow: /api/\nDisallow: /manage/\nDisallow: /cart/\nDisallow: /checkout/' : 'Disallow: /'}\nSitemap: ${website.origin}/sitemap.xml\n`);
const headersUrl = new URL('../public/_headers', import.meta.url);
let headerLines = readFileSync(headersUrl, 'utf8').split('\n').filter(line => !/X-Robots-Tag:/i.test(line));
if (!website.indexingEnabled) headerLines.splice(1, 0, '  X-Robots-Tag: noindex, nofollow, noarchive');
writeFileSync(headersUrl, headerLines.join('\n'));
if (command === 'prepare') process.exit(0);
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
