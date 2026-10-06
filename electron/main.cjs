const { app, BrowserWindow, clipboard, dialog, ipcMain, net, protocol } = require('electron');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

const OLLAMA_BASE = 'http://127.0.0.1:11434';
const SYSTEM_PROMPT = 'Senin adın Prism. Sen yazılım, web geliştirme ve kodlama konusunda uzmanlaşmış son derece yetenekli, doğrudan ve optimize cevaplar veren bir yerel yapay zeka asistansın. Kod yanıtlarında her zaman temiz, hatasız ve kasmayan en iyi uygulamaları (best-practices) tercih et. Günlük sohbetlerde samimi ve kısa ol, odağını her zaman yazılım çözümlerine ver.';
const PRESETS = {
  low: ['qwen2.5-coder:1.5b'],
  medium: ['llama3.2:3b', 'deepseek-coder:1.5b'],
  high: ['qwen2.5-coder:7b', 'llama3.1:8b']
};
const KNOWN_MODELS = Object.entries(PRESETS).flatMap(([profile, models]) => models.map((name) => ({ name, profile })));

let mainWindow;
let pullQueue = [];
let activePull = null;
let generationControllers = new Map();
let isQuitting = false;

function safeSend(window, channel, payload) {
  if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
    window.webContents.send(channel, payload);
  }
}

function sendPullState(payload) {
  safeSend(mainWindow, 'ollama:pull-state', payload);
}

function profileForMachine() {
  const ramGiB = os.totalmem() / (1024 ** 3);
  const logicalCpus = os.cpus().length;
  if (ramGiB <= 8 || logicalCpus <= 4) return { profile: 'low', ramGiB, logicalCpus };
  if (ramGiB >= 16 && logicalCpus >= 8) return { profile: 'high', ramGiB, logicalCpus };
  return { profile: 'medium', ramGiB, logicalCpus };
}

function recommendationFor(profile, installedNames) {
  const candidates = PRESETS[profile] || PRESETS.medium;
  return candidates.find((name) => installedNames.includes(name)) || candidates[0];
}

async function readResponseError(response) {
  const body = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(body);
    return parsed.error || body || `HTTP ${response.status}`;
  } catch {
    return body || `HTTP ${response.status}`;
  }
}

async function listModels() {
  const response = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(await readResponseError(response));
  const data = await response.json();
  return Array.isArray(data.models) ? data.models : [];
}

async function* readJsonLines(response) {
  if (!response.body) throw new Error('The Ollama response did not include a stream.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        yield JSON.parse(line);
      }
    }
    pending += decoder.decode();
    if (pending.trim()) yield JSON.parse(pending);
  } finally {
    reader.releaseLock();
  }
}

function validModelName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 200 && !/[\r\n\0]/.test(name);
}

function validateExportPayload(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.chats)) {
    throw new Error('Invalid conversation archive.');
  }
  const json = JSON.stringify(payload);
  if (Buffer.byteLength(json, 'utf8') > 40 * 1024 * 1024) {
    throw new Error('The conversation archive is too large to export.');
  }
  return json;
}

