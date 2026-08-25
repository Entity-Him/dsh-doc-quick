// dsh-doc-quick: document format parsers (host process, Node).
//   - PDF       via pdfjs-dist (lazily imported; graceful degradation)
//   - DOCX/PPTX via a built-in minimal zip reader + XML extraction (zero deps)
//   - EPUB      via the same zip reader + HTML-to-text extraction
//   - IPYNB     via JSON cell extraction
//   - text-ish  files read as UTF-8 (with UTF-16 BOM support and binary guard)

import { promises as fs } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

let pdfjsModule = null;
let pdfjsFailure = null;

async function getPdfjs() {
  if (pdfjsModule) return pdfjsModule;
  if (pdfjsFailure) throw pdfjsFailure;
  if (typeof Promise.withResolvers !== "function") {
    Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      return { promise, resolve, reject };
    };
  }
  try {
    try {
      pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
    } catch {
      pdfjsModule = await import("pdfjs-dist");
    }
    return pdfjsModule;
  } catch (e) {
    pdfjsFailure = e instanceof Error ? e : new Error(String(e));
    throw pdfjsFailure;
  }
}

export async function pdfAvailable() {
  try { await getPdfjs(); return true; } catch { return false; }
}

export async function extractPdfTextBuffer(data) {
  const mod = await getPdfjs();
  const doc = await mod.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    verbosity: 0,
  }).promise;
  try {
    const pages = new Array(doc.numPages);
    let cursor = 0;
    const extractPage = async (p) => {
      const page = await doc.getPage(p);
      try {
        const content = await page.getTextContent();
        let line = "";
        const lines = [];
        for (const item of content.items) {
          if (typeof item.str !== "string") continue;
          line += item.str;
          if (item.hasEOL) {
            lines.push(line.trimEnd());
            line = "";
          }
        }
        if (line.trim()) lines.push(line.trimEnd());
        pages[p - 1] = lines.join("\n");
      } finally {
        if (typeof page.cleanup === "function") page.cleanup();
      }
    };
    const worker = async () => {
      while (cursor < doc.numPages) {
        const p = cursor + 1;
        cursor += 1;
        await extractPage(p);
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, doc.numPages) }, worker));
    return pages.join("\n\n");
  } finally {
    await doc.destroy().catch(() => {});
  }
}

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;
const MAX_UNCOMPRESSED = 256 * 1024 * 1024;

function findEocd(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535 - 8); i--) {
    if (buf.readUInt32LE(i) !== SIG_EOCD) continue;
    const commentLen = buf.readUInt16LE(i + 20);
    if (i + 22 + commentLen === buf.length) return i;
  }
  return -1;
}

function decodeName(bytes, flags) {
  return (flags & 0x800) !== 0
    ? bytes.toString("utf8")
    : bytes.toString("latin1");
}

export function listZipEntries(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  const eocd = findEocd(buf);
  if (eocd < 0) throw new Error("不是有效的 zip 文件(未找到目录结尾记录)");
  const total = buf.readUInt16LE(eocd + 10);
  if (total === 0xffff || total === 0) throw new Error("不支持的 zip64 或空压缩包");
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < total; i++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== SIG_CENTRAL) {
      throw new Error("zip 中央目录损坏");
    }
    const flags = buf.readUInt16LE(off + 8);
    const method = buf.readUInt16LE(off + 10);
    const compressedSize = buf.readUInt32LE(off + 20);
    const uncompressedSize = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOffset = buf.readUInt32LE(off + 42);
    if (off + 46 + nameLen > buf.length) throw new Error("zip 中央目录越界");
    const name = decodeName(buf.subarray(off + 46, off + 46 + nameLen), flags);
    entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export function readZipEntry(buf, entry, maxUncompressed = MAX_UNCOMPRESSED) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (entry.uncompressedSize > maxUncompressed) {
    throw new Error(`zip 条目过大(解压后 ${entry.uncompressedSize} 字节),已拒绝以防 zip 炸弹: ${entry.name}`);
  }
  const off = entry.localOffset;
  if (off + 30 > buf.length || buf.readUInt32LE(off) !== SIG_LOCAL) {
    throw new Error("zip 本地头损坏: " + entry.name);
  }
  const nameLen = buf.readUInt16LE(off + 26);
  const extraLen = buf.readUInt16LE(off + 28);
  const start = off + 30 + nameLen + extraLen;
  const end = start + entry.compressedSize;
  if (end > buf.length) throw new Error("zip 数据越界: " + entry.name);
  const raw = buf.subarray(start, end);
  if (entry.method === 0) return Buffer.from(raw);
  if (entry.method === 8) return zlib.inflateRawSync(raw, { maxOutputLength: maxUncompressed });
  throw new Error(`不支持的 zip 压缩方式 ${entry.method}: ${entry.name}`);
}

