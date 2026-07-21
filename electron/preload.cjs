// Electron preload script (CommonJS). Runs in an isolated context with access
// to Node, and exposes a minimal, safe API to the renderer via contextBridge.
// Currently unused by the UI, but wired up for future IPC needs.

const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('conversionos', {
  appVersion: process.versions.electron,
  platform: process.platform,
})