function normalizeImportedArchive(parsed) {
  if (!parsed || parsed.format !== 'prism-chat-export' || parsed.version !== 1 || !Array.isArray(parsed.chats)) {
    throw new Error('This file is not a supported Prism conversation archive.');
  }
  if (parsed.chats.length > 10000) throw new Error('The archive contains too many conversations.');

  const chats = parsed.chats.map((chat) => {
    if (!chat || typeof chat.id !== 'string' || chat.id.length > 180 || !Array.isArray(chat.messages)) {
      throw new Error('The archive contains an invalid conversation.');
    }
    const messages = chat.messages.map((message) => {
      if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
        throw new Error('The archive contains an invalid message.');
      }
      if (message.content.length > 2_000_000) throw new Error('A message in the archive is too large.');
      return {
        role: message.role,
        content: message.content,
        createdAt: typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString()
      };
    });
    return {
      id: chat.id,
      title: typeof chat.title === 'string' ? chat.title.slice(0, 180) : 'Imported conversation',
      createdAt: typeof chat.createdAt === 'string' ? chat.createdAt : new Date().toISOString(),
      updatedAt: typeof chat.updatedAt === 'string' ? chat.updatedAt : new Date().toISOString(),
      messages
    };
  });
  return { format: 'prism-chat-export', version: 1, chats };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 780,
    minHeight: 580,
    backgroundColor: '#111318',
    title: 'Prism AI',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      webSecurity: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.loadURL('app://prism/renderer/index.html');
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('ollama:list-models', async () => {
  try {
    const models = await listModels();
    const names = models.map((model) => model.name || model.model).filter(Boolean);
    const machine = profileForMachine();
    return {
      connected: true,
      models,
      machine,
      recommendedModel: recommendationFor(machine.profile, names),
      presets: PRESETS
    };
  } catch (error) {
    const machine = profileForMachine();
    return {
      connected: false,
      models: [],
      machine,
      recommendedModel: recommendationFor(machine.profile, []),
      presets: PRESETS,
      error: error.message
    };
  }
});

ipcMain.handle('ollama:generate', async (event, request) => {
  const { requestId, model, prompt } = request || {};
  if (typeof requestId !== 'string' || requestId.length > 100 || !validModelName(model) || typeof prompt !== 'string' || prompt.length > 4_000_000) {
    return { ok: false, error: 'The request is invalid.' };
  }
  const controller = new AbortController();
  generationControllers.set(requestId, { controller, sender: event.sender });
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, system: SYSTEM_PROMPT, stream: true }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(await readResponseError(response));
    for await (const part of readJsonLines(response)) {
      if (part.error) throw new Error(part.error);
      if (typeof part.response === 'string' && !event.sender.isDestroyed()) {
        event.sender.send('ollama:generation-chunk', { requestId, text: part.response });
      }
    }
    return { ok: true };
  } catch (error) {
    if (error.name === 'AbortError') return { ok: false, cancelled: true };
    return { ok: false, error: error.message || 'Ollama could not generate a response.' };
  } finally {
    generationControllers.delete(requestId);
  }
});

ipcMain.handle('ollama:cancel-generation', (_event, requestId) => {
  if (typeof requestId !== 'string') return false;
  const task = generationControllers.get(requestId);
  if (!task) return false;
  task.controller.abort();
  return true;
});

