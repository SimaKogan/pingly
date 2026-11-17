(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* unavailable */ } },
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1400); };
  const copy = (text, msg = 'Copied!') => navigator.clipboard.writeText(text).then(() => toast(msg), () => toast('Copy failed'));

  const S = { params: [], headers: [], last: '', lastRaw: '' };
  const DEFAULT = { method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1', params: [], headers: [{ on: true, k: 'Accept', v: 'application/json' }], body: '', bodyType: 'json', token: '' };

  // ---- tabs ----
  document.querySelectorAll('[data-tabs]').forEach((box) => {
    const scope = box.parentElement;
    box.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
      box.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b));
      scope.querySelectorAll(':scope > [data-p]').forEach((p) => p.classList.toggle('on', p.dataset.p === b.dataset.t));
    }));
  });

  // ---- key/value editors ----
  function renderKV(name) {
    const box = $('#' + name), arr = S[name];
    if (!arr.length || arr[arr.length - 1].k || arr[arr.length - 1].v) arr.push({ on: true, k: '', v: '' });
    box.innerHTML = '';
    arr.forEach((r, i) => {
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<input type="checkbox" ${r.on ? 'checked' : ''} aria-label="Enabled"><input type="text" placeholder="Key" value="${esc(r.k).replace(/"/g, '&quot;')}"><input type="text" placeholder="Value" value="${esc(r.v).replace(/"/g, '&quot;')}"><button class="x" title="Remove">✕</button>`;
      const [c, k, v, x] = row.children;
      c.onchange = () => { r.on = c.checked; };
      k.oninput = () => { r.k = k.value; };
      v.oninput = () => { r.v = v.value; };
      k.onchange = v.onchange = () => { if (i === arr.length - 1 && (r.k || r.v)) renderKV(name); };
      x.onclick = () => { arr.splice(i, 1); renderKV(name); };
      box.appendChild(row);
    });
  }

  // ---- build request ----
  function build() {
    let raw = $('#url').value.trim();
    if (!raw) throw new Error('Enter a URL first.');
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    const url = new URL(raw);
    S.params.filter((p) => p.on && p.k).forEach((p) => url.searchParams.append(p.k, p.v));
    const headers = {};
    S.headers.filter((h) => h.on && h.k).forEach((h) => { headers[h.k] = h.v; });
    const token = $('#token').value.trim();
    if (token && !Object.keys(headers).some((k) => k.toLowerCase() === 'authorization')) headers.Authorization = 'Bearer ' + token;
    const method = $('#method').value, body = $('#body').value;
    const hasBody = body.trim() && !['GET', 'HEAD'].includes(method);
    if (hasBody && $('#bodyType').value === 'json' && !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
    return { method, url: url.toString(), headers, body: hasBody ? body : undefined };
  }
  const q = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;
  const toCurl = (r) => ['curl' + (r.method === 'GET' ? '' : ` -X ${r.method}`) + ' ' + q(r.url),
    ...Object.entries(r.headers).map(([k, v]) => `-H ${q(k + ': ' + v)}`), ...(r.body ? [`--data-raw ${q(r.body)}`] : [])].join(' \\\n  ');
  const toFetch = (r) => `fetch(${JSON.stringify(r.url)}, ${JSON.stringify({ method: r.method, headers: r.headers, ...(r.body ? { body: r.body } : {}) }, null, 2)})\n  .then((res) => res.json())\n  .then(console.log);`;

  // ---- render response ----
  function highlight(json) {
    return esc(json).replace(/("(?:\\.|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (m) => {
      let c = 'jn';
      if (m[0] === '"') c = m.endsWith(':') ? 'jk' : 'js'; else if (m === 'null') c = 'jz'; else if (m === 'true' || m === 'false') c = 'jb';
      return `<span class="${c}">${m}</span>`;
    });
  }
  const fmtSize = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
  function showError(err) {
    const cors = err instanceof TypeError;
    $('#status').innerHTML = '<span class="pill err">Error</span>';
    $('#rbody').innerHTML = `<div class="err-box">${esc(err.message || err)}<small>${cors ? 'The request failed before a response arrived. Common causes: the server blocks browser requests (CORS), the URL is unreachable, or you are offline. Try an API that allows CORS, e.g. jsonplaceholder.typicode.com.' : ''}</small></div>`;
    $('#rraw').textContent = ''; $('#rheaders').innerHTML = ''; S.last = '';
  }
  function showResponse(res, text, ms) {
    const cls = res.status < 300 ? 'ok' : res.status < 500 ? 'warn' : 'err';
    $('#status').innerHTML = `<span class="pill ${cls}">${res.status} ${esc(res.statusText)}</span><span class="muted">${ms} ms</span><span class="muted">${fmtSize(new Blob([text]).size)}</span>`;
    let pretty = text, html;
    try { pretty = JSON.stringify(JSON.parse(text), null, 2); html = highlight(pretty); } catch { html = esc(text); }
    $('#rbody').innerHTML = html || '<span class="muted">(empty body)</span>';
    $('#rraw').textContent = text;
    $('#rheaders').innerHTML = [...res.headers].map(([k, v]) => `<div class="hrow"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('') || '<span class="muted">No readable headers (the server may not expose them to browsers).</span>';
    S.last = pretty;
  }

  // ---- send ----
  let busy = false;
  async function send() {
    if (busy) return;
    let r;
    try { r = build(); } catch (e) { return showError(e); }
    busy = true; $('#send').disabled = true; $('#send').textContent = 'Sending…';
    const t0 = performance.now(), ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(r.url, { method: r.method, headers: r.headers, body: r.body, signal: ctrl.signal });
      const text = await res.text(), ms = Math.round(performance.now() - t0);
      showResponse(res, text, ms); pushHistory(res.status, ms);
    } catch (e) { showError(e.name === 'AbortError' ? new Error('Request timed out after 30 s.') : e); }
    finally { clearTimeout(timer); busy = false; $('#send').disabled = false; $('#send').textContent = 'Send'; }
  }

  // ---- history ----
  let history = store.get('pingly:history', []);
  function snapshot() { return { method: $('#method').value, url: $('#url').value, params: S.params.filter((p) => p.k), headers: S.headers.filter((h) => h.k), body: $('#body').value, bodyType: $('#bodyType').value }; }
  function pushHistory(status, ms) {
    history.unshift({ ...snapshot(), status, ms, ts: Date.now() });
    history = history.slice(0, 30); store.set('pingly:history', history); renderHistory();
  }
  function renderHistory() {
    const ul = $('#history');
    if (!history.length) { ul.innerHTML = '<li class="empty">No requests yet</li>'; return; }
    ul.innerHTML = history.map((h, i) => `<li data-i="${i}" title="${esc(h.url)}"><span class="m ${h.method}">${h.method}</span><span class="u">${esc(h.url.replace(/^https?:\/\//, ''))}</span></li>`).join('');
  }
  $('#history').addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) load(history[li.dataset.i]); });
  $('#clearHist').onclick = () => { history = []; store.set('pingly:history', history); renderHistory(); };

  function load(s) {
    $('#method').value = s.method; $('#url').value = s.url; $('#body').value = s.body || ''; $('#bodyType').value = s.bodyType || 'json';
    S.params = (s.params || []).map((p) => ({ ...p })); S.headers = (s.headers || []).map((h) => ({ ...h }));
    renderKV('params'); renderKV('headers');
  }

  // ---- wiring ----
  $('#send').onclick = send;
  $('#copyCurl').onclick = () => { try { copy(toCurl(build()), 'cURL copied'); } catch (e) { toast(e.message); } };
  $('#copyFetch').onclick = () => { try { copy(toFetch(build()), 'fetch copied'); } catch (e) { toast(e.message); } };
  $('#copyRes').onclick = () => (S.last ? copy(S.last) : toast('Nothing to copy yet'));
  $('#beautify').onclick = () => { try { $('#body').value = JSON.stringify(JSON.parse($('#body').value), null, 2); } catch { toast('Not valid JSON'); } };
  $('#url').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(); } });
  function setTheme(t) { document.documentElement.dataset.theme = t; $('#theme').textContent = t === 'dark' ? '🌙' : '☀️'; store.set('pingly:theme', t); }
  $('#theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  setTheme(store.get('pingly:theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  load(history[0] || DEFAULT); renderHistory();
})();
