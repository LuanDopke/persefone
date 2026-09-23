const http = require('node:http');
const WebSocket = require('../../frontend/node_modules/ws');

const DEVTOOLS_HOST = '127.0.0.1';
const DEVTOOLS_PORT = 9223;
const APP_URL = 'http://127.0.0.1:5174/';
const WIDTHS = [360, 768, 1024, 1440];

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: DEVTOOLS_HOST, port: DEVTOOLS_PORT, path }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });

  let sequence = 0;
  const pending = new Map();
  socket.on('message', (rawMessage) => {
    const message = JSON.parse(rawMessage.toString());
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  return {
    call(method, params = {}) {
      const id = ++sequence;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() { socket.terminate(); },
  };
}

async function evaluate(client, expression) {
  const result = await client.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function main() {
  const targets = await getJson('/json');
  const target = targets.find((item) => item.type === 'page' && item.url.startsWith('http://127.0.0.1:5174'));
  if (!target) throw new Error(`Nenhuma página encontrada para ${APP_URL}`);

  const client = await connect(target.webSocketDebuggerUrl);
  const tokenPayload = Buffer.from(JSON.stringify({ exp: 9999999999, email: 'teste@example.com' })).toString('base64url');
  await evaluate(client, `localStorage.setItem('access_token', 'a.${tokenPayload}.c'); localStorage.setItem('access_email', 'teste@example.com')`);
  await client.call('Page.navigate', { url: APP_URL });
  await delay(700);

  const results = [];
  for (const width of WIDTHS) {
    await client.call('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(250);
    results.push(await evaluate(client, `(() => {
      const visible = (element) => Boolean(element) && element.getClientRects().length > 0;
      const main = document.querySelector('main');
      const mobileNav = document.querySelector('nav[aria-label="Navegação móvel"]');
      const sidebar = document.querySelector('[data-testid="sidebar"]');
      const activeLinks = [...document.querySelectorAll('a[aria-current="page"]')]
        .filter(visible)
        .map((link) => link.textContent.trim());
      const touchTargets = mobileNav && visible(mobileNav)
        ? [...mobileNav.querySelectorAll('a')].map((link) => {
            const rect = link.getBoundingClientRect();
            return { label: link.textContent.trim(), width: rect.width, height: rect.height };
          })
        : [];
      return {
        width: ${width},
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mainCount: document.querySelectorAll('main').length,
        sidebarVisible: visible(sidebar),
        mobileNavVisible: visible(mobileNav),
        activeLinks,
        touchTargets,
        mainBottomPadding: main ? getComputedStyle(main).paddingBottom : null,
        bodyTextStartsWith: document.body.innerText.trim().slice(0, 80),
      };
    })()`));
  }

  await client.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  const reducedMotion = await evaluate(client, `(() => {
    const milliseconds = (value) => value.split(',').map((part) => {
      const normalized = part.trim();
      return normalized.endsWith('ms') ? parseFloat(normalized) : parseFloat(normalized) * 1000;
    });
    const styles = [...document.querySelectorAll('*')].map((element) => getComputedStyle(element));
    return {
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      maximumAnimationMilliseconds: Math.max(0, ...styles.flatMap((style) => milliseconds(style.animationDuration))),
      maximumTransitionMilliseconds: Math.max(0, ...styles.flatMap((style) => milliseconds(style.transitionDuration))),
      maximumAnimationIterations: Math.max(0, ...styles.map((style) => parseFloat(style.animationIterationCount) || 0)),
    };
  })()`);

  await evaluate(client, `document.body.tabIndex = -1; document.body.focus(); document.body.removeAttribute('tabindex')`);
  await client.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await client.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  const keyboardFocus = await evaluate(client, `(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      tagName: element.tagName,
      label: element.textContent.trim(),
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
    };
  })()`);

  client.close();
  process.stdout.write(`${JSON.stringify({ results, reducedMotion, keyboardFocus }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
