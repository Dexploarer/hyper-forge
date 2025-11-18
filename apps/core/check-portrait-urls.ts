#!/usr/bin/env bun
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);

const [portrait] = await client`
  SELECT cdn_url FROM media_assets WHERE type = 'portrait' LIMIT 1
`;

console.log("Portrait CDN URL:", portrait?.cdn_url);

if (portrait?.cdn_url) {
  console.log("\nTesting portrait URL access:");
  const response = await fetch(portrait.cdn_url, { method: "HEAD" });
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${response.headers.get("content-type")}`);
}

await client.end();
