import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const NEXUS_HTML_BASE = "https://www.nexusmods.com";
const NEXUS_API_BASE  = "https://api.nexusmods.com";
const PROXY_PATH      = "/api/nexus-proxy";

const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-type-options",
  "strict-transport-security",
  "transfer-encoding",
  "content-encoding",
]);

const ALLOWED_ORIGINS = [
  "nexusmods.com",
  "nexus-cdn.com",
  "staticdelivery.nexusmods.com",
  "cf.nexusmods.com",
  "api.nexusmods.com",
];

// ── HTML proxy helpers ──────────────────────────────────────────────────────
function toAbsolute(url: string, base: string): string {
  if (!url || url.startsWith("data:") || url.startsWith("javascript:") || url.startsWith("mailto:") || url.startsWith("#")) return url;
  try {
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return NEXUS_HTML_BASE + url;
    if (url.startsWith("http")) return url;
    return new URL(url, base).href;
  } catch { return url; }
}

function proxyUrl(url: string, base: string): string {
  const abs = toAbsolute(url, base);
  if (ALLOWED_ORIGINS.some((d) => abs.includes(d))) {
    return `${PROXY_PATH}?url=${encodeURIComponent(abs)}`;
  }
  return abs;
}

function rewriteHtml(html: string, base: string): string {
  html = html.replace(/(<(?:a|form|link|area|base)[^>]*?\s(?:href|action))="([^"]*?)"/gi,
    (_, attr, url) => `${attr}="${proxyUrl(url, base)}"`);
  html = html.replace(/(<(?:script|img|iframe|source|track|video|audio|embed)[^>]*?\ssrc)="([^"]*?)"/gi,
    (_, attr, url) => url.startsWith("data:") ? _ : `${attr}="${proxyUrl(url, base)}"`);
  html = html.replace(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi,
    (_, url) => `url(${proxyUrl(url, base)})`);
  html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
  return html;
}

// ── Main proxy route ────────────────────────────────────────────────────────
router.get("/nexus-proxy", async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string | undefined;
  const apiKey    = req.query.apikey as string | undefined;

  if (!targetUrl) { res.status(400).json({ error: "Missing url parameter" }); return; }
  if (!ALLOWED_ORIGINS.some((d) => targetUrl.includes(d))) {
    res.status(403).json({ error: "Only nexusmods.com URLs are allowed" }); return;
  }

  const isApiCall = targetUrl.startsWith(NEXUS_API_BASE);

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: isApiCall ? "application/json" : "text/html,application/xhtml+xml,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      Referer: NEXUS_HTML_BASE,
    };

    if (isApiCall && apiKey) {
      headers["apikey"] = apiKey;
    } else if (!isApiCall && req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }

    const response = await fetch(targetUrl, {
      method: req.method === "POST" ? "POST" : "GET",
      headers,
      redirect: isApiCall ? "follow" : "manual",
    });

    // Handle HTML redirects
    if (!isApiCall && response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "";
      const newLoc = location ? proxyUrl(location, targetUrl) : `${PROXY_PATH}?url=${encodeURIComponent(NEXUS_HTML_BASE)}`;
      res.setHeader("Location", newLoc);
      res.status(response.status).end();
      return;
    }

    // Forward / strip headers
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower)) return;
      if (lower === "set-cookie") {
        const stripped = value
          .replace(/;\s*domain=[^;]*/gi, "")
          .replace(/;\s*secure/gi, "")
          .replace(/;\s*samesite=[^;]*/gi, "");
        res.setHeader("Set-Cookie", stripped);
      } else {
        res.setHeader(key, value);
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status);

    const contentType = response.headers.get("content-type") || "";

    if (isApiCall || contentType.includes("application/json")) {
      // JSON API — forward as-is
      const json = await response.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.send(json);
    } else if (contentType.includes("text/html")) {
      const text = await response.text();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(rewriteHtml(text, targetUrl));
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    res.status(502).json({ error: "Proxy error", detail: String(err) });
  }
});

export default router;
