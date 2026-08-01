const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('eliteboxDesktop', {
  platform: process.platform,
  shell: 'electron'
});
