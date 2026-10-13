import { chromium } from "playwright";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const username = process.env.IG_USERNAME || "buso_design";
const profileUrl = process.env.IG_PROFILE_URL || `https://www.instagram.com/${username}/`;
const limit = Math.max(1, Number.parseInt(process.env.IG_POST_LIMIT || "5", 10));
const userAgent = process.env.SCRAPER_USER_AGENT ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";

const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH } : {})
});
const context = await browser.newContext({
  locale: "it-IT",
  userAgent,
  viewport: { width: 1440, height: 1800 }
});
const page = await context.newPage();

const absoluteUrl = (value) => {
  try {
    return new URL(value, profileUrl).toString();
  } catch {
    return null;
  }
};

try {
  const response = await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (!response?.ok()) {
    throw new Error(`Instagram profile request failed: ${response?.status() || "no response"}`);
  }

  await page.waitForTimeout(2_500);
  await page.evaluate(() => window.scrollTo(0, Math.min(document.body.scrollHeight, 1_800)));
  await page.waitForTimeout(1_500);

  const scrapedPosts = await page.evaluate((maxPosts) => {
    const chooseImage = (image) => {
      if (!image) return null;
      const candidates = (image.getAttribute("srcset") || image.getAttribute("data-srcset") || "")
        .split(",")
        .map((candidate) => {
          const [url, width] = candidate.trim().split(/\s+/);
          return { url, width: Number.parseInt(width, 10) || 0 };
        })
        .filter((candidate) => candidate.url)
        .sort((a, b) => b.width - a.width);
      return candidates[0]?.url || image.currentSrc || image.getAttribute("src") || image.getAttribute("data-src");
    };

    const anchors = Array.from(document.querySelectorAll("a[href]"))
      .filter((anchor) => /\/(p|reel|tv)\//.test(anchor.pathname));
    const seen = new Set();

    return anchors.map((anchor) => {
      const match = anchor.pathname.match(/\/(p|reel|tv)\/([^/]+)/);
      const article = anchor.closest("article");
      const image = anchor.querySelector("img") || article?.querySelector("img");
      const id = match?.[2];
      const imageUrl = chooseImage(image);
      if (!id || !imageUrl || seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        url: `https://www.instagram.com/${match[1]}/${id}/`,
        image: imageUrl,
        alt: (image?.getAttribute("alt") || "").replace(/\s+/g, " ").trim(),
        timestamp: article?.querySelector("time")?.getAttribute("datetime") || null
      };
    }).filter(Boolean).slice(0, maxPosts);
  }, limit);

  if (!scrapedPosts.length) {
    throw new Error(`No public Instagram posts found at ${profileUrl}. Instagram may have served a login or checkpoint page.`);
  }

  const localPosts = [];
  for (const post of scrapedPosts) {
    try {
      const imageResponse = await context.request.get(absoluteUrl(post.image), {
        headers: { Referer: profileUrl }
      });
      if (!imageResponse.ok()) throw new Error(`image request ${imageResponse.status()}`);

      const contentType = imageResponse.headers()["content-type"] || "image/jpeg";
      if (!contentType.startsWith("image/")) throw new Error(`unexpected content type ${contentType}`);
      const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const filename = `${post.id}.${extension}`;
      const relativeImage = `assets/images/instagram/${filename}`;
      const body = await imageResponse.body();

      for (const target of [
        resolve("assets/images/instagram", filename),
        resolve("themes/custom/assets/images/instagram", filename)
      ]) {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, body);
      }

      localPosts.push({
        id: post.id,
        url: post.url,
        image: relativeImage,
        alt: post.alt ? post.alt.slice(0, 160) : "Contenuto Instagram di Alessio Buso",
        timestamp: post.timestamp
      });
    } catch (error) {
      console.warn(`Skipping ${post.url}: ${error.message}`);
    }
  }

  if (!localPosts.length) {
    throw new Error("Instagram posts were found, but no image could be downloaded.");
  }

  const keepImages = new Set(localPosts.map((post) => post.image.split("/").pop()));
  for (const directory of [resolve("assets/images/instagram"), resolve("themes/custom/assets/images/instagram")]) {
    for (const filename of await readdir(directory)) {
      if (/^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(filename) && !keepImages.has(filename)) {
        await unlink(resolve(directory, filename));
      }
    }
  }

  const output = JSON.stringify({ updatedAt: new Date().toISOString(), posts: localPosts }, null, 2) + "\n";
  for (const target of ["assets/data/instagram.json", "themes/custom/assets/data/instagram.json"]) {
    const path = resolve(target);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, output, "utf8");
  }

  console.log(`Scraped ${localPosts.length} Instagram posts from ${profileUrl}.`);
} finally {
  await browser.close();
}
