import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const NEXUS_HTML_BASE = "https://www.nexusmods.com";
const NEXUS_API_BASE = "https://api.nexusmods.com";
const PROXY_PATH = "/api/nexus-proxy";

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
];

// ── HTML proxy helpers ──────────────────────────────────────────────────────
function toAbsolute(url: string, base: string): string {
  if (
    !url ||
    url.startsWith("data:") ||
    url.startsWith("javascript:") ||
    url.startsWith("mailto:") ||
    url.startsWith("#")
  )
    return url;

  try {
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return NEXUS_HTML_BASE + url;
    if (url.startsWith("http")) return url;
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function proxyUrl(url: string, base: string): string {
  const abs = toAbsolute(url, base);
  if (ALLOWED_ORIGINS.some((d) => abs.includes(d))) {
    return `${PROXY_PATH}?url=${encodeURIComponent(abs)}`;
  }
  return abs;
}

function rewriteHtml(html: string, base: string): string {
  html = html.replace(
    /(<(?:a|form|link|area|base)[^>]*?\s(?:href|action))="([^"]*?)"/gi,
    (_, attr, url) => `${attr}="${proxyUrl(url, base)}"`,
  );

  html = html.replace(
    /(<(?:script|img|iframe|source|track|video|audio|embed)[^>]*?\ssrc)="([^"]*?)"/gi,
    (_, attr, url) =>
      url.startsWith("data:") ? _ : `${attr}="${proxyUrl(url, base)}"`,
  );

  html = html.replace(
    /url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi,
    (_, url) => `url(${proxyUrl(url, base)})`,
  );

  html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);

  return html;
}

// ── HTML PROXY (solo navegación, NO API) ────────────────────────────────────
router.get("/nexus-proxy", async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string | undefined;

  if (!targetUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  if (!ALLOWED_ORIGINS.some((d) => targetUrl.includes(d))) {
    res.status(403).json({ error: "Blocked domain" });
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
        Referer: NEXUS_HTML_BASE,
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
      },
      redirect: "manual",
    });

    // Redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "";
      const newLoc = location
        ? proxyUrl(location, targetUrl)
        : `${PROXY_PATH}?url=${encodeURIComponent(NEXUS_HTML_BASE)}`;

      res.setHeader("Location", newLoc);
      res.status(response.status).end();
      return;
    }

    // Headers
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower)) return;
      res.setHeader(key, value);
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status);

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      const text = await response.text();
      res.send(rewriteHtml(text, targetUrl));
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    res.status(502).json({
      error: "HTML proxy error",
      detail: String(err),
    });
  }
});

export default router;
