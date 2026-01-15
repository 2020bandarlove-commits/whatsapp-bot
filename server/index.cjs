'use strict';

/**
 * WhatsApp Bot Backend (Baileys) + Dashboard API
 *
 * Endpoints:
 * - POST /api/auth/login              { username, password } -> { token }
 * - GET  /api/status                  -> { status, lastUpdate, details }
 * - GET  /api/qr                      -> { qrPngBase64 }
 * - GET  /api/pairing                 -> { pairingCode }
 * - POST /api/session/reset           -> { ok: true }
 * - GET  /api/commands                -> [{ id, trigger, response }]
 * - POST /api/commands                { trigger, response } -> created
 * - PUT  /api/commands/:id            { trigger, response } -> updated
 * - DELETE /api/commands/:id          -> { ok: true }
 * - GET  /api/messages                -> [{ at, from, text, isFromMe }]
 * - POST /api/send                    { to, text } -> { ok: true }
 * - GET  /api/events                  (SSE)
 */

const fs = require('fs');
const path = require('path');

const express = require('express');
const pino = require('pino');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const PORT = Number(process.env.PORT || 3001);
const AUTH_DIR = process.env.AUTH_DIR || path.join(process.cwd(), 'auth');
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const PAIRING_NUMBER = process.env.PAIRING_NUMBER || ''; // digits only, optional

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function safeWriteJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function deleteDirContents(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const name of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, name);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

function pushBounded(arr, item, max = 200) {
  arr.unshift(item);
  if (arr.length > max) arr.length = max;
}

function normalizeLower(s) {
  return String(s || '').trim().toLowerCase();
}

function extractTextMessage(msg) {
  const m = msg?.message;
  if (!m) return '';

  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;

  const caption =
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption;

  return caption || '';
}

function toJidDigits(to) {
  const digits = String(to || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.includes('@s.whatsapp.net') ? digits : `${digits}@s.whatsapp.net`;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

ensureDir(DATA_DIR);
const COMMANDS_FILE = path.join(DATA_DIR, 'commands.json');

function loadCommands() {
  return safeReadJson(COMMANDS_FILE, []);
}

function saveCommands(commands) {
  safeWriteJson(COMMANDS_FILE, commands);
}

/** Runtime state for dashboard + SSE */
const runtime = {
  startedAt: nowIso(),
  connection: { status: 'starting', lastUpdate: nowIso(), details: null },
  pairingCode: null,
  qrPngBase64: null,
  lastMessages: [],
  lastEvents: [],
};

const sseClients = new Set();

function emitEvent(type, data) {
  const evt = { at: nowIso(), type, data };
  pushBounded(runtime.lastEvents, evt, 200);

  for (const res of sseClients) {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  }
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}

async function setQrFromString(qrString) {
  if (!qrString) {
    runtime.qrPngBase64 = null;
    emitEvent('qr', { qrPngBase64: null });
    return;
  }

  const dataUrl = await QRCode.toDataURL(qrString, { margin: 1, scale: 6 });
  const base64 = dataUrl.split(',')[1] || null;
  runtime.qrPngBase64 = base64;
  emitEvent('qr', { qrPngBase64: base64 });
}

let sock = null;
let botStarting = false;

async function startBot() {
  if (botStarting) return;
  botStarting = true;

  try {
    ensureDir(AUTH_DIR);

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: log,
      printQRInTerminal: !PAIRING_NUMBER,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, log),
      },
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        await setQrFromString(qr);
      }

      if (connection) {
        runtime.connection = { status: connection, lastUpdate: nowIso(), details: null };
        emitEvent('status', runtime.connection);
      }

      if (connection === 'open') {
        runtime.connection = { status: 'open', lastUpdate: nowIso(), details: null };
        emitEvent('status', runtime.connection);
        await setQrFromString(null);

        if (PAIRING_NUMBER) {
          try {
            const code = await sock.requestPairingCode(String(PAIRING_NUMBER));
            runtime.pairingCode = code;
            emitEvent('pairing', { pairingCode: code });
          } catch (e) {
            runtime.pairingCode = null;
            emitEvent('pairing', { pairingCode: null });
            log.warn({ err: e }, 'pairing code request failed');
          }
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        runtime.connection = {
          status: 'closed',
          lastUpdate: nowIso(),
          details: { statusCode, shouldReconnect },
        };
        emitEvent('status', runtime.connection);

        if (shouldReconnect) {
          setTimeout(() => {
            startBot().catch((e) => log.error({ err: e }, 'reconnect failed'));
          }, 1200);
        } else {
          runtime.pairingCode = null;
          emitEvent('pairing', { pairingCode: null });
        }
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        const from = msg?.key?.remoteJid;
        const isFromMe = Boolean(msg?.key?.fromMe);
        const text = extractTextMessage(msg);

        if (!from || !text) continue;

        const entry = { at: nowIso(), from, text, isFromMe };
        pushBounded(runtime.lastMessages, entry, 50);
        emitEvent('message', entry);

        if (isFromMe) continue;

        const normalized = normalizeLower(text);
        if (normalized === 'ping') {
          await sock.sendMessage(from, { text: 'pong ✅' });
          continue;
        }

        const commands = loadCommands();
        const matched = commands.find((c) => normalizeLower(c.trigger) === normalized);

        if (matched) {
          await sock.sendMessage(from, { text: matched.response });
        }
      }
    });

    emitEvent('log', { msg: 'Bot started' });
  } finally {
    botStarting = false;
  }
}

