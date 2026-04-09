const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/check", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OGChecker/1.0; +https://github.com/AlexHacksAround/OG_Check)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return res
        .status(400)
        .json({ error: `Not an HTML page (content-type: ${contentType})` });
    }

    const html = await response.text();
    const tags = parseOGTags(html);

    res.json({
      url: targetUrl,
      finalUrl: response.url,
      statusCode: response.status,
      tags,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out (10s)" });
    }
    res.status(502).json({ error: `Failed to fetch URL: ${err.message}` });
  }
});

function parseOGTags(html) {
  const tags = {};
  const metaRegex =
    /<meta\s+([^>]*?)(?:\/\s*>|>)/gi;
  let match;

  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];

    const propertyMatch = attrs.match(
      /(?:property|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/i
    );
    const contentMatch = attrs.match(
      /content\s*=\s*(?:"([^"]*)"|'([^']*)')/i
    );

    if (propertyMatch && contentMatch) {
      const property = (propertyMatch[1] || propertyMatch[2]).toLowerCase();
      const content = contentMatch[1] || contentMatch[2];

      if (
        property.startsWith("og:") ||
        property.startsWith("twitter:") ||
        property === "description" ||
        property === "title"
      ) {
        tags[property] = content;
      }
    }
  }

  // Also grab <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    tags["_title"] = titleMatch[1].trim();
  }

  return tags;
}

app.listen(PORT, () => {
  console.log(`OG Checker running on http://localhost:${PORT}`);
});
