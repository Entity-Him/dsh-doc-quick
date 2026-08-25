import { z } from "zod";

const outputSchema = z.object({
  path: z.string(),
  kind: z.string(),
});
const taskSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  file: z.string(),
  name: z.string(),
  size: z.number(),
  kind: z.string(),
  status: z.string(),
  summary: z.string(),
  outputs: z.array(outputSchema),
  error: z.string(),
  receivedAt: z.number(),
  updatedAt: z.number(),
});
const tasksSchema = z.array(taskSchema);
const tasksInputSchema = z.object({ sessionId: z.string().optional() });
const clearedSchema = z.object({ cleared: z.boolean() });

const _tasks = { mode: "strict", typeSymbol: "dsh-doc-quick#Tasks", schema: tasksSchema };
const _tasksInput = { mode: "strict", typeSymbol: "dsh-doc-quick#TasksInput", schema: tasksInputSchema };
const _cleared = { mode: "strict", typeSymbol: "dsh-doc-quick#Cleared", schema: clearedSchema };

export const TYPERT = {
  package: "dsh-doc-quick",
  face: "host",
  schemas: [],
  invocations: [
    { id: "dsh-doc-quick#docQuick/getTasks", service: "docQuick", namespace: "docQuick", method: "getTasks", invocation: { kind: "direct" }, parameters: [{ name: "input", wire: "input", source: "json", codec: _tasksInput }], result: _tasks },
    { id: "dsh-doc-quick#docQuick/clearTasks", service: "docQuick", namespace: "docQuick", method: "clearTasks", invocation: { kind: "direct" }, parameters: [{ name: "input", wire: "input", source: "json", codec: _tasksInput }], result: _cleared },
  ],
  model: {
    services: [{
      description: "文档快处服务(ctx.docQuick): 查看拖入文档的任务状态。",
      summary: "文档快处服务。",
      tags: [], jsDoc: "", key: "docQuick", exportName: "DocQuickService",
      members: [
        { kind: "method", name: "getTasks", signature: "getTasks(input: { sessionId?: string }): Task[]", summary: "读取任务列表(按会话过滤)。", jsDoc: "" },
        { kind: "method", name: "clearTasks", signature: "clearTasks(input: { sessionId?: string }): { cleared: boolean }", summary: "清空任务记录。", jsDoc: "" },
      ],
      types: [],
    }],
    events: [],
    objects: [],
  },
};
export default TYPERT;
