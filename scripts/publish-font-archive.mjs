import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { parseFamilySpec } from "./lib/font-spec.mjs";

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const archiveConfigPath = path.join(repoRoot, "content", "archive-config.json");
const localUpstreamsDir = path.join(repoRoot, "content", "upstreams");
const syncScriptPath = path.join(repoRoot, "scripts", "sync-font-assets.mjs");
const setArchiveVersionScriptPath = path.join(
  repoRoot,
  "scripts",
  "set-archive-version.mjs",
);
const generateManifestScriptPath = path.join(
  repoRoot,
  "scripts",
  "generate-font-manifest.mjs",
);
const args = process.argv.slice(2);

function isExternalPath(value) {
  return /^(?:https?:)?\/\//.test(value) || value.startsWith("/");
}

function parseArgs(argv) {
  let fontId;
  let bucket = process.env.TIPARO_R2_BUCKET ?? "";
  let dryRun = false;
  let hashLength = 8;
  let wranglerBin = process.env.TIPARO_WRANGLER_BIN ?? "wrangler";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--bucket") {
      bucket = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--hash-length") {
      hashLength = Number(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--wrangler-bin") {
      wranglerBin = argv[index + 1] ?? wranglerBin;
      index += 1;
      continue;
    }

    if (!fontId) {
      fontId = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!fontId) {
    throw new Error(
      "Usage: node scripts/publish-font-archive.mjs <font-id> [--bucket BUCKET] [--hash-length N] [--dry-run]",
    );
  }

  if (!Number.isInteger(hashLength) || hashLength < 6 || hashLength > 16) {
    throw new Error("Hash length must be an integer between 6 and 16.");
  }

  return {
    fontId,
    bucket: bucket.trim(),
    dryRun,
    hashLength,
    wranglerBin,
  };
}

async function readArchiveConfig() {
  const configText = await fs.readFile(archiveConfigPath, "utf8");
  const config = JSON.parse(configText);
  const baseUrl = typeof config.baseUrl === "string" ? config.baseUrl.trim() : "";

  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error(`Invalid archive baseUrl in ${archiveConfigPath}`);
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
  };
}

async function runCommand(command, commandArgs) {
  try {
    return await execFileAsync(command, commandArgs, { cwd: repoRoot });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`Command not found: ${command}`);
    }

    throw error;
  }
}

async function runInteractiveCommand(command, commandArgs) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        reject(new Error(`Command not found: ${command}`));
        return;
      }

      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      if (signal) {
        reject(new Error(`Command failed with signal ${signal}: ${command} ${commandArgs.join(" ")}`));
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command} ${commandArgs.join(" ")}`));
    });
  });
}

async function collectDirectoryEntries(rootPath, currentPath = rootPath) {
  const relativePath = path.relative(rootPath, currentPath).split(path.sep).join("/");
  const stats = await fs.lstat(currentPath);

  if (stats.isSymbolicLink()) {
    return [
      {
        type: "symlink",
        relativePath,
        linkTarget: await fs.readlink(currentPath),
      },
    ];
  }

  if (stats.isFile()) {
    return [
      {
        type: "file",
        relativePath,
        content: await fs.readFile(currentPath),
      },
    ];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const entries = [];

  if (relativePath) {
    entries.push({
      type: "directory",
      relativePath,
    });
  }

  const children = await fs.readdir(currentPath, { withFileTypes: true });
  children.sort((left, right) => left.name.localeCompare(right.name));

  for (const child of children) {
    entries.push(
      ...(await collectDirectoryEntries(rootPath, path.join(currentPath, child.name))),
    );
  }

  return entries;
}

async function hashDirectoryContents(rootPath, hashLength) {
  const entries = await collectDirectoryEntries(rootPath);
  const hash = createHash("sha256");

  for (const entry of entries) {
    hash.update(entry.type);
    hash.update("\0");
    hash.update(entry.relativePath);
    hash.update("\0");

    if (entry.type === "file") {
      hash.update(entry.content);
    } else if (entry.type === "symlink") {
      hash.update(entry.linkTarget);
    }

    hash.update("\0");
  }

  return hash.digest("hex").slice(0, hashLength);
}

const { fontId, bucket, dryRun, hashLength, wranglerBin } = parseArgs(args);
const archiveConfig = await readArchiveConfig();
const specPath = path.join(repoRoot, "content", "fonts", fontId, "family.toml");
const localUpstreamPath = path.join(localUpstreamsDir, fontId);
const specText = await fs.readFile(specPath, "utf8");
const spec = parseFamilySpec(specText);
const source = spec.source ?? {};
const archive = typeof source.archive === "string" ? source.archive.trim() : "";

if (!archive) {
  throw new Error(`Missing source.archive in ${specPath}`);
}

if (isExternalPath(archive)) {
  throw new Error(`source.archive must be a relative filename in ${specPath}`);
}

await fs.access(localUpstreamPath);
await runCommand(process.execPath, [syncScriptPath, fontId]);

const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "tiparo-archive-"));
const archivePath = path.join(temporaryDirectory, archive);

try {
  await runCommand("tar", ["-czf", archivePath, "-C", localUpstreamsDir, fontId]);
  const archiveVersion = await hashDirectoryContents(localUpstreamPath, hashLength);
  const basePath = new URL(archiveConfig.baseUrl).pathname.replace(/^\/+|\/+$/g, "");
  const objectKey = basePath ? `${basePath}/${archiveVersion}/${archive}` : `${archiveVersion}/${archive}`;
  const publicUrl = `${archiveConfig.baseUrl}/${archiveVersion}/${archive}`;

  if (dryRun) {
    console.log(`archive: ${archivePath}`);
    console.log(`hash: ${archiveVersion}`);
    console.log(`object: ${objectKey}`);
    console.log(`url: ${publicUrl}`);
  } else {
    if (!bucket) {
      throw new Error("Missing R2 bucket name. Pass --bucket or set TIPARO_R2_BUCKET.");
    }

    await runInteractiveCommand(wranglerBin, [
      "r2",
      "object",
      "put",
      `${bucket}/${objectKey}`,
      "--remote",
      `--file=${archivePath}`,
      "--content-type",
      "application/gzip",
      "--content-disposition",
      `attachment; filename="${archive}"`,
      "--cache-control",
      "public, max-age=31536000, immutable",
    ]);
    await runCommand(process.execPath, [setArchiveVersionScriptPath, fontId, archiveVersion]);
    await runCommand(process.execPath, [generateManifestScriptPath]);
    console.log(publicUrl);
  }
} finally {
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
}
