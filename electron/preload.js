const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.invoke('window:close'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  
  dragStart: (coords) => ipcRenderer.send('window:drag-start', coords),
  dragMove: (coords) => ipcRenderer.send('window:drag-move', coords),
  dragEnd: () => ipcRenderer.send('window:drag-end'),
  
  snapToCorner: (cornerName) => ipcRenderer.invoke('window:snap-to-corner', cornerName),
  
  getStartupSetting: () => ipcRenderer.invoke('settings:get-startup'),
  setStartupSetting: (enabled) => ipcRenderer.invoke('settings:set-startup', enabled),
  
  setExpanded: (expanded) => ipcRenderer.invoke('window:set-expanded', expanded),
  isExpanded: () => ipcRenderer.invoke('window:is-expanded'),
  
  loadPersistedData: () => ipcRenderer.invoke('data:load'),
  savePersistedData: (data) => ipcRenderer.invoke('data:save', data),
  
  isPackaged: () => ipcRenderer.invoke('app:is-packaged'),

  onSetMode: (callback) => {
    const handler = (event, mode) => callback(mode);
    ipcRenderer.on('app:set-mode', handler);
    return () => ipcRenderer.removeListener('app:set-mode', handler);
  },
  onSetExpanded: (callback) => {
    const handler = (event, expanded) => callback(expanded);
    ipcRenderer.on('app:set-expanded', handler);
    return () => ipcRenderer.removeListener('app:set-expanded', handler);
  }
});

