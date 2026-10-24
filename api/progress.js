const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET" && request.method !== "PUT") {
    response.setHeader("Allow", "GET, PUT");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const profileId = request.method === "GET"
    ? request.query.profileId
    : request.body?.profileId;
  if (typeof profileId !== "string" || !UUID_RE.test(profileId)) {
    return response.status(400).json({ error: "Invalid profileId" });
  }

  const bridgeUrl = process.env.LOCAL_SQL_API_URL?.replace(/\/$/, "");
  const secret = process.env.SWIPEVOCAB_API_SECRET;
  if (!bridgeUrl || !secret) {
    return response.status(503).json({ error: "Progress service is not configured" });
  }
  let parsedBridgeUrl;
  try {
    parsedBridgeUrl = new URL(bridgeUrl);
  } catch {
    return response.status(503).json({ error: "Progress service is not configured" });
  }
  if (parsedBridgeUrl.protocol !== "https:") {
    return response.status(503).json({ error: "Progress service must use HTTPS" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const url = new URL("/progress", parsedBridgeUrl);
    url.searchParams.set("profileId", profileId);
    const upstream = await fetch(url, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${secret}`,
        ...(request.method === "PUT" ? { "Content-Type": "application/json" } : {}),
      },
      ...(request.method === "PUT"
        ? { body: JSON.stringify({ profile: request.body?.profile, state: request.body?.state }) }
        : {}),
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({ error: "Progress service returned an invalid response" }));
    return response.status(upstream.status).json(payload);
  } catch (error) {
    return response.status(502).json({ error: "Progress service is temporarily unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}
