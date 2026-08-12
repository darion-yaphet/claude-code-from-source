#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const bookDir = path.join(__dirname, "..", "_book");
const site = "https://darion-yaphet.github.io/claude-code-from-source";
const image = `${site}/cover-og.jpg`;

const tags = [
  '<meta property="og:type" content="website" />',
  '<meta property="og:site_name" content="Claude Code From Source" />',
  '<meta property="og:title" content="Claude Code From Source（中文译本）" />',
  '<meta property="og:description" content="从源码拆解 Claude Code 的生产级智能体架构（非官方中文译本）" />',
  `<meta property="og:url" content="${site}/" />`,
  `<meta property="og:image" content="${image}" />`,
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  '<meta name="twitter:card" content="summary_large_image" />',
  '<meta name="twitter:title" content="Claude Code From Source（中文译本）" />',
  '<meta name="twitter:description" content="从源码拆解 Claude Code 的生产级智能体架构（非官方中文译本）" />',
  `<meta name="twitter:image" content="${image}" />`,
].join("\n        ");

const marker = 'property="og:image"';

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "gitbook") continue;
      walk(full);
      continue;
    }
    if (!name.endsWith(".html")) continue;
    let html = fs.readFileSync(full, "utf8");
    if (html.includes(marker)) continue;
    if (!html.includes("</head>")) continue;
    html = html.replace("</head>", `        ${tags}\n    </head>`);
    fs.writeFileSync(full, html);
  }
}

if (!fs.existsSync(bookDir)) {
  console.error("_book not found; run honkit build first");
  process.exit(1);
}

walk(bookDir);
console.log("Injected Open Graph meta tags into _book HTML");
