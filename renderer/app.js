(() => {
  'use strict';

  const STORAGE_KEY = 'prism:desktop:v1';
  const MODEL_VALUE_RECOMMENDED = '__recommended__';
  const PRESETS = {
    low: ['qwen2.5-coder:1.5b'],
    medium: ['llama3.2:3b', 'deepseek-coder:1.5b'],
    high: ['qwen2.5-coder:7b', 'llama3.1:8b']
  };

  const words = {
    tr: {
      newChat: 'Yeni sohbet', history: 'Geçmiş', ollamaOffline: 'Ollama çevrimdışı', ollamaOnline: 'Ollama bağlı', settings: 'Ayarlar',
      model: 'Model', welcomeTitle: 'Bugün ne üzerinde çalışıyoruz?', welcomeBody: 'Kod, hata ayıklama veya mimari konusunda yardımcı olabilirim.',
      messagePlaceholder: "Prism'e bir mesaj yaz...", privacyNote: 'Yerel ve özel · Yanıtlar Ollama’da çalışır', cancel: 'İptal', preferences: 'TERCİHLER',
      language: 'Dil', backupTitle: 'Sohbet yedeği', backupDescription: 'Sohbet geçmişini Prism JSON dosyası olarak dışa aktar veya içe al.',
      exportHistory: 'Geçmişi dışa aktar', importHistory: 'Geçmişi içe aktar', offlineTag: 'Yerel modeller · Yerel sohbet', importPreviewTitle: 'Sohbetleri içe aktar?',
      mergeImport: 'Birleştir', send: 'Gönder', stop: 'Durdur', assistant: 'Prism', user: 'Sen', deleteChat: 'Sohbeti sil',
      confirmDelete: 'Bu sohbeti silmek istiyor musun?', modelPlaceholder: 'Model seç', recommended: 'Önerilen', installedModels: 'Kurulu modeller',
      downloadModels: 'İndirilebilir profiller', modelInstalled: 'Kurulu', modelDownload: 'İndirmek için seç', profileLow: 'Low', profileMedium: 'Medium', profileHigh: 'High',
      profileRecommendation: 'Cihazına göre önerilen profil', noModel: 'Önce bir model seç', noInstalledModels: 'Henüz kurulu model yok',
      ollamaError: "Ollama API'sine ulaşılamadı. Lütfen 'ollama serve' komutunu çalıştırın.",
      modelDownloadQueued: 'Model indirme sırasına eklendi.', modelDownloading: 'Model indiriliyor', modelPreparing: 'İndirme hazırlanıyor',
      modelVerifying: 'Model doğrulanıyor', modelWriting: 'Model kaydediliyor', modelReady: 'Model hazır', modelDownloadFailed: 'Model indirilemedi',
      downloadCalculating: 'Süre hesaplanıyor', queuedCount: (n) => n ? `Bekleyen ${n} model var` : '', bytesOf: (done, total) => `${formatBytes(done)} / ${formatBytes(total)}`,
      modelPullCancelled: 'Model indirme durduruldu. Yeniden seçerek devam edebilirsin.', generationFailed: 'Yanıt alınamadı', generationStopped: 'Yanıt durduruldu',
      chooseModel: 'Model seçmek için üstteki listeden bir model seç.', modelNeedsDownload: 'Bu model indirilirken sohbet için kurulu başka bir model seçebilirsin.',
      copy: 'Kopyala', copied: 'Kopyalandı ✓', copyFailed: 'Panoya kopyalanamadı', codeLanguage: 'Kod', chatTitle: 'Yeni sohbet',
      exportCancelled: 'Dışa aktarma iptal edildi.', exportSuccess: 'Sohbet geçmişi dışa aktarıldı.', importCancelled: 'İçe aktarma iptal edildi.',
      importNoNew: 'Yeni sohbet bulunamadı; aynı kimlikli sohbetler atlandı.', importPreview: (all, fresh, skipped) => `Dosyada ${all} sohbet var. ${fresh} yeni sohbet eklenecek; aynı kimlikli ${skipped} sohbet atlanacak. Mevcut sohbetlerin korunacak.`,
      importSuccess: (n) => `${n} sohbet içe aktarıldı.`, archiveInvalid: 'Sohbet dosyası okunamadı veya biçimi desteklenmiyor.',
      noHistoryToExport: 'Dışa aktarılacak sohbet yok.', onlineOnlyForDownload: 'Yeni model indirmek için internet bağlantısı gerekir.',
      importPreviewError: 'Sohbet dosyası geçersiz veya okunamadı.', noModels: 'Ollama’da kurulu model bulunamadı.', downloadEta: (value) => `Yaklaşık ${value} kaldı`,
      chatDeleted: 'Sohbet silindi.', genericError: 'Bir hata oluştu.', downloadQueueLabel: (n) => n ? `${n} sırada` : '',
      pullingLayer: 'Katman indiriliyor', downloadProgress: 'İndirme ilerlemesi', memoryProfile: (ram, cpus) => `${ram} GiB RAM · ${cpus} işlemci`,
      downloadPercent: (pct) => `${pct}%`, minutes: 'dk', seconds: 'sn', hours: 'sa',
      profileTitle: (profile) => `Cihaz önerisi: ${profile}`
    },
    en: {
      newChat: 'New chat', history: 'History', ollamaOffline: 'Ollama offline', ollamaOnline: 'Ollama connected', settings: 'Settings',
      model: 'Model', welcomeTitle: 'What are we working on today?', welcomeBody: 'I can help with code, debugging, or architecture.',
      messagePlaceholder: 'Message Prism...', privacyNote: 'Local and private · Responses run through Ollama', cancel: 'Cancel', preferences: 'PREFERENCES',
      language: 'Language', backupTitle: 'Conversation backup', backupDescription: 'Export or import your conversation history as a Prism JSON file.',
      exportHistory: 'Export history', importHistory: 'Import history', offlineTag: 'Local models · Local chat', importPreviewTitle: 'Import conversations?',
      mergeImport: 'Merge', send: 'Send', stop: 'Stop', assistant: 'Prism', user: 'You', deleteChat: 'Delete chat',
      confirmDelete: 'Delete this conversation?', modelPlaceholder: 'Choose a model', recommended: 'Recommended', installedModels: 'Installed models',
      downloadModels: 'Downloadable profiles', modelInstalled: 'Installed', modelDownload: 'Select to download', profileLow: 'Low', profileMedium: 'Medium', profileHigh: 'High',
      profileRecommendation: 'Profile recommended for this device', noModel: 'Choose a model first', noInstalledModels: 'No installed models yet',
      ollamaError: "Could not reach the Ollama API. Please run 'ollama serve'.",
      modelDownloadQueued: 'Model added to the download queue.', modelDownloading: 'Downloading model', modelPreparing: 'Preparing download',
      modelVerifying: 'Verifying model', modelWriting: 'Saving model', modelReady: 'Model is ready', modelDownloadFailed: 'Model download failed',
      downloadCalculating: 'Calculating time remaining', queuedCount: (n) => n ? `${n} more model(s) queued` : '', bytesOf: (done, total) => `${formatBytes(done)} / ${formatBytes(total)}`,
      modelPullCancelled: 'Model download stopped. Select it again to resume.', generationFailed: 'Could not get a response', generationStopped: 'Response stopped',
      chooseModel: 'Choose a model from the list above.', modelNeedsDownload: 'Choose an installed model to chat while this model downloads.',
      copy: 'Copy', copied: 'Copied ✓', copyFailed: 'Could not copy to clipboard', codeLanguage: 'CODE', chatTitle: 'New chat',
      exportCancelled: 'Export cancelled.', exportSuccess: 'Conversation history exported.', importCancelled: 'Import cancelled.',
      importNoNew: 'No new conversations found; conversations with matching IDs were skipped.', importPreview: (all, fresh, skipped) => `The file contains ${all} conversations. ${fresh} new conversation(s) will be added; ${skipped} with matching IDs will be skipped. Your current conversations will be kept.`,
      importSuccess: (n) => `${n} conversation(s) imported.`, archiveInvalid: 'Could not read the conversation file or its format is unsupported.',
      noHistoryToExport: 'There are no conversations to export.', onlineOnlyForDownload: 'An internet connection is required to download a new model.',
      importPreviewError: 'The conversation file is invalid or could not be read.', noModels: 'No installed models were found in Ollama.', downloadEta: (value) => `About ${value} left`,
      chatDeleted: 'Conversation deleted.', genericError: 'Something went wrong.', downloadQueueLabel: (n) => n ? `${n} queued` : '',
      pullingLayer: 'Downloading model layers', downloadProgress: 'Download progress', memoryProfile: (ram, cpus) => `${ram} GiB RAM · ${cpus} processors`,
      downloadPercent: (pct) => `${pct}%`, minutes: 'min', seconds: 'sec', hours: 'hr',
      profileTitle: (profile) => `Device recommendation: ${profile}`
    }
  };

  const defaultState = () => ({ version: 1, language: 'tr', chats: [], activeChatId: null, selectedModel: '' });
  const state = readState();
  const dom = Object.fromEntries([
    'new-chat', 'history-list', 'connection-state', 'connection-label', 'open-settings', 'model-select', 'profile-badge', 'profile-label',
    'download-panel', 'download-model', 'download-status', 'download-percent', 'download-eta', 'download-progress', 'download-queue', 'cancel-download',
    'conversation', 'welcome', 'messages', 'ollama-notice', 'composer', 'message-input', 'send-button', 'send-symbol', 'settings-dialog',
    'language-select', 'export-history', 'import-history', 'import-dialog', 'import-preview', 'cancel-import', 'confirm-import', 'toast'
  ].map((id) => [id.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()), document.getElementById(id)]));

  let models = [];
  let modelNames = [];
  let recommendation = '';
  let machine = null;
  let connected = false;
  let currentRequestId = null;
  let pendingArchive = null;
  let activePullModel = null;
  let activePullStatus = '';
  let activePullLayers = [];
  let queuedModels = [];
  let lastProgressSample = null;
  let speedSamples = [];
  let toastTimer;
  let renderFrame = 0;

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || saved.version !== 1 || !Array.isArray(saved.chats)) return defaultState();
      return {
        ...defaultState(), ...saved,
        language: saved.language === 'en' ? 'en' : 'tr',
        chats: saved.chats.filter((chat) => chat && typeof chat.id === 'string' && Array.isArray(chat.messages)).map((chat) => ({
          id: chat.id,
          title: typeof chat.title === 'string' ? chat.title.slice(0, 180) : 'New chat',
          createdAt: typeof chat.createdAt === 'string' ? chat.createdAt : new Date().toISOString(),
          updatedAt: typeof chat.updatedAt === 'string' ? chat.updatedAt : new Date().toISOString(),
          messages: chat.messages.filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string').map((message) => ({
            role: message.role, content: message.content, createdAt: typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString()
          }))
        }))
      };
    } catch { return defaultState(); }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { showToast(t('genericError'), true); }
  }

  function t(key, ...args) {
    const value = words[state.language]?.[key] ?? words.tr[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
  }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.title = 'Prism AI';
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    dom.languageSelect.value = state.language;
    dom.sendButton.setAttribute('aria-label', currentRequestId ? t('stop') : t('send'));
    dom.cancelDownload.setAttribute('aria-label', t('cancel'));
    document.querySelector('.dialog-heading .icon-button')?.setAttribute('aria-label', state.language === 'tr' ? 'Kapat' : 'Close');
    document.querySelector('.history-list')?.setAttribute('aria-label', t('history'));
    dom.messages.querySelectorAll('.message').forEach((element) => {
      const role = element.classList.contains('user') ? 'user' : 'assistant';
      const label = element.querySelector('.message-role');
      if (label) label.textContent = t(role);
    });
    renderHistory();
    renderModelSelect();
    renderDownloadPanel();
    updateConnection();
  }

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.toggle('error', isError);
    dom.toast.classList.add('visible');
    toastTimer = setTimeout(() => dom.toast.classList.remove('visible'), 3200);
  }

  function getActiveChat() {
    return state.chats.find((chat) => chat.id === state.activeChatId) || null;
  }

  function createChat() {
    const now = new Date().toISOString();
    const chat = { id: crypto.randomUUID(), title: t('chatTitle'), createdAt: now, updatedAt: now, messages: [] };
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    saveState();
    renderHistory();
    renderActiveChat();
  }

  function renderHistory() {
    dom.historyList.replaceChildren();
    state.chats.forEach((chat) => {
      const row = document.createElement('div');
      row.className = `history-item${chat.id === state.activeChatId ? ' active' : ''}`;
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'history-open';
      open.textContent = chat.title || t('chatTitle');
      open.title = chat.title || t('chatTitle');
      open.dataset.short = (chat.title || t('chatTitle')).trim().slice(0, 1).toUpperCase() || '•';
      open.addEventListener('click', () => {
        state.activeChatId = chat.id;
        saveState();
        renderHistory();
        renderActiveChat();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'history-delete';
      remove.textContent = '×';
      remove.title = t('deleteChat');
      remove.setAttribute('aria-label', `${t('deleteChat')}: ${chat.title}`);
      remove.addEventListener('click', () => deleteChat(chat.id));
      row.append(open, remove);
      dom.historyList.append(row);
    });
  }

  function deleteChat(chatId) {
    const chat = state.chats.find((entry) => entry.id === chatId);
    if (!chat || !window.confirm(t('confirmDelete'))) return;
    state.chats = state.chats.filter((entry) => entry.id !== chatId);
    if (state.activeChatId === chatId) state.activeChatId = state.chats[0]?.id || null;
    saveState();
    renderHistory();
    renderActiveChat();
    showToast(t('chatDeleted'));
  }

  function renderActiveChat() {
    const chat = getActiveChat();
    dom.messages.replaceChildren();
    const messages = chat?.messages || [];
    dom.welcome.hidden = messages.length > 0;
    dom.messages.hidden = messages.length === 0;
    messages.forEach((message) => dom.messages.append(renderMessage(message)));
    dom.conversation.scrollTop = dom.conversation.scrollHeight;
    updateComposerAvailability();
  }

  function renderMessage(message) {
    const article = document.createElement('article');
    article.className = `message ${message.role}`;
    const label = document.createElement('div');
    label.className = 'message-role';
    label.textContent = t(message.role);
    const body = document.createElement('div');
    body.className = 'message-body';
    if (message.role === 'assistant') renderMarkdown(body, message.content);
    else {
      body.textContent = message.content;
    }
    article.append(label, body);
    return article;
  }

  function renderMarkdown(target, markdown) {
    if (!window.marked || !window.DOMPurify) {
      target.textContent = markdown;
      return;
    }
    const html = window.marked.parse(markdown, { gfm: true, breaks: false });
    target.innerHTML = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    target.querySelectorAll('pre').forEach((pre) => {
      const code = pre.querySelector('code');
      if (!code) return;
      const languageMatch = (code.className || '').match(/language-([\w+-]+)/i);
      const language = languageMatch?.[1] || t('codeLanguage');
      const shell = document.createElement('div');
      shell.className = 'code-block';
      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      const label = document.createElement('span');
      label.textContent = language.toUpperCase();
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.dataset.action = 'copy-code';
      copy.textContent = t('copy');
      toolbar.append(label, copy);
      pre.parentNode.insertBefore(shell, pre);
      shell.append(toolbar, pre);
      if (window.hljs) {
        try {
          if (languageMatch && window.hljs.getLanguage(languageMatch[1])) window.hljs.highlightElement(code);
          else window.hljs.highlightElement(code);
        } catch { /* Keep readable plain code if a grammar fails. */ }
      }
    });
  }

  function updateConnection() {
    dom.connectionState.classList.toggle('is-online', connected);
    dom.connectionState.classList.toggle('is-offline', !connected);
    dom.connectionLabel.textContent = connected ? t('ollamaOnline') : t('ollamaOffline');
    dom.ollamaNotice.hidden = connected;
    dom.ollamaNotice.textContent = t('ollamaError');
    updateComposerAvailability();
  }

  function profileLabel(profile) {
    return t(`profile${profile[0].toUpperCase()}${profile.slice(1)}`);
  }

  function updateProfileBadge() {
    if (!machine) return;
    const label = profileLabel(machine.profile);
    dom.profileLabel.textContent = `${t('recommended')}: ${label}`;
    dom.profileBadge.title = t('memoryProfile', Number(machine.ramGiB.toFixed(1)), machine.logicalCpus);
  }

  function installedName(model) { return model?.name || model?.model || ''; }

  function setModelData(result, initial = false) {
    connected = Boolean(result.connected);
    models = Array.isArray(result.models) ? result.models : [];
    modelNames = models.map(installedName).filter(Boolean);
    machine = result.machine || machine;
    recommendation = result.recommendedModel || (PRESETS[result.machine?.profile] || PRESETS.medium)[0];
    if (!state.selectedModel || (!modelNames.includes(state.selectedModel) && !Object.values(PRESETS).flat().includes(state.selectedModel))) {
      state.selectedModel = modelNames.includes(recommendation) ? recommendation : modelNames[0] || '';
    }
    saveState();
    updateConnection();
    updateProfileBadge();
    renderModelSelect();
    updateComposerAvailability();
    if (initial) renderActiveChat();
  }

  async function refreshModels() {
    const initial = !machine;
    try { setModelData(await window.prism.listModels(), initial); }
    catch { setModelData({ connected: false, models: [], machine }, initial); }
  }

  function renderModelSelect() {
    if (!dom.modelSelect) return;
    const current = state.selectedModel;
    const fragment = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = modelNames.length ? t('modelPlaceholder') : t('noInstalledModels');
    fragment.append(placeholder);

    const recommendedOption = document.createElement('option');
    recommendedOption.value = MODEL_VALUE_RECOMMENDED;
    recommendedOption.textContent = `✦ ${t('recommended')} · ${recommendation || '—'}${modelNames.includes(recommendation) ? '' : ` · ${t('modelDownload')}`}`;
    fragment.append(recommendedOption);

    if (modelNames.length) {
      const installedGroup = document.createElement('optgroup');
      installedGroup.label = t('installedModels');
      models.forEach((model) => {
        const name = installedName(model);
        if (!name) return;
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        installedGroup.append(option);
      });
      fragment.append(installedGroup);
    }

    const downloadGroup = document.createElement('optgroup');
    downloadGroup.label = t('downloadModels');
    Object.entries(PRESETS).forEach(([profile, names]) => names.forEach((name) => {
      if (modelNames.includes(name)) return;
      const option = document.createElement('option');
      option.value = name;
      option.textContent = `${name} · ${profileLabel(profile)} · ↓`;
      downloadGroup.append(option);
    }));
    if (downloadGroup.children.length) fragment.append(downloadGroup);

    dom.modelSelect.replaceChildren(fragment);
    dom.modelSelect.value = current === recommendation ? MODEL_VALUE_RECOMMENDED : current;
    if (!dom.modelSelect.value) dom.modelSelect.value = '';
  }

  async function chooseModel(value) {
    const name = value === MODEL_VALUE_RECOMMENDED ? recommendation : value;
    if (!name) return;
    state.selectedModel = name;
    saveState();
    renderModelSelect();
    updateComposerAvailability();
    if (modelNames.includes(name)) return;
    const result = await window.prism.enqueuePull(name);
    if (!result?.ok) {
      showToast(result?.error || t('onlineOnlyForDownload'), true);
      if (!connected) showToast(t('ollamaError'), true);
      return;
    }
    showToast(t('modelDownloadQueued'));
  }

  function updateComposerAvailability() {
    const selectedInstalled = modelNames.includes(state.selectedModel);
    const emptyMessage = !connected ? t('ollamaError') : (!state.selectedModel ? t('chooseModel') : (!selectedInstalled ? t('modelNeedsDownload') : ''));
    dom.ollamaNotice.hidden = connected && !emptyMessage;
    dom.ollamaNotice.textContent = emptyMessage;
    dom.sendButton.disabled = currentRequestId ? false : (!connected || !selectedInstalled || !dom.messageInput.value.trim());
    dom.sendButton.classList.toggle('is-stop', Boolean(currentRequestId));
    dom.sendSymbol.textContent = currentRequestId ? '■' : '↑';
    dom.sendButton.setAttribute('aria-label', currentRequestId ? t('stop') : t('send'));
  }

  function updateTitleFromFirstMessage(chat, text) {
    if (chat.messages.length !== 1) return;
    const title = text.replace(/\s+/g, ' ').trim();
    chat.title = title.length > 42 ? `${title.slice(0, 42).trim()}…` : (title || t('chatTitle'));
  }

  function formatPrompt(messages) {
    return messages.map((message) => `${message.role === 'user' ? 'User' : 'Prism'}: ${message.content}`).join('\n\n') + '\n\nPrism:';
  }

  async function sendMessage(text) {
    if (!text.trim() || !connected || !modelNames.includes(state.selectedModel)) return;
    let chat = getActiveChat();
    if (!chat) {
      createChat();
      chat = getActiveChat();
    }
    if (!chat) return;
    const userMessage = { role: 'user', content: text.trim(), createdAt: new Date().toISOString() };
    chat.messages.push(userMessage);
    updateTitleFromFirstMessage(chat, userMessage.content);
    chat.updatedAt = new Date().toISOString();
    const assistantMessage = { role: 'assistant', content: '', createdAt: new Date().toISOString() };
    chat.messages.push(assistantMessage);
    saveState();
    renderHistory();
    renderActiveChat();
    const assistantArticle = dom.messages.lastElementChild;
    const body = assistantArticle?.querySelector('.message-body');
    body?.classList.add('streaming-cursor');
    dom.messageInput.value = '';
    resizeInput();

    const requestId = crypto.randomUUID();
    currentRequestId = requestId;
    updateComposerAvailability();
    const prompt = formatPrompt(chat.messages.slice(0, -1));
    let saveTimer = 0;
    try {
      const result = await window.prism.generate({ requestId, model: state.selectedModel, prompt }, (chunk) => {
        if (!getActiveChat() || getActiveChat().id !== chat.id) return;
        assistantMessage.content += chunk;
        if (body) body.textContent = assistantMessage.content;
        body?.classList.add('streaming-cursor');
        if (!saveTimer) {
          saveTimer = window.setTimeout(() => { saveTimer = 0; saveState(); }, 450);
        }
        scheduleAutoScroll();
      });
      if (result?.error) {
        if (!assistantMessage.content) chat.messages.pop();
        showToast(`${t('generationFailed')}: ${result.error}`, true);
      } else if (result?.cancelled) {
        if (!assistantMessage.content) chat.messages.pop();
        else showToast(t('generationStopped'));
      }
    } catch (error) {
      if (!assistantMessage.content) chat.messages.pop();
      showToast(`${t('generationFailed')}: ${error.message || t('genericError')}`, true);
    } finally {
      clearTimeout(saveTimer);
      currentRequestId = null;
      chat.updatedAt = new Date().toISOString();
      saveState();
      if (getActiveChat()?.id === chat.id) renderActiveChat();
      updateComposerAvailability();
    }
  }

  async function stopGeneration() {
    if (!currentRequestId) return;
    const requestId = currentRequestId;
    await window.prism.cancelGeneration(requestId);
  }

  function resizeInput() {
    dom.messageInput.style.height = 'auto';
    dom.messageInput.style.height = `${Math.min(dom.messageInput.scrollHeight, 180)}px`;
  }

  function scheduleAutoScroll() {
    if (renderFrame) return;
    renderFrame = requestAnimationFrame(() => {
      renderFrame = 0;
      dom.conversation.scrollTop = dom.conversation.scrollHeight;
    });
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} ${t('hours')}`;
    if (seconds >= 60) return `${Math.ceil(seconds / 60)} ${t('minutes')}`;
    return `${Math.max(1, Math.ceil(seconds))} ${t('seconds')}`;
  }

  function updateDownloadRate(layers) {
    const completed = layers.reduce((sum, layer) => sum + (Number(layer.completed) || 0), 0);
    const total = layers.reduce((sum, layer) => sum + (Number(layer.total) || 0), 0);
    const now = Date.now();
    if (lastProgressSample && completed > lastProgressSample.completed && now > lastProgressSample.time) {
      const rate = (completed - lastProgressSample.completed) / ((now - lastProgressSample.time) / 1000);
      if (Number.isFinite(rate) && rate > 0) {
        speedSamples.push(rate);
        if (speedSamples.length > 5) speedSamples.shift();
      }
    }
    lastProgressSample = { completed, total, time: now };
    return { completed, total, speed: speedSamples.length ? speedSamples.reduce((sum, value) => sum + value, 0) / speedSamples.length : 0 };
  }

  function onPullState(event) {
    if (event.state === 'queued') {
      queuedModels = event.queue || [];
      if (!activePullModel && queuedModels.length) {
        activePullModel = queuedModels[0];
        activePullStatus = 'queued';
        activePullLayers = [];
      }
    } else if (event.state === 'progress') {
      activePullModel = event.model;
      activePullStatus = event.status || 'pulling';
      activePullLayers = event.layers || [];
      queuedModels = event.queue || [];
      updateDownloadRate(activePullLayers);
    } else {
      const endedModel = event.model;
      if (event.state === 'error') showToast(`${t('modelDownloadFailed')}: ${event.error || t('genericError')}`, true);
      if (event.state === 'done') showToast(`${event.model}: ${t('modelReady')}`);
      if (event.state === 'cancelled') showToast(t('modelPullCancelled'));
      queuedModels = event.queue || queuedModels.filter((name) => name !== endedModel);
      if (activePullModel === endedModel || !activePullModel) {
        activePullModel = null;
        activePullStatus = '';
        activePullLayers = [];
        lastProgressSample = null;
        speedSamples = [];
      }
      if (!activePullModel && queuedModels.length) {
        activePullModel = queuedModels[0];
        activePullStatus = 'queued';
      }
      if (event.state === 'done') refreshModels();
    }
    renderDownloadPanel();
  }

  function pullStatusText(status) {
    if (status === 'queued') return t('modelPreparing');
    if (status.includes('verif')) return t('modelVerifying');
    if (status.includes('writing') || status.includes('removing')) return t('modelWriting');
    if (status.includes('pulling')) return t('modelDownloading');
    return t('modelPreparing');
  }

  function renderDownloadPanel() {
    const visibleModel = activePullModel || queuedModels[0] || '';
    const visible = Boolean(visibleModel);
    dom.downloadPanel.hidden = !visible;
    if (!visible) return;
    dom.downloadModel.textContent = visibleModel;
    dom.downloadStatus.textContent = pullStatusText(activePullStatus || 'queued');
    const { completed, total, speed } = updateDownloadRate(activePullLayers);
    const percent = total > 0 ? Math.max(0, Math.min(100, Math.floor(completed / total * 100))) : null;
    dom.downloadProgress.classList.toggle('indeterminate', percent === null);
    dom.downloadProgress.style.width = percent === null ? '' : `${percent}%`;
    dom.downloadPercent.textContent = percent === null ? '—' : t('downloadPercent', percent);
    dom.downloadEta.textContent = speed > 0 && total > completed ? t('downloadEta', formatDuration((total - completed) / speed)) : t('downloadCalculating');
    dom.downloadPanel.querySelector('.progress-track').setAttribute('aria-label', t('downloadProgress'));
    if (percent !== null) dom.downloadPanel.querySelector('.progress-track').setAttribute('aria-valuenow', String(percent));
    else dom.downloadPanel.querySelector('.progress-track').removeAttribute('aria-valuenow');
    const waitingModels = Math.max(0, queuedModels.length - (activePullStatus === 'queued' ? 1 : 0));
    dom.downloadQueue.textContent = waitingModels ? t('queuedCount', waitingModels) : '';
    dom.cancelDownload.disabled = !visibleModel;
  }

  async function cancelDownload() {
    const model = activePullModel || queuedModels[0];
    if (model) await window.prism.cancelPull(model);
  }

  function archivePayload() {
    return { format: 'prism-chat-export', version: 1, exportedAt: new Date().toISOString(), chats: state.chats };
  }

  async function exportHistory() {
    if (!state.chats.length) { showToast(t('noHistoryToExport')); return; }
    const result = await window.prism.exportHistory(archivePayload(), state.language);
    if (result?.ok) showToast(t('exportSuccess'));
    else if (result?.cancelled) showToast(t('exportCancelled'));
    else showToast(result?.error || t('genericError'), true);
  }

  async function selectImport() {
    dom.settingsDialog.close();
    const result = await window.prism.selectHistoryImport(state.language);
    if (result?.cancelled) { showToast(t('importCancelled')); return; }
    if (!result?.ok) { showToast(result?.error || t('importPreviewError'), true); return; }
    pendingArchive = result.archive;
    const existingIds = new Set(state.chats.map((chat) => chat.id));
    const incomingIds = new Set();
    let newCount = 0;
    let skipped = 0;
    pendingArchive.chats.forEach((chat) => {
      if (existingIds.has(chat.id) || incomingIds.has(chat.id)) skipped += 1;
      else { incomingIds.add(chat.id); newCount += 1; }
    });
    dom.importPreview.textContent = t('importPreview', pendingArchive.chats.length, newCount, skipped);
    dom.importDialog.showModal();
  }

  function confirmImport() {
    if (!pendingArchive) return;
    const knownIds = new Set(state.chats.map((chat) => chat.id));
    const additions = pendingArchive.chats.filter((chat) => {
      if (knownIds.has(chat.id)) return false;
      knownIds.add(chat.id);
      return true;
    });
    state.chats = [...additions, ...state.chats];
    if (!state.activeChatId && additions.length) state.activeChatId = additions[0].id;
    pendingArchive = null;
    dom.importDialog.close();
    saveState();
    renderHistory();
    renderActiveChat();
    if (additions.length) showToast(t('importSuccess', additions.length));
    else showToast(t('importNoNew'));
  }

  dom.newChat.addEventListener('click', createChat);
  dom.openSettings.addEventListener('click', () => dom.settingsDialog.showModal());
  dom.languageSelect.addEventListener('change', () => {
    state.language = dom.languageSelect.value === 'en' ? 'en' : 'tr';
    saveState();
    applyLanguage();
  });
  dom.modelSelect.addEventListener('change', () => { void chooseModel(dom.modelSelect.value); });
  dom.composer.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currentRequestId) { void stopGeneration(); return; }
    void sendMessage(dom.messageInput.value);
  });
  dom.messageInput.addEventListener('input', () => { resizeInput(); updateComposerAvailability(); });
  dom.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      dom.composer.requestSubmit();
    }
  });
  dom.cancelDownload.addEventListener('click', () => { void cancelDownload(); });
  dom.exportHistory.addEventListener('click', () => { void exportHistory(); });
  dom.importHistory.addEventListener('click', () => { void selectImport(); });
  dom.cancelImport.addEventListener('click', () => { pendingArchive = null; dom.importDialog.close(); });
  dom.confirmImport.addEventListener('click', confirmImport);
  dom.importDialog.addEventListener('close', () => { pendingArchive = null; });

  dom.messages.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="copy-code"]');
    if (!button) return;
    const code = button.closest('.code-block')?.querySelector('pre code')?.textContent || '';
    const ok = await window.prism.copyText(code);
    button.textContent = ok ? t('copied') : t('copyFailed');
    setTimeout(() => { if (button.isConnected) button.textContent = t('copy'); }, 1500);
  });

  window.prism.onPullState(onPullState);
  window.prism.onModelsUpdated((updated) => {
    models = Array.isArray(updated) ? updated : [];
    modelNames = models.map(installedName).filter(Boolean);
    connected = true;
    updateConnection();
    if (modelNames.includes(state.selectedModel)) saveState();
    renderModelSelect();
    updateComposerAvailability();
  });

  if (state.activeChatId && !state.chats.some((chat) => chat.id === state.activeChatId)) state.activeChatId = null;
  if (!state.activeChatId && state.chats.length) state.activeChatId = state.chats[0].id;
  applyLanguage();
  renderHistory();
  renderActiveChat();
  resizeInput();
  refreshModels();
  window.setInterval(refreshModels, 12000);
})();
