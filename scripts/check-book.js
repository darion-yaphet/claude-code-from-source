#!/usr/bin/env node
/**
 * Post-build integrity checks for the HonKit book.
 * - SUMMARY.md links exist
 * - local markdown image refs exist
 * - built HTML does not contain obvious broken relative links to missing pages
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const summaryPath = path.join(root, "SUMMARY.md");
const bookDir = path.join(root, "_book");

let errors = 0;

function fail(msg) {
  console.error("✖ " + msg);
  errors += 1;
}

function ok(msg) {
  console.log("✔ " + msg);
}

function extractMdLinks(text) {
  const links = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(text))) {
    links.push(m[1].trim().replace(/^<|>$/g, ""));
  }
  return links;
}

function isExternal(href) {
  return /^(https?:|mailto:|ftp:|#)/i.test(href);
}

// 1) SUMMARY consistency
const summary = fs.readFileSync(summaryPath, "utf8");
const summaryLinks = extractMdLinks(summary).filter((h) => !isExternal(h));
const summaryFiles = [...new Set(summaryLinks.map((h) => h.split("#")[0]).filter(Boolean))];

for (const rel of summaryFiles) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) fail(`SUMMARY 指向缺失文件: ${rel}`);
}
ok(`SUMMARY 链接检查完成（${summaryFiles.length} 个文件）`);

// Every chapter-*/README.md should be listed if present
const chapterDirs = fs
  .readdirSync(root)
  .filter((n) => /^chapter-\d+$/.test(n))
  .sort();
for (const dir of chapterDirs) {
  const rel = path.join(dir, "README.md");
  if (!summary.includes(rel.replace(/\\/g, "/")) && !summary.includes(rel)) {
    fail(`存在未进入 SUMMARY 的章节: ${rel}`);
  }
}
ok(`章节目录与 SUMMARY 对齐检查完成（${chapterDirs.length} 章）`);

// 2) Local images referenced from markdown
function walkMd(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "_book" || name === ".git") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkMd(full, out);
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

const mdFiles = walkMd(root);
let imageRefs = 0;
for (const file of mdFiles) {
  const text = fs.readFileSync(file, "utf8");
  const re = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(text))) {
    const href = m[1].trim().split(/\s+/)[0].replace(/^<|>$/g, "");
    if (isExternal(href)) continue;
    imageRefs += 1;
    const abs = path.resolve(path.dirname(file), href.split("#")[0]);
    if (!fs.existsSync(abs)) fail(`缺图: ${path.relative(root, file)} -> ${href}`);
  }
}
ok(`本地图片引用检查完成（${imageRefs} 处）`);

// 3) Built site relative page links
if (!fs.existsSync(bookDir)) {
  fail("_book 不存在，请先 npm run build");
} else {
  function walkHtml(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        if (name === "gitbook") continue;
        walkHtml(full, out);
      } else if (name.endsWith(".html")) out.push(full);
    }
    return out;
  }

  const htmlFiles = walkHtml(bookDir);
  let checked = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const re = /href="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) {
      const href = m[1];
      if (isExternal(href) || href.startsWith("javascript:") || href.startsWith("data:")) continue;
      if (href.startsWith("#")) continue;
      const clean = href.split("#")[0].split("?")[0];
      if (!clean) continue;
      // only check in-book relative links
      if (clean.includes("://")) continue;
      const target = path.resolve(path.dirname(file), clean);
      checked += 1;
      if (!fs.existsSync(target)) {
        fail(`断链: ${path.relative(bookDir, file)} -> ${href}`);
      }
    }
  }
  ok(`构建产物相对链接检查完成（扫描 ${checked} 处，页面 ${htmlFiles.length}）`);
}

if (errors) {
  console.error(`\n校验失败：${errors} 个问题`);
  process.exit(1);
}

console.log("\n全部校验通过");
