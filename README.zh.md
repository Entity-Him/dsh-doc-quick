# dsh-doc-quick（文档快处）

把文档拖进 dsh **Web** 对话框，Agent 直读本地文件系统（不受会话沙箱限制）处理，
完成后在右侧弹出侧栏展示产出与文件路径。

## 功能

- **拖拽即处理**：文件拖进 Web 对话框，host 端保存到 `~/.dsh/doc-quick/<会话ID>/` 并登记任务。
- **直读本地**：host 端直接读取本地文件，支持 PDF、Word（doc/docx）、PPT（ppt/pptx）、EPUB、Notebook（ipynb）、Markdown 与纯文本。
- **Agent 工具**：`doc_list`（查看待处理任务）、`doc_read`（读取文件内容）、`doc_complete`（登记产出）。
- **结果侧栏**：任务状态、摘要与产出文件路径，支持预览与下载。

## 安装

```sh
dsh plugin --profile web add github:Entity-Him/dsh-doc-quick
```

需要 dsh **web** 配置文件（侧栏是 Web 端 UI）。插件为纯 JavaScript，无原生依赖；
PDF 解析按需加载 `pdfjs-dist`，缺失时优雅降级。

## 使用

1. 打开 dsh Web 对话。
2. 把文件拖进输入框。
3. 让 Agent 读取并处理（它已知晓文件已拖入）。
4. 完成后右侧侧栏展示产出与文件路径，点击可预览或下载。

## 工作原理

```
拖拽 ──> host 保存到 ~/.dsh/doc-quick/<会话ID>/
    └──> agent: doc_read(文件) ──> doc_complete(产出)
    └──> client: 右侧侧栏轮询 docQuick/getTasks
```

## 许可证

MIT