function safeCodePoint(cp) {
  if (!Number.isInteger(cp) || cp <= 0 || cp > 0x10ffff) return "\uFFFD";
  try { return String.fromCodePoint(cp); } catch { return "\uFFFD"; }
}

export function decodeXmlEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export function htmlToText(html) {
  let s = String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  s = s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|td|th|blockquote|div|tr|section|article)>/gi, "\n");
  s = s.replace(/<[^>]*>/g, " ");
  s = decodeXmlEntities(s)
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

export function docxTextFromXml(xml) {
  const paras = [];
  for (const m of String(xml).matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
    let text = "";
    for (const t of m[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)) text += t[1];
    text = decodeXmlEntities(text).replace(/[\t ]+/g, " ").trim();
    if (text) paras.push(text);
  }
  return paras.join("\n\n");
}

export function pptxTextFromSlideXml(xml) {
  const parts = [];
  for (const m of String(xml).matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)) {
    const t = decodeXmlEntities(m[1]).trim();
    if (t) parts.push(t);
  }
  return parts.join("\n");
}

export function ipynbToText(raw) {
  let data;
  try { data = JSON.parse(String(raw)); } catch { throw new Error("ipynb 文件不是有效 JSON"); }
  const cells = Array.isArray(data.cells) ? data.cells : [];
  const parts = [];
  for (const cell of cells) {
    if (!cell || cell.source == null) continue;
    const src = Array.isArray(cell.source) ? cell.source.join("") : String(cell.source);
    if (src.trim()) parts.push(src.trim());
  }
  return parts.join("\n\n");
}

export function parseDocx(raw) {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const entries = listZipEntries(buf);
  const byName = new Map(entries.map((e) => [e.name, e]));
  const docEntry = byName.get("word/document.xml");
  if (!docEntry) throw new Error("DOCX 缺少 word/document.xml(文件可能损坏或不是 docx)");
  const xml = readZipEntry(buf, docEntry).toString("utf8");
  const text = docxTextFromXml(xml);
  if (!text.trim()) throw new Error("DOCX 未抽取到文本内容");
  return text;
}

function slideNumber(name) {
  const m = /slide(\d+)\.xml$/i.exec(name);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function parsePptx(raw) {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const entries = listZipEntries(buf);
  const slideEntries = entries
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.name))
    .sort((a, b) => slideNumber(a.name) - slideNumber(b.name));
  if (slideEntries.length === 0) throw new Error("PPTX 未找到幻灯片(ppt/slides/slide*.xml)");
  const pages = [];
  for (const entry of slideEntries) {
    try {
      const xml = readZipEntry(buf, entry).toString("utf8");
      const text = pptxTextFromSlideXml(xml);
      if (text.trim()) pages.push(text.trim());
    } catch { /* one broken slide should not kill the whole deck */ }
  }
  if (pages.length === 0) throw new Error("PPTX 未抽取到文本内容");
  return pages.join("\n\n");
}