async function resetSessionAndRestart() {
  deleteDirContents(AUTH_DIR);
  runtime.pairingCode = null;
  runtime.qrPngBase64 = null;
  emitEvent('pairing', { pairingCode: null });
  emitEvent('qr', { qrPngBase64: null });

  try {
    sock?.end?.();
  } catch {
    // ignore
  } finally {
    sock = null;
  }

  await startBot();
}

/** HTTP Server */
const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, at: nowIso() }));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: signToken({ username }) });
  }
  return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
});

app.get('/api/events', authMiddleware, (req, res) => {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  res.write('\n');

  sseClients.add(res);

  res.write('event: snapshot\n');
  res.write(`data: ${JSON.stringify({ at: nowIso(), type: 'snapshot', data: runtime })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/status', authMiddleware, (_req, res) => {
  res.json(runtime.connection);
});

app.get('/api/qr', authMiddleware, (_req, res) => {
  res.json({ qrPngBase64: runtime.qrPngBase64 });
});

app.get('/api/pairing', authMiddleware, (_req, res) => {
  res.json({ pairingCode: runtime.pairingCode });
});

app.post('/api/session/reset', authMiddleware, async (_req, res) => {
  await resetSessionAndRestart();
  res.json({ ok: true });
});

app.get('/api/commands', authMiddleware, (_req, res) => {
  res.json(loadCommands());
});

app.post('/api/commands', authMiddleware, (req, res) => {
  const { trigger, response } = req.body || {};
  if (!String(trigger || '').trim() || !String(response || '').trim()) {
    return res.status(400).json({ error: 'BAD_REQUEST' });
  }

  const commands = loadCommands();
  const item = { id: newId(), trigger: String(trigger).trim(), response: String(response).trim() };
  commands.unshift(item);
  saveCommands(commands);
  emitEvent('commands', { action: 'create', item });
  return res.status(201).json(item);
});

app.put('/api/commands/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { trigger, response } = req.body || {};

  const commands = loadCommands();
  const idx = commands.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'NOT_FOUND' });

  if (!String(trigger || '').trim() || !String(response || '').trim()) {
    return res.status(400).json({ error: 'BAD_REQUEST' });
  }

  commands[idx] = { ...commands[idx], trigger: String(trigger).trim(), response: String(response).trim() };
  saveCommands(commands);
  emitEvent('commands', { action: 'update', item: commands[idx] });
  return res.json(commands[idx]);
});

app.delete('/api/commands/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  const commands = loadCommands();
  const next = commands.filter((c) => c.id !== id);
  if (next.length === commands.length) return res.status(404).json({ error: 'NOT_FOUND' });

  saveCommands(next);
  emitEvent('commands', { action: 'delete', id });
  return res.json({ ok: true });
});

app.get('/api/messages', authMiddleware, (_req, res) => {
  res.json(runtime.lastMessages);
});

app.post('/api/send', authMiddleware, async (req, res) => {
  const { to, text } = req.body || {};
  const jid = toJidDigits(to);

  if (!jid || !String(text || '').trim()) {
    return res.status(400).json({ error: 'BAD_REQUEST' });
  }
  if (!sock) return res.status(503).json({ error: 'BOT_NOT_READY' });

  await sock.sendMessage(jid, { text: String(text).trim() });
  emitEvent('log', { msg: `Sent message to ${jid}` });
  return res.json({ ok: true });
});

/** Serve built frontend in production if dist exists */
const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  log.info({ port: PORT }, 'Server listening');
  startBot().catch((e) => log.error({ err: e }, 'Bot start failed'));
});
