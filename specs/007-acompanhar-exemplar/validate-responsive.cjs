const http = require('node:http');
const WebSocket = require('../../frontend/node_modules/ws');

const WIDTHS = [360, 768, 1024, 1440];
const DEVTOOLS = { host: '127.0.0.1', port: 9223 };

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ ...DEVTOOLS, path }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

function connect(url) {
  const socket = new WebSocket(url);
  let sequence = 0;
  const pending = new Map();
  socket.on('message', (raw) => {
    const message = JSON.parse(raw.toString());
    if (!message.id || !pending.has(message.id)) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
  });
  return new Promise((resolve, reject) => {
    socket.once('open', () => resolve({
      call(method, params = {}) {
        const id = ++sequence;
        socket.send(JSON.stringify({ id, method, params }));
        return new Promise((ok, fail) => pending.set(id, { resolve: ok, reject: fail }));
      },
      close: () => socket.terminate(),
    }));
    socket.once('error', reject);
  });
}

async function evaluate(client, expression) {
  const result = await client.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function main() {
  const targets = await getJson('/json');
  const target = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  if (!target) throw new Error('Nenhuma página Chrome disponível em localhost:9223.');
  const client = await connect(target.webSocketDebuggerUrl);
  await client.call('Page.navigate', { url: 'http://127.0.0.1:5174/specimens/instances/demo' });
  await new Promise((resolve) => setTimeout(resolve, 700));
  const results = [];
  for (const width of WIDTHS) {
    await client.call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((resolve) => setTimeout(resolve, 200));
    results.push(await evaluate(client, `(() => {
      const visible = (node) => Boolean(node) && node.getClientRects().length > 0;
      const edit = document.querySelector('#specimen-edit');
      const timeline = [...document.querySelectorAll('h3')].map((node) => node.textContent.trim());
      return {
        width: ${width},
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        detailActionsVisible: visible(edit),
        timelinesPresent: timeline.includes('Histórico de crescimento e cuidados') && timeline.includes('Linha do tempo visual'),
        mobileNavVisible: visible(document.querySelector('nav[aria-label="Navegação móvel"]')),
      };
    })()`));
  }
  client.close();
  const failures = results.filter((result) => result.scrollWidth > result.viewport || !result.detailActionsVisible || !result.timelinesPresent);
  process.stdout.write(`${JSON.stringify({ results }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
