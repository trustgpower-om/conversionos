// Electron main process (CommonJS). Launches the Next.js dev server and
// opens a desktop window pointing at the Pages UI.
//
// NOTE: We intentionally run in DEV mode (`next dev`) because `next build`
// currently fails on the pre-existing /api/leads/submit route (missing env).
// See README "Run as a local desktop app (Electron)".

const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('node:child_process')
const path = require('node:path')
const http = require('node:http')
const waitOn = require('wait-on')

const PORT = 4321
const APP_URL = `http://localhost:${PORT}`
const DEEP_LINK = `${APP_URL}/pages`
const APP_ROOT = path.resolve(__dirname, '..')

/** @type {import('child_process').ChildProcess | null} */
let nextProcess = null
let mainWindow = null

// Detect whether a server is already listening on PORT so we don't spawn a
// duplicate `next dev` if the user already has one running.
function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(APP_URL, (res) => {
      res.resume()
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(false)
    })
  })
}

function startNextServer() {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  nextProcess = spawn(command, ['dev', '--port', String(PORT)], {
    cwd: APP_ROOT,
    stdio: 'inherit',
    env: process.env,
    // Start in its own process group (posix) so we can kill the whole tree
    // via a negative pid on exit.
    detached: process.platform !== 'win32',
  })

  nextProcess.on('error', (err) => {
    console.error('[electron] Failed to start Next dev server:', err)
  })

  nextProcess.on('exit', (code, signal) => {
    console.log(`[electron] Next dev server exited (code=${code}, signal=${signal})`)
    nextProcess = null
  })
}

function killNextServer() {
  if (!nextProcess || nextProcess.killed) {
    return
  }

  const pid = nextProcess.pid
  try {
    if (process.platform === 'win32') {
      // Kill the whole process tree on Windows.
      spawn('taskkill', ['/pid', String(pid), '/T', '/F'])
    } else {
      // Negative pid targets the process group started by the child.
      try {
        process.kill(-pid, 'SIGTERM')
      } catch {
        nextProcess.kill('SIGTERM')
      }
    }
  } catch (err) {
    console.error('[electron] Error killing Next dev server:', err)
  } finally {
    nextProcess = null
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Open external (non-localhost) links in the OS default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // Guard full-page navigations to external hosts too.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.loadURL(DEEP_LINK)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function bootstrap() {
  const alreadyRunning = await isServerRunning()
  if (!alreadyRunning) {
    startNextServer()
  } else {
    console.log('[electron] Detected existing server on', APP_URL)
  }

  try {
    await waitOn({
      resources: [APP_URL],
      timeout: 60_000,
      interval: 500,
      validateStatus: (status) => status >= 200 && status < 500,
    })
  } catch (err) {
    console.error('[electron] Next dev server did not become ready in time:', err)
    killNextServer()
    app.quit()
    return
  }

  createWindow()
}

app.whenReady().then(bootstrap)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// On this desktop app we do NOT keep running on macOS after the window closes;
// we tear down the Next dev server and quit fully.
app.on('window-all-closed', () => {
  killNextServer()
  app.quit()
})

app.on('before-quit', () => {
  killNextServer()
})

process.on('exit', killNextServer)
process.on('SIGINT', () => {
  killNextServer()
  process.exit(0)
})
process.on('SIGTERM', () => {
  killNextServer()
  process.exit(0)
})
