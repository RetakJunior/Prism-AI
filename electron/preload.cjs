const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('prism', {
  listModels: () => ipcRenderer.invoke('ollama:list-models'),
  enqueuePull: (model) => ipcRenderer.invoke('ollama:enqueue-pull', model),
  cancelPull: (model) => ipcRenderer.invoke('ollama:cancel-pull', model),
  cancelGeneration: (requestId) => ipcRenderer.invoke('ollama:cancel-generation', requestId),
  generate(request, onChunk) {
    const requestId = request.requestId || crypto.randomUUID();
    const listener = (_event, item) => {
      if (item?.requestId === requestId && typeof item.text === 'string') onChunk(item.text);
    };
    ipcRenderer.on('ollama:generation-chunk', listener);
    return ipcRenderer.invoke('ollama:generate', { ...request, requestId }).finally(() => {
      ipcRenderer.removeListener('ollama:generation-chunk', listener);
    });
  },
  exportHistory: (payload, language) => ipcRenderer.invoke('history:export', payload, language),
  selectHistoryImport: (language) => ipcRenderer.invoke('history:select-import', language),
  copyText: (value) => ipcRenderer.invoke('app:copy-text', value),
  onPullState(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('ollama:pull-state', listener);
    return () => ipcRenderer.removeListener('ollama:pull-state', listener);
  },
  onModelsUpdated(callback) {
    const listener = (_event, models) => callback(models);
    ipcRenderer.on('ollama:models-updated', listener);
    return () => ipcRenderer.removeListener('ollama:models-updated', listener);
  }
});
