# dsh-doc-quick

Drag a document into the dsh **web** chat — the agent reads it straight from your
local filesystem (no sandbox limits), processes it, and when done a right-hand
sidebar pops up with the outputs and their file paths.

## Features

- **Drag & drop**: drop a file into the web dialog; the host saves it to
  `~/.dsh/doc-quick/<sessionId>/` and registers a task.
- **Local read**: the host reads the local filesystem directly. Supported
  formats: PDF, Word (doc/docx), PowerPoint (ppt/pptx), EPUB, Notebook
  (ipynb), Markdown and plain text.
- **Agent tools**: `doc_list` (see your pending tasks), `doc_read` (read the
  file content), `doc_complete` (register the produced outputs).
- **Result sidebar**: task status, summaries, and output file paths with
  preview / download links on the right side of the chat.

## Install

```sh
dsh plugin --profile web add github:Entity-Him/dsh-doc-quick
```

Requires the dsh **web** profile (the sidebar is a web-client UI). The plugin is
pure JavaScript — no native or Node-gyp dependencies. PDF parsing lazily loads
`pdfjs-dist` when available and degrades gracefully when it is not.

## Usage

1. Open the dsh web chat.
2. Drag a file into the input box.
3. Ask the agent to read and process it (it already knows the file was dropped).
4. When finished, the right sidebar shows the outputs and file paths — click to
   preview or download.

## How it works

```
drag & drop ──> host saves to ~/.dsh/doc-quick/<sessionId>/
     └──> agent: doc_read(file) ──> doc_complete(outputs)
     └──> client: right sidebar polls docQuick/getTasks
```

## License

MIT