export function parseEpub(raw) {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const entries = listZipEntries(buf);
  const byName = new Map(entries.map((e) => [e.name, e]));
  const containerEntry = byName.get("META-INF/container.xml");
  if (!containerEntry) throw new Error("EPUB 缺少 META-INF/container.xml");
  const containerXml = readZipEntry(buf, containerEntry).toString("utf8");
  const rootfile = containerXml.match(/full-path=["']([^"']+)["']/);
  if (!rootfile) throw new Error("EPUB container.xml 缺少 rootfile 路径");
  const opfPath = rootfile[1];
  const contentDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const spineNames = [];
  const opfEntry = byName.get(opfPath);
  if (opfEntry) {
    try {
      const opf = readZipEntry(buf, opfEntry).toString("utf8");
      const idToHref = new Map();
      for (const im of opf.matchAll(/<item\b[^>]*>/g)) {
        const id = im[0].match(/\bid=["']([^"']+)["']/);
        const href = im[0].match(/\bhref=["']([^"']+)["']/);
        const media = im[0].match(/\bmedia-type=["']([^"']+)["']/);
        if (id && href && media && /html|xml/i.test(media[1])) idToHref.set(id[1], href[1]);
      }
      const spine = opf.match(/<spine\b[^>]*>([\s\S]*?)<\/spine>/);
      if (spine) {
        for (const ir of spine[1].matchAll(/<itemref\b[^>]*idref=["']([^"']+)["']/g)) {
          const href = idToHref.get(ir[1]);
          if (href) spineNames.push(decodeXmlEntities(href));
        }
      }
    } catch { /* OPF broken → fall through */ }
  }

  const decodeHref = (h) => {
    try { return decodeURIComponent(h); } catch { return h; }
  };
  const seen = new Set();
  const texts = [];
  const pushDoc = (name) => {
    if (!name || seen.has(name)) return;
    const clean = decodeHref(name.split("#")[0]);
    const full = path.posix.normalize(clean.startsWith(contentDir) ? clean : contentDir + clean);
    if (seen.has(full)) return;
    seen.add(full);
    const entry = byName.get(full);
    if (!entry) return;
    try {
      const text = htmlToText(readZipEntry(buf, entry).toString("utf8"));
      if (text) texts.push(text);
    } catch { /* unreadable chapter: skip */ }
  };

  if (spineNames.length > 0) {
    for (const n of spineNames) pushDoc(n);
  } else {
    const names = entries
      .map((e) => e.name)
      .filter((n) => /\.x?html?$/i.test(n) && !/(^|\/)(toc|nav|cover|titlepage|index)[^/]*$/i.test(n))
      .sort();
    for (const n of names) pushDoc(n);
  }
  if (texts.length === 0) throw new Error("EPUB 未找到可读章节");
  return texts.join("\n\n");
}

export function decodeTextBuffer(raw) {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (buf.length >= 2) {
    if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString("utf16le");
    if (buf[0] === 0xfe && buf[1] === 0xff) {
      const swapped = Buffer.from(buf.subarray(2));
      for (let i = 0; i + 1 < swapped.length; i += 2) {
        const t = swapped[i];
        swapped[i] = swapped[i + 1];
        swapped[i + 1] = t;
      }
      return swapped.toString("utf16le");
    }
  }
  const head = buf.subarray(0, Math.min(buf.length, 8192));
  let nulls = 0;
  for (const b of head) if (b === 0) nulls++;
  if (nulls > 0 && nulls / head.length > 0.002) {
    throw new Error("疑似二进制文件,无法按文本读取(请确认文件格式)");
  }
  let text = buf.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const bad = (text.match(/\uFFFD/g) ?? []).length;
  if (bad > 0 && bad / Math.max(1, text.length) > 0.01) {
    throw new Error("文件编码不是 UTF-8,请转换编码后重试");
  }
  return text;
}

const KIND_OF = {
  ".pdf": "PDF",
  ".docx": "Word",
  ".pptx": "PPT",
  ".epub": "EPUB",
  ".ipynb": "Notebook",
};

export function formatKindOf(ext) {
  return KIND_OF[String(ext).toLowerCase()] ?? "文本";
}

export async function extractText(file) {
  const ext = path.extname(file).toLowerCase();
  const raw = await fs.readFile(file);
  switch (ext) {
    case ".pdf":
      return await extractPdfTextBuffer(raw);
    case ".docx":
      return parseDocx(raw);
    case ".pptx":
      return parsePptx(raw);
    case ".epub":
      return parseEpub(raw);
    case ".ipynb":
      return ipynbToText(raw.toString("utf8"));
    default:
      return decodeTextBuffer(raw);
  }
}