async function pumpPullQueue() {
  if (activePull || pullQueue.length === 0 || isQuitting) return;
  const job = pullQueue.shift();
  const task = { model: job.model, controller: new AbortController(), layers: {}, status: 'preparing' };
  activePull = task;
  sendPullState({ state: 'progress', model: task.model, status: task.status, layers: [], queue: pullQueue.map(({ model }) => model) });

  let finalState = 'done';
  let message;
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/pull`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: task.model, stream: true }),
      signal: task.controller.signal
    });
    if (!response.ok) throw new Error(await readResponseError(response));
    for await (const part of readJsonLines(response)) {
      if (part.error) throw new Error(part.error);
      task.status = typeof part.status === 'string' ? part.status : task.status;
      if (part.digest && Number.isFinite(part.total)) {
        task.layers[part.digest] = {
          total: Math.max(0, Number(part.total)),
          completed: Math.max(0, Number(part.completed) || 0)
        };
      }
      if (part.status === 'success') finalState = 'done';
      sendPullState({
        state: 'progress', model: task.model, status: task.status,
        layers: Object.values(task.layers), queue: pullQueue.map(({ model }) => model)
      });
    }
  } catch (error) {
    if (error.name === 'AbortError') finalState = 'cancelled';
    else { finalState = 'error'; message = error.message || 'Model download failed.'; }
  }

  activePull = null;
  sendPullState({ state: finalState, model: task.model, error: message, queue: pullQueue.map(({ model }) => model) });
  if (finalState === 'done' && mainWindow && !mainWindow.isDestroyed()) {
    try {
      const models = await listModels();
      safeSend(mainWindow, 'ollama:models-updated', models);
    } catch { /* The next refresh will report the connection state. */ }
  }
  void pumpPullQueue();
}

ipcMain.handle('ollama:enqueue-pull', async (_event, model) => {
  if (!validModelName(model) || !KNOWN_MODELS.some((item) => item.name === model)) {
    return { ok: false, error: 'This model is not in Prism’s local model list.' };
  }
  if (activePull?.model === model || pullQueue.some((job) => job.model === model)) return { ok: true, queued: true };
  try {
    const installed = await listModels();
    if (installed.some((item) => (item.name || item.model) === model)) {
      safeSend(mainWindow, 'ollama:models-updated', installed);
      return { ok: true, installed: true };
    }
  } catch (error) {
    return { ok: false, error: error.message || 'Ollama is unavailable.' };
  }
  pullQueue.push({ model });
  sendPullState({ state: activePull ? 'queued' : 'queued', model, queue: pullQueue.map(({ model: name }) => name), activeModel: activePull?.model || null });
  void pumpPullQueue();
  return { ok: true, queued: true };
});

ipcMain.handle('ollama:cancel-pull', (_event, model) => {
  if (typeof model !== 'string') return false;
  if (activePull?.model === model) {
    activePull.controller.abort();
    return true;
  }
  const before = pullQueue.length;
  pullQueue = pullQueue.filter((job) => job.model !== model);
  if (pullQueue.length !== before) {
    sendPullState({ state: 'cancelled', model, queue: pullQueue.map(({ model: name }) => name) });
    return true;
  }
  return false;
});

ipcMain.handle('history:export', async (_event, payload, language) => {
  let contents;
  try { contents = validateExportPayload(payload); }
  catch (error) { return { ok: false, error: error.message }; }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: language === 'en' ? 'Export Prism conversations' : 'Prism sohbetlerini dışa aktar',
    buttonLabel: language === 'en' ? 'Save' : 'Kaydet',
    defaultPath: language === 'en' ? 'prism-conversations.json' : 'prism-sohbetleri.json',
    filters: [{ name: 'Prism conversation archive', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, cancelled: true };
  try {
    const fs = require('node:fs/promises');
    await fs.writeFile(result.filePath, contents, 'utf8');
    return { ok: true };
  } catch (error) { return { ok: false, error: error.message }; }
});

ipcMain.handle('history:select-import', async (_event, language) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: language === 'en' ? 'Import Prism conversations' : 'Prism sohbetlerini içe aktar',
    properties: ['openFile'],
    filters: [{ name: 'Prism conversation archive', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, cancelled: true };
  try {
    const fs = require('node:fs/promises');
    const file = result.filePaths[0];
    const stat = await fs.stat(file);
    if (stat.size > 40 * 1024 * 1024) throw new Error('The conversation archive is too large to import.');
    const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
    return { ok: true, archive: normalizeImportedArchive(parsed) };
  } catch (error) { return { ok: false, error: error.message || 'Could not read this archive.' }; }
});

ipcMain.handle('app:copy-text', (_event, value) => {
  if (typeof value !== 'string' || value.length > 2_000_000) return false;
  clipboard.writeText(value);
  return true;
});

app.whenReady().then(async () => {
  const appRoot = path.resolve(__dirname, '..');
  await protocol.handle('app', (request) => {
    let requestedPath;
    try { requestedPath = decodeURIComponent(new URL(request.url).pathname); }
    catch { return new Response('Bad request', { status: 400 }); }
    const filePath = path.resolve(appRoot, `.${requestedPath}`);
    if (filePath !== appRoot && !filePath.startsWith(`${appRoot}${path.sep}`)) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('before-quit', () => {
  isQuitting = true;
  activePull?.controller.abort();
  for (const { controller } of generationControllers.values()) controller.abort();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
