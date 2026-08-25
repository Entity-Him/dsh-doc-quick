window.__ModuleLoader__.load({
  id: 'dsh-doc-quick',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const el = React.createElement

    const css = [
      '.dq-root{position:fixed;top:0;right:0;bottom:0;width:392px;max-width:92vw;z-index:1200;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);border-left:1px solid var(--dsw-alias-border-l2);box-shadow:-8px 0 24px rgba(0,0,0,.18);transform:translateX(105%);transition:transform .28s ease;pointer-events:auto}',
      '.dq-root.open{transform:translateX(0)}',
      '.dq-backdrop{position:fixed;inset:0;z-index:1150;background:rgba(10,12,20,.18);pointer-events:auto}',
      '.dq-head{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.dq-title{font-size:14px;font-weight:600;margin:0;flex:1;color:var(--dsw-alias-label-primary)}',
      '.dq-close{font:inherit;font-size:16px;line-height:1;color:var(--dsw-alias-label-tertiary);background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:6px}',
      '.dq-fold-btn{font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 10px;cursor:pointer;white-space:nowrap}',
      '.dq-fold-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dq-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dq-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dq-body{flex:1;overflow:auto;padding:12px 14px 24px;display:flex;flex-direction:column;gap:12px}',
      '.dq-empty{font-size:12px;color:var(--dsw-alias-label-tertiary);margin:8px 0;line-height:1.7;white-space:pre-wrap}',
      '.dq-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-base);display:flex;flex-direction:column;gap:6px}',
      '.dq-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.dq-name{font-size:13px;font-weight:600;margin:0;color:var(--dsw-alias-label-primary);word-break:break-all}',
      '.dq-chip{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dq-chip.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.dq-chip.busy{color:var(--dsw-alias-state-warning-primary);border-color:var(--dsw-alias-state-warning-primary)}',
      '.dq-chip.bad{color:var(--dsw-alias-state-danger-primary);border-color:var(--dsw-alias-state-danger-primary)}',
      '.dq-meta{font-family:ui-monospace,monospace;font-size:11px;color:var(--dsw-alias-label-tertiary);margin:0;word-break:break-all;line-height:1.5}',
      '.dq-summary{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin:0;white-space:pre-wrap}',
      '.dq-out{border-top:1px dashed var(--dsw-alias-border-l1);padding-top:6px;display:flex;flex-direction:column;gap:6px}',
      '.dq-out-item{display:flex;align-items:center;gap:8px}',
      '.dq-out-path{flex:1;font-family:ui-monospace,monospace;font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-all;margin:0;line-height:1.5}',
      '.dq-btn{font:inherit;font-size:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 9px;cursor:pointer;white-space:nowrap}',
      '.dq-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dq-btn.primary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:var(--dsw-alias-label-primary-inverted)}',
      '.dq-btn:disabled{opacity:.55;cursor:not-allowed}',
      '.dq-statusbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.dq-shade{position:fixed;inset:0;z-index:1100;pointer-events:none;display:flex;align-items:center;justify-content:center;background:rgba(10,12,20,.55);backdrop-filter:blur(2px)}',
      '.dq-shade-box{border:2px dashed var(--dsw-alias-state-business-primary);border-radius:16px;padding:28px 44px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;text-align:center}',
      '.dq-shade-box small{display:block;margin-top:6px;font-size:12px;font-weight:400;color:var(--dsw-alias-label-tertiary)}',
      '.dq-notice{font-size:12px;color:var(--dsw-alias-state-danger-primary);margin:0}',
      '.dq-tab{position:fixed;top:120px;right:0;z-index:1190;width:36px;padding:12px 5px;display:flex;flex-direction:column;align-items:center;gap:4px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-right:none;border-radius:10px 0 0 10px;box-shadow:-2px 2px 8px rgba(0,0,0,.14);cursor:pointer;pointer-events:auto;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dq-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dq-tab-text{writing-mode:vertical-rl;letter-spacing:2px}',
    ].join('\n')
    if (typeof document !== 'undefined') {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-doc-quick'
      tag.textContent = css
      document.head.appendChild(tag)
    }

    // ---- result parsers ----
    function parseTask(v) {
      const o = (v && typeof v === 'object') ? v : {}
      return {
        id: String(o.id ?? ''),
        sessionId: String(o.sessionId ?? ''),
        file: String(o.file ?? ''),
        name: String(o.name ?? ''),
        size: Number(o.size ?? 0),
        kind: String(o.kind ?? ''),
        status: String(o.status ?? ''),
        summary: String(o.summary ?? ''),
        outputs: Array.isArray(o.outputs) ? o.outputs.map((x) => ({ path: String((x && x.path) ?? ''), kind: String((x && x.kind) ?? 'file') })) : [],
        error: String(o.error ?? ''),
        receivedAt: Number(o.receivedAt ?? 0),
        updatedAt: Number(o.updatedAt ?? 0),
      }
    }
    function parseTasks(v) {
      return Array.isArray(v) ? v.map(parseTask) : []
    }
    const _tasksInput = { mode: 'strict', typeSymbol: 'dsh-doc-quick#TasksInput', schema: { parse: (v) => ({ sessionId: v && v.sessionId ? String(v.sessionId) : undefined }) } }
    const _tasks = { mode: 'strict', typeSymbol: 'dsh-doc-quick#Tasks', schema: { parse: parseTasks } }
    const _cleared = { mode: 'strict', typeSymbol: 'dsh-doc-quick#Cleared', schema: { parse: (v) => ({ cleared: !!(v && v.cleared) }) } }

    const CONTRIBUTION = {
      package: 'dsh-doc-quick',
      descriptors: [
        { id: 'dsh-doc-quick#docQuick/getTasks', service: 'docQuick', namespace: 'docQuick', method: 'getTasks', invocation: { kind: 'direct' }, parameters: [{ name: 'input', wire: 'input', source: 'json', codec: _tasksInput }], result: _tasks },
        { id: 'dsh-doc-quick#docQuick/clearTasks', service: 'docQuick', namespace: 'docQuick', method: 'clearTasks', invocation: { kind: 'direct' }, parameters: [{ name: 'input', wire: 'input', source: 'json', codec: _tasksInput }], result: _cleared },
      ],
    }

    // ---- store ----
    function makeStore(initial) {
      let state = initial
      const listeners = new Set()
      return {
        getSnapshot: () => state,
        subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn) } },
        set: (next) => { state = next; for (const fn of listeners) fn() },
      }
    }
    const store = makeStore({
      tasks: [],
      open: false,
      dragging: false,
      busy: false,
      notice: '',
      currentSessionId: undefined,
      lastCompletedAt: 0,
      closedAt: 0,
    })
    function patchStore(patch) {
      const s = store.getSnapshot()
      store.set(Object.assign({}, s, patch))
    }

    // ---- helpers ----
    function readFileBase64(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => {
          const s = String(r.result || '')
          resolve(s.indexOf(',') === -1 ? s : s.slice(s.indexOf(',') + 1))
        }
        r.onerror = () => reject(r.error || new Error('读取文件失败'))
        r.readAsDataURL(file)
      })
    }
    function copyText(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text).catch(() => {})
        }
      } catch (e) { /* ignore */ }
      return Promise.resolve()
    }

    const api = {
      _rpc: null,
      bindRpc(rpc) { this._rpc = rpc },
      async call(method, args) {
        const rpc = this._rpc
        if (!rpc || typeof rpc[method] !== 'function') throw new Error('host 端不支持该方法: ' + method)
        const result = await rpc[method](...(args ?? []))
        if (result === null || typeof result !== 'object' || result.ok !== true) {
          throw new Error(result && result.error && result.error.message ? result.error.message : 'rpc failed: ' + method)
        }
        return result.value
      },
      getTasks: async (sessionId) => {
        const list = await api.call('getTasks', [{ sessionId }])
        return Array.isArray(list) ? list : []
      },
      clearTasks: async (sessionId) => api.call('clearTasks', [{ sessionId }]),
      async upload(sessionId, file) {
        const data = await readFileBase64(file)
        const res = await fetch('/doc-quick/upload', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, name: file.name, data, size: file.size }),
        })
        let body = {}
        try { body = await res.json() } catch (e) { /* ignore */ }
        if (!res.ok || !body.ok) throw new Error((body && body.error) || ('上传失败 HTTP ' + res.status))
        return body
      },
      async prompt(sessionId, text) {
        const res = await fetch('/api/session.prompt', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: crypto.randomUUID(),
            method: 'session.prompt',
            payload: { sessionId, mode: 'queue', content: [{ type: 'text', text }] },
          }),
        })
        const body = await res.json().catch(() => ({}))
        return !!(body && body.result && body.result.ok === true)
      },
      async openPath(p) {
        const res = await fetch('/api/host.openPath', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: crypto.randomUUID(),
            method: 'host.openPath',
            payload: { path: p },
          }),
        })
        const body = await res.json().catch(() => ({}))
        return !!(body && body.result && body.result.ok === true)
      },
    }

    // ---- output open (浏览器预览/下载, 跨平台可用) ----
    function openOutput(p) {
      try {
        const base = (typeof location !== 'undefined' && location.origin) || 'http://127.0.0.1:3080'
        window.open(base + '/doc-quick/file?path=' + encodeURIComponent(p), '_blank', 'noopener')
      } catch (e) { /* ignore */ }
    }

    // ---- drag & drop ----
    function installDragDrop(store, api) {
      let depth = 0
      const hasFiles = (e) => !!(e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') !== -1)
      const onDragEnter = (e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth += 1
        patchStore({ dragging: true })
      }
      const onDragOver = (e) => { if (hasFiles(e)) e.preventDefault() }
      const onDragLeave = (e) => {
        if (!hasFiles(e)) return
        depth = Math.max(0, depth - 1)
        if (depth === 0) patchStore({ dragging: false })
      }
      const onDrop = async (e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth = 0
        patchStore({ dragging: false })
        const files = Array.from((e.dataTransfer && e.dataTransfer.files) || [])
        if (files.length === 0) return
        const sid = store.getSnapshot().currentSessionId
        if (!sid) {
          patchStore({ notice: '请先打开/新建一个会话,再拖入文档' })
          return
        }
        patchStore({ busy: true, notice: '' })
        try {
          for (const file of files) {
            if (file.size > 24 * 1024 * 1024) {
              patchStore({ notice: file.name + ' 超过 24MB 上限,已跳过' })
              continue
            }
            try {
              const res = await api.upload(sid, file)
              if (res && res.ok) {
                void api.prompt(sid, '📎 主人拖入文档: ' + res.name + '\n已保存到: ' + res.path + '\n请用 doc_read 读取并理解内容,等待主人下达处理要求。')
              }
            } catch (err) {
              patchStore({ notice: file.name + ' 上传失败: ' + (err && err.message ? err.message : String(err)) })
            }
          }
          const tasks = await api.getTasks(sid)
          patchStore({ tasks })
        } finally {
          patchStore({ busy: false })
        }
      }
      window.addEventListener('dragenter', onDragEnter)
      window.addEventListener('dragover', onDragOver)
      window.addEventListener('dragleave', onDragLeave)
      window.addEventListener('drop', onDrop)
      return () => {
        window.removeEventListener('dragenter', onDragEnter)
        window.removeEventListener('dragover', onDragOver)
        window.removeEventListener('dragleave', onDragLeave)
        window.removeEventListener('drop', onDrop)
      }
    }

    // ---- components ----
    function statusLabel(s) {
      return ({ received: '已接收', processing: '处理中', completed: '已完成', failed: '失败' })[s] || s
    }

    function DocPanel(props) {
      const current = props.useSessions ? props.useSessions((s) => s.current) : undefined
      const snap = props.useTasks ? props.useTasks((s) => s) : store.getSnapshot()
      const tasks = snap.tasks || []
      const open = !!snap.open
      const dragging = !!snap.dragging

      React.useEffect(() => {
        patchStore({ currentSessionId: current })
      }, [current])

      React.useEffect(() => {
        let alive = true
        const refresh = async () => {
          const sid = store.getSnapshot().currentSessionId
          if (!sid) return
          try {
            const list = await api.getTasks(sid)
            if (!alive) return
            const prev = store.getSnapshot()
            const latest = list.reduce((m, t) => (t.status === 'completed' ? Math.max(m, t.updatedAt) : m), 0)
            if (latest > (prev.lastCompletedAt || 0)) {
              const now = Date.now()
              const suppressed = prev.closedAt > 0 && now - prev.closedAt < 5000
              patchStore({ tasks: list, lastCompletedAt: latest, open: suppressed ? false : true })
            } else {
              patchStore({ tasks: list })
            }
          } catch (e) { /* host 暂不可用则跳过 */ }
        }
        void refresh()
        const timer = setInterval(refresh, 2000)
        return () => { alive = false; clearInterval(timer) }
      }, [])

      const cards = tasks.map((t) => {
        const chipCls = t.status === 'completed' ? 'ok' : t.status === 'failed' ? 'bad' : t.status === 'processing' ? 'busy' : ''
        const sizeTxt = t.size > 0 ? (t.size / 1024).toFixed(1) + 'KB' : ''
        const outs = (t.status === 'completed' && Array.isArray(t.outputs) ? t.outputs : [])
        return el('div', { className: 'dq-card', key: t.id },
          el('div', { className: 'dq-row' },
            el('p', { className: 'dq-name' }, t.name || '(未命名)'),
            el('span', { className: 'dq-chip ' + chipCls }, statusLabel(t.status)),
            t.kind ? el('span', { className: 'dq-chip' }, t.kind) : null,
            sizeTxt ? el('span', { className: 'dq-chip' }, sizeTxt) : null,
          ),
          t.file ? el('p', { className: 'dq-meta' }, t.file) : null,
          t.summary ? el('p', { className: 'dq-summary' }, t.summary) : null,
          t.error ? el('p', { className: 'dq-notice' }, '失败: ' + t.error) : null,
          outs.length > 0
            ? el('div', { className: 'dq-out' },
                outs.map((o, i) => el('div', { className: 'dq-out-item', key: i },
                  el('p', { className: 'dq-out-path' }, o.path),
                  el('button', { type: 'button', className: 'dq-btn primary', onClick: () => { openOutput(o.path) } }, '打开'),
                  el('button', { type: 'button', className: 'dq-btn', onClick: () => { void copyText(o.path) } }, '复制'),
                )))
            : null,
        )
      })

      return el('div', null,
        dragging ? el('div', { className: 'dq-shade' },
          el('div', { className: 'dq-shade-box' },
            '松手,交给小鲸处理喵～',
            el('small', null, '文件会保存到 host 端,小鲸直接读取并等待主人的处理要求'))) : null,
        open ? el('div', { className: 'dq-backdrop', onClick: () => patchStore({ open: false, closedAt: Date.now() }) }) : null,
        el('div', { className: 'dq-root' + (open ? ' open' : '') },
          el('div', { className: 'dq-head' },
            el('p', { className: 'dq-title' }, '📎 文档快处'),
            el('button', { type: 'button', className: 'dq-fold-btn', onClick: () => patchStore({ open: false, closedAt: Date.now() }) }, '⮜ 收起'),
            el('button', { type: 'button', className: 'dq-close', onClick: () => patchStore({ open: false, closedAt: Date.now() }), title: '折叠侧栏' }, '✕')),
          el('div', { className: 'dq-body' },
            tasks.length === 0
              ? el('p', { className: 'dq-empty' },
                  '把文档直接拖进对话框,小鲸就能读取并按要求处理喵～\n处理完成后,这里会自动展示产出文件与路径。')
              : cards,
          ),
        ),
        !open ? el('div', { className: 'dq-tab', onClick: () => patchStore({ open: true }), title: '展开文档快处' },
          el('span', null, '📎'),
          el('span', { className: 'dq-tab-text' }, '产出'),
        ) : null,
      )
    }

    function StatusBar(props) {
      const snap = props.useTasks ? props.useTasks((s) => s) : store.getSnapshot()
      const sessionId = props.sessionId
      const tasks = (snap.tasks || []).filter((t) => t.sessionId === sessionId && t.status !== 'completed' && t.status !== 'failed')
      const notice = snap.notice || ''
      if (tasks.length === 0 && !notice) return null
      return el('div', { className: 'dq-statusbar' },
        el('span', null, '📎'),
        tasks.slice(0, 4).map((t) => el('span', { className: 'dq-chip', key: t.id }, t.name + ' · ' + statusLabel(t.status))),
        tasks.length > 4 ? el('span', { className: 'dq-chip' }, '+' + (tasks.length - 4)) : null,
        notice ? el('span', { className: 'dq-chip bad' }, notice) : null,
      )
    }

    // ---- apply ----
    const inject = ['remote', 'slots']

    async function apply(ctx) {
      const remote = ctx.remote
      if (remote === undefined || typeof remote.$mount !== 'function') return
      const unmount = await remote.$mount(CONTRIBUTION)
      ctx.effect(() => () => { unmount() }, 'doc-quick: remote contribution')
      const rpc = ctx.get('remote.docQuick')
      if (rpc === undefined) return
      api.bindRpc(rpc)

      const slots = ctx.get('slots')
      if (slots === undefined) return

      slots.inject('shell.overlay', () => {
        const dispose = slots.register({
          name: 'shell.overlay',
          id: 'doc-quick',
          order: 90,
          inject: () => ({ hooks: { tasks: store }, api }),
        }, DocPanel)
        return () => { dispose() }
      })

      slots.inject('conversation.input.dock', () => {
        const dispose = slots.register({
          name: 'conversation.input.dock',
          id: 'doc-quick',
          order: 10,
          inject: () => ({ hooks: { tasks: store }, api }),
        }, StatusBar)
        return () => { dispose() }
      })

      const stop = installDragDrop(store, api)
      ctx.effect(() => () => { stop() }, 'doc-quick: drag & drop')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
