import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const port = Number(process.env.SQL_BRIDGE_PORT || 3001);
const sharedSecret = process.env.SWIPEVOCAB_API_SECRET || "";
const database = process.env.SQL_DATABASE || "SwipeVocab";
const serverName = process.env.SQL_SERVER || "localhost";
const sqlcmdPath = process.env.SQLCMD_PATH || "sqlcmd";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 256 * 1024;

if (sharedSecret.length < 32) {
  throw new Error("SWIPEVOCAB_API_SECRET must contain at least 32 characters.");
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function isAuthorized(request) {
  const authorization = request.headers.authorization || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (supplied.length !== sharedSecret.length) return false;
  let mismatch = 0;
  for (let index = 0; index < supplied.length; index += 1) {
    mismatch |= supplied.charCodeAt(index) ^ sharedSecret.charCodeAt(index);
  }
  return mismatch === 0;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Body too large"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
  }
}

async function runSql(script) {
  const tempDirectory = await mkdtemp(join(tmpdir(), "swipevocab-sql-"));
  const scriptPath = join(tempDirectory, "request.sql");
  try {
    await writeFile(scriptPath, script, { encoding: "utf8" });
    const { stdout } = await execFileAsync(sqlcmdPath, [
      "-S", serverName,
      "-E",
      "-C",
      "-d", database,
      "-b",
      "-w", "65535",
      "-y", "0",
      "-i", scriptPath,
    ], {
      windowsHide: true,
      timeout: 12_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return stdout.trim();
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

function sqlUnicodeLiteral(value) {
  const hex = Buffer.from(String(value), "utf16le").toString("hex");
  return `CONVERT(nvarchar(max), 0x${hex})`;
}

async function loadProgress(profileId) {
  const output = await runSql(`
SET NOCOUNT ON;
DECLARE @UserId uniqueidentifier = '${profileId}';
SELECT
  JSON_QUERY((
    SELECT DisplayName AS displayName, LearningGoal AS learningGoal, PlacementLevel AS placementLevel
    FROM dbo.UserProfiles WHERE UserId = @UserId
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
  )) AS profile,
  JSON_QUERY((SELECT ProgressJson FROM dbo.UserProgress WHERE UserId = @UserId)) AS state
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
`);
  if (!output || output === "{}") return { profile: null, state: null };
  const jsonStart = output.indexOf("{");
  const jsonEnd = output.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < jsonStart) return { profile: null, state: null };
  return JSON.parse(output.slice(jsonStart, jsonEnd + 1));
}

async function saveProgress(profileId, body) {
  const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
  const state = body.state;
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw Object.assign(new Error("state must be a JSON object"), { status: 400 });
  }

  const progressJson = JSON.stringify(state);
  if (Buffer.byteLength(progressJson, "utf8") > MAX_BODY_BYTES) {
    throw Object.assign(new Error("Progress data is too large"), { status: 413 });
  }

  const displayName = (String(profile.displayName || "Sen").trim().slice(0, 80) || "Sen");
  const learningGoal = (String(profile.learningGoal || "general").trim().slice(0, 40) || "general");
  const placementLevel = (String(profile.placementLevel || "A1").trim().slice(0, 5) || "A1");
  const jsonHex = Buffer.from(progressJson, "utf16le").toString("hex");

  await runSql(`
SET NOCOUNT ON;
DECLARE @UserId uniqueidentifier = '${profileId}';
DECLARE @ProgressJson nvarchar(max) = CONVERT(nvarchar(max), 0x${jsonHex});
BEGIN TRANSACTION;
MERGE dbo.UserProfiles WITH (HOLDLOCK) AS target
USING (SELECT @UserId AS UserId) AS source ON target.UserId = source.UserId
WHEN MATCHED THEN UPDATE SET
  DisplayName = ${sqlUnicodeLiteral(displayName)},
  LearningGoal = ${sqlUnicodeLiteral(learningGoal)},
  PlacementLevel = ${sqlUnicodeLiteral(placementLevel)},
  UpdatedAtUtc = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (UserId, DisplayName, LearningGoal, PlacementLevel)
  VALUES (@UserId, ${sqlUnicodeLiteral(displayName)}, ${sqlUnicodeLiteral(learningGoal)}, ${sqlUnicodeLiteral(placementLevel)});
MERGE dbo.UserProgress WITH (HOLDLOCK) AS target
USING (SELECT @UserId AS UserId) AS source ON target.UserId = source.UserId
WHEN MATCHED THEN UPDATE SET ProgressJson = @ProgressJson, UpdatedAtUtc = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (UserId, ProgressJson) VALUES (@UserId, @ProgressJson);
COMMIT TRANSACTION;
SELECT N'{"ok":true}';
`);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (!isAuthorized(request)) return sendJson(response, 401, { error: "Unauthorized" });
  if (url.pathname === "/health" && request.method === "GET") {
    try {
      await runSql("SET NOCOUNT ON; SELECT N'{\"ok\":true}';");
      return sendJson(response, 200, { ok: true, database });
    } catch {
      return sendJson(response, 503, { ok: false, error: "Database unavailable" });
    }
  }

  if (url.pathname !== "/progress") return sendJson(response, 404, { error: "Not found" });
  const profileId = url.searchParams.get("profileId") || "";
  if (!UUID_RE.test(profileId)) return sendJson(response, 400, { error: "Invalid profileId" });

  try {
    if (request.method === "GET") {
      return sendJson(response, 200, await loadProgress(profileId));
    }
    if (request.method === "PUT") {
      const body = await readJson(request);
      await saveProgress(profileId, body);
      return sendJson(response, 200, { ok: true });
    }
    response.setHeader("allow", "GET, PUT");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error("SQL bridge request failed:", error.message);
    return sendJson(response, status, { error: status >= 500 ? "SQL request failed" : error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SwipeVocab SQL API listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
