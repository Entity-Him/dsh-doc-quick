// dsh-doc-quick host half.
// 文档快处插件: 主人把文档拖进 Web 对话框 → host 端保存到 ~/.dsh/doc-quick/<sessionId>/ →
// 自动通知 Agent 读取处理 → Agent 用 doc_complete 登记产出 → client 弹出右侧侧栏展示。
// host 端直读本地文件系统(不受会话沙箱限制),支持 PDF/Word/PPT/EPUB/Notebook/Markdown/文本。

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { extractText, formatKindOf } from "./parsers.js";

export const name = "doc-quick";

export const inject = ["tools", "systemPrompt", "webServer"];

const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;
const MAX_BASE64_LEN = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 16;
const READ_LIMIT_DEFAULT = 4000;
const READ_LIMIT_MAX = 12000;
const TASK_CAP_PER_SESSION = 50;

export function apply(ctx) {
  const tools = ctx.get("tools");
  const systemPrompt = ctx.get("systemPrompt");
  const webServer = ctx.get("webServer");

  const ROOT = path.join(os.homedir(), ".dsh", "doc-quick");

  // ---- task registry --------------------------------------------------
  const tasks = new Map();
  const bySession = new Map();

  function registerTask(t) {
    tasks.set(t.id, t);
    const list = bySession.get(t.sessionId) ?? [];
    list.push(t.id);
    bySession.set(t.sessionId, list);
    while (list.length > TASK_CAP_PER_SESSION) {
      const old = list.shift();
      tasks.delete(old);
    }
  }

  function taskView(t) {
    return {
      id: t.id,
      sessionId: t.sessionId,
      file: t.file,
      name: t.name,
      size: t.size,
      kind: t.kind,
      status: t.status,
      summary: t.summary ?? "",
      outputs: (t.outputs ?? []).map((o) => ({ path: o.path, kind: o.kind })),
      error: t.error ?? "",
      receivedAt: t.receivedAt,
      updatedAt: t.updatedAt,
    };
  }

  function sanitizeName(raw) {
    const base = path.basename(String(raw ?? "")).replace(/[\u0000-\u001f\u007f]/g, "");
    return base || "unnamed";
  }

  // ---- upload HTTP route ----------------------------------------------
  const disposeRoute = webServer.register({
    kind: "exact",
    path: "/doc-quick/upload",
    handler: async (req, res) => {
      const send = (code, obj) => {
        const body = JSON.stringify(obj);
        res.writeHead(code, { "content-type": "application/json" });
        res.end(body);
      };
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        let payload;
        try {
          payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          return send(400, { ok: false, error: "请求体不是有效 JSON" });
        }
        const sessionId = String(payload.sessionId ?? "").replace(/[^A-Za-z0-9_-]/g, "");
        const name = sanitizeName(payload.name);
        const data = String(payload.data ?? "");
        if (!sessionId) return send(400, { ok: false, error: "缺少 sessionId" });
        if (!name) return send(400, { ok: false, error: "缺少文件名" });
        if (!data) return send(400, { ok: false, error: "缺少文件内容" });
        if (data.length > MAX_BASE64_LEN) {
          return send(413, { ok: false, error: `文件超过 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 上限` });
        }
        let buf;
        try {
          buf = Buffer.from(data, "base64");
          if (buf.length === 0) throw new Error("empty");
        } catch {
          return send(400, { ok: false, error: "文件内容不是合法 base64" });
        }
        const dir = path.join(ROOT, sessionId);
        await fs.mkdir(dir, { recursive: true });
        const file = path.join(dir, name);
        await fs.writeFile(file, buf);
        const id = randomUUID();
        const now = Date.now();
        registerTask({
          id,
          sessionId,
          file,
          name,
          size: buf.length,
          kind: formatKindOf(path.extname(file)),
          status: "received",
          summary: "",
          outputs: [],
          error: "",
          receivedAt: now,
          updatedAt: now,
        });
        send(200, { ok: true, id, path: file, name, size: buf.length, kind: formatKindOf(path.extname(file)) });
      } catch (e) {
        send(500, { ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    },
  });

  // ---- file preview/download route (浏览器预览或下载产出文件) ----
  const TEXT_EXTS = new Set([
    ".md", ".txt", ".html", ".htm", ".json", ".csv", ".log", ".yaml", ".yml",
    ".js", ".jsx", ".ts", ".tsx", ".py", ".c", ".h", ".cpp", ".hpp", ".ino",
    ".css", ".xml", ".sh", ".toml", ".ini", ".cfg", ".svg",
  ]);
  const disposeFileRoute = webServer.register({
    kind: "exact",
    path: "/doc-quick/file",
    handler: async (req, res) => {
      const send = (code, body) => {
        res.writeHead(code, { "content-type": "text/plain; charset=utf-8" });
        res.end(body);
      };
      try {
        const url = new URL(req.url ?? "/", "http://x");
        const target = path.resolve(String(url.searchParams.get("path") ?? ""));
        if (!target || !target.startsWith(os.homedir() + path.sep)) {
          return send(403, "forbidden: path must be an absolute path under the home directory");
        }
        let st;
        try {
          st = await fs.stat(target);
        } catch {
          return send(404, "file not found: " + target);
        }
        if (!st.isFile()) return send(404, "not a file: " + target);
        const ext = path.extname(target).toLowerCase();
        if (TEXT_EXTS.has(ext)) {
          const content = await fs.readFile(target, "utf8");
          res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
          res.end(content);
        } else {
          const data = await fs.readFile(target);
          res.writeHead(200, {
            "content-type": "application/octet-stream",
            "content-disposition": `attachment; filename="${encodeURIComponent(path.basename(target))}"`,
          });
          res.end(data);
        }
      } catch (e) {
        send(500, "error: " + (e instanceof Error ? e.message : String(e)));
      }
    },
  });

  // ---- RPC service (client 侧栏轮询) ---------------------------------
  const service = {
    getTasks(input) {
      const sessionId = input && input.sessionId ? String(input.sessionId) : "";
      const ids = sessionId ? (bySession.get(sessionId) ?? []) : [...tasks.keys()];
      return ids
        .map((id) => tasks.get(id))
        .filter(Boolean)
        .map(taskView)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    clearTasks(input) {
      const sessionId = input && input.sessionId ? String(input.sessionId) : "";
      if (sessionId) {
        for (const id of bySession.get(sessionId) ?? []) tasks.delete(id);
        bySession.delete(sessionId);
      } else {
        tasks.clear();
        bySession.clear();
      }
      return { cleared: true };
    },
  };
  Object.defineProperty(service, "typertRemote", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: { service, serviceKey: "docQuick", namespace: "docQuick" },
  });
  ctx.provide("docQuick", service);

  // ---- tool helpers ----------------------------------------------------
  function sessionIdOf(exec) {
    try {
      const s = exec && exec.agent && exec.agent.session;
      if (s && s.header && s.header.id) return s.header.id;
    } catch { /* ignore */ }
    return "";
  }

  function findTask(sessionId, source) {
    const ids = bySession.get(sessionId) ?? [];
    for (let i = ids.length - 1; i >= 0; i--) {
      const t = tasks.get(ids[i]);
      if (!t) continue;
      if (t.status === "received" || t.status === "processing") {
        if (!source || t.file === source || t.name === source) return t;
      }
    }
    return undefined;
  }

  async function readDocument(reference, start, limit) {
    const file = String(reference ?? "").trim();
    if (!file) return { ok: false, error: "缺少文件路径" };
    const real = path.resolve(file);
    let text;
    try {
      text = await extractText(real);
    } catch (e) {
      return { ok: false, error: "文档解析失败: " + (e instanceof Error ? e.message : String(e)) };
    }
    const startI = typeof start === "number" && start >= 0 ? Math.floor(start) : 0;
    const cap = typeof limit === "number" && limit >= 1 ? Math.min(Math.floor(limit), READ_LIMIT_MAX) : READ_LIMIT_DEFAULT;
    const endI = Math.min(text.length, startI + cap);
    return {
      ok: true,
      file: real,
      kind: formatKindOf(path.extname(real)),
      totalChars: text.length,
      start: startI,
      end: endI,
      text: text.slice(startI, endI),
      hasMore: endI < text.length,
      note: endI < text.length
        ? `文档共 ${text.length} 字,已读 ${startI}-${endI};继续读取请用 start=${endI} 再次调用。`
        : "已读到文档末尾。",
    };
  }

  // ---- chat tools ------------------------------------------------------
  tools.register(defineTool({
    name: "doc_list",
    description:
      "列出主人通过拖拽交给本会话的文档任务(路径、格式、大小、状态)。" +
      "用于: 处理前查看有哪些待处理文档;状态 received 表示文档已上传等待处理;processing 表示正在处理。" +
      "拿到路径后用 doc_read 读取;处理完毕务必用 doc_complete 登记产出。",
    parameters: {},
    output: {
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          sessionId: { type: "string" },
          total: { type: "number" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                sessionId: { type: "string" },
                file: { type: "string" },
                name: { type: "string" },
                size: { type: "number" },
                kind: { type: "string" },
                status: { type: "string" },
                summary: { type: "string" },
                error: { type: "string" },
                outputs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { path: { type: "string" }, kind: { type: "string" } },
                    additionalProperties: false,
                  },
                },
                receivedAt: { type: "number" },
                updatedAt: { type: "number" },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      render: (_args, value) => {
        const list = Array.isArray(value.tasks) ? value.tasks : [];
        if (list.length === 0) {
          return [{ type: "text", text: "当前会话还没有拖入的文档。请主人把文档拖进对话框,或告知本地文件路径后用 doc_read 读取。" }];
        }
        const lines = list.map((t, i) =>
          `[${i + 1}] ${t.name}(${t.kind},${(t.size / 1024).toFixed(1)}KB)\n路径: ${t.file}\n状态: ${t.status}${t.summary ? "\n摘要: " + t.summary : ""}${t.error ? "\n错误: " + t.error : ""}`
        );
        return [{ type: "text", text: `共 ${value.total ?? list.length} 个文档任务\n` + lines.join("\n\n") }];
      },
    },
    async execute(_args, exec) {
      const sessionId = sessionIdOf(exec);
      const list = service.getTasks({ sessionId });
      return { ok: true, sessionId, total: list.length, tasks: list };
    },
  }));

  tools.register(defineTool({
    name: "doc_read",
    description:
      "直读指定文档的内容(host 端直读本地文件系统,支持 PDF/Word/PPT/EPUB/Notebook/Markdown/文本等格式)。" +
      "用于: 精读主人拖入的文档、分段读取长文档、核对内容。" +
      "file 为文档绝对路径(优先使用 doc_list 返回的路径)。长文档用 start(字符偏移,0 起)分段读取,每次最多 " + READ_LIMIT_MAX + " 字符;" +
      "返回 hasMore=true 时用返回的 end 作为下一段 start 继续调用。读完后基于原文内容处理并注明来源路径。",
    parameters: {
      file: { type: "string", required: true, description: "文档绝对路径。" },
      start: { type: "number", description: "字符偏移(0 起),分段读取时用上一段返回的 end。缺省 0。" },
      limit: { type: "number", description: `本段最大字符数,缺省 ${READ_LIMIT_DEFAULT},上限 ${READ_LIMIT_MAX}。` },
    },
    output: {
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          error: { type: "string" },
          file: { type: "string" },
          kind: { type: "string" },
          totalChars: { type: "number" },
          start: { type: "number" },
          end: { type: "number" },
          text: { type: "string" },
          hasMore: { type: "boolean" },
          note: { type: "string" },
        },
        additionalProperties: false,
      },
      render: (_args, value) => {
        if (!value.ok) return [{ type: "text", text: "读取失败: " + (value.error ?? "未知错误") }];
        return [{
          type: "text",
          text: [
            `文件: ${value.file}(${value.kind},共 ${value.totalChars} 字,本段 ${value.start}-${value.end})`,
            "",
            value.text,
            "",
            value.note ?? "",
          ].join("\n"),
        }];
      },
    },
    async execute(args) {
      return readDocument(args.file, args.start, args.limit);
    },
  }));

  tools.register(defineTool({
    name: "doc_processing",
    description:
      "标记一个文档任务开始处理(可选调用)。source 为 doc_list 返回的文档路径;note 是简短说明(如'开始总结')。" +
      "处理完成后必须调用 doc_complete 登记产出。",
    parameters: {
      source: { type: "string", description: "源文档路径(缺省取最近一个待处理任务)。" },
      note: { type: "string", description: "处理说明,如'开始提取要点'。" },
    },
    output: {
      schema: {
        type: "object",
        properties: { ok: { type: "boolean" }, taskId: { type: "string" }, note: { type: "string" } },
        additionalProperties: false,
      },
      render: (_args, value) => [{ type: "text", text: value.ok ? `任务 ${value.taskId} 开始处理: ${value.note ?? ""}` : "没有找到待处理任务" }],
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec);
      const t = findTask(sessionId, String(args.source ?? "").trim());
      if (!t) return { ok: false, taskId: "", note: String(args.note ?? "") };
      t.status = "processing";
      t.error = "";
      t.updatedAt = Date.now();
      return { ok: true, taskId: t.id, note: String(args.note ?? "") };
    },
  }));

  tools.register(defineTool({
    name: "doc_complete",
    description:
      "登记文档处理完成: 产出文件列表(绝对路径)+一句话摘要。调用后插件会在主人界面右侧自动弹出侧栏,展示产出与文件路径。" +
      "产出文件请写入会话工作区(主人可见),files 每项 {path: 产出文件绝对路径, kind: 文件类型(如 markdown/csv/txt/pdf)}。" +
      "source 为源文档路径(缺省取最近一个待处理任务)。",
    parameters: {
      source: { type: "string", description: "源文档路径(缺省取最近一个待处理任务)。" },
      files: {
        type: "array",
        items: {
          type: "object",
          properties: { path: { type: "string" }, kind: { type: "string" } },
          additionalProperties: false,
        },
        description: "产出文件列表(绝对路径)。",
      },
      summary: { type: "string", description: "一句话摘要,如'已生成三章读书笔记'。" },
    },
    output: {
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          taskId: { type: "string" },
          outputs: {
            type: "array",
            items: { type: "object", properties: { path: { type: "string" }, kind: { type: "string" } }, additionalProperties: false },
          },
          summary: { type: "string" },
        },
        additionalProperties: false,
      },
      render: (_args, value) => {
        if (!value.ok) return [{ type: "text", text: "doc_complete 失败" }];
        const outs = Array.isArray(value.outputs) ? value.outputs : [];
        return [{
          type: "text",
          text: [
            `任务 ${value.taskId} 处理完成: ${value.summary ?? ""}`,
            ...outs.map((o) => `产出文件: ${o.path}(${o.kind ?? "file"})`),
            "产出侧栏已在界面右侧弹出。",
          ].join("\n"),
        }];
      },
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec);
      const files = Array.isArray(args.files)
        ? args.files.map((f) => ({
            path: String(f.path ?? "").trim(),
            kind: String(f.kind ?? "file").trim() || "file",
          })).filter((f) => f.path)
        : [];
      const summary = String(args.summary ?? "").trim();
      const source = String(args.source ?? "").trim();
      const t = findTask(sessionId, source);
      if (t) {
        t.status = "completed";
        t.outputs = files;
        t.summary = summary;
        t.error = "";
        t.updatedAt = Date.now();
        return { ok: true, taskId: t.id, outputs: files, summary };
      }
      const id = randomUUID();
      const now = Date.now();
      registerTask({
        id,
        sessionId,
        file: source || "",
        name: source ? path.basename(source) : "(未关联文档)",
        size: 0,
        kind: "file",
        status: "completed",
        summary,
        outputs: files,
        error: "",
        receivedAt: now,
        updatedAt: now,
      });
      return { ok: true, taskId: id, outputs: files, summary };
    },
  }));

  tools.register(defineTool({
    name: "doc_fail",
    description: "登记文档处理失败: 说明原因(如文件无法解析、需求不明确)。",
    parameters: {
      source: { type: "string", description: "源文档路径(缺省取最近一个待处理任务)。" },
      reason: { type: "string", required: true, description: "失败原因。" },
    },
    output: {
      schema: {
        type: "object",
        properties: { ok: { type: "boolean" }, taskId: { type: "string" }, reason: { type: "string" } },
        additionalProperties: false,
      },
      render: (_args, value) => [{ type: "text", text: value.ok ? `任务 ${value.taskId} 标记失败: ${value.reason ?? ""}` : "没有找到待处理任务" }],
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec);
      const reason = String(args.reason ?? "").trim() || "未说明";
      const t = findTask(sessionId, String(args.source ?? "").trim());
      if (!t) return { ok: false, taskId: "", reason };
      t.status = "failed";
      t.error = reason;
      t.updatedAt = Date.now();
      return { ok: true, taskId: t.id, reason };
    },
  }));

  // ---- model guidance ----
  systemPrompt.section({
    name: "doc-quick",
    order: 119,
    text:
      "文档快处(doc-quick)插件: 主人可以直接把文档(文本/PDF/Word/PPT/EPUB/Notebook/Markdown 等)拖进 Web 对话框," +
      "文件会由 host 端保存到 ~/.dsh/doc-quick/<会话id>/ 目录并自动通知你读取。处理流程: " +
      "① 用 doc_list 查看待处理文档(拿到绝对路径); " +
      "② 用 doc_read 分段读取文档内容(支持 PDF/Word/PPT/EPUB/Notebook/Markdown/文本,每次最多 12000 字符,长文档按返回的 end 继续); " +
      "③ 按主人要求处理,产出文件请写入会话工作区(主人可见路径); " +
      "④ 处理完毕必须调用 doc_complete 登记产出(文件绝对路径列表 + 一句话摘要),插件会自动在界面右侧弹出产出侧栏展示文件路径; 处理失败则调用 doc_fail 说明原因。" +
      "拖入的文档路径形如 /storage/.../.dsh/doc-quick/<会话id>/<文件名>,引用文档内容时注明来源路径。",
  });

  // ---- teardown ----
  ctx.effect(() => () => {
    disposeRoute();
    disposeFileRoute();
  }, "doc-quick: routes");
}
