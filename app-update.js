(() => {
  "use strict";

  const DEFAULT_CHANNEL = "stable";
  const CONFIG = window.VIDA_LOCAL_CONFIG || {};
  const CURRENT_VERSION = CONFIG.currentVersion || "0.1.0";

  function normalizeVersion(version) {
    return String(version || "")
      .trim()
      .replace(/^v/i, "")
      .split(/[+-]/)[0]
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
  }

  function compareVersions(a, b) {
    const left = normalizeVersion(a);
    const right = normalizeVersion(b);
    const length = Math.max(left.length, right.length, 3);

    for (let index = 0; index < length; index += 1) {
      const diff = (left[index] || 0) - (right[index] || 0);
      if (diff !== 0) {
        return diff;
      }
    }

    return 0;
  }

  function withCacheBust(url) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${Date.now()}`;
  }

  function platformDownload(downloads = {}) {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("android")) {
      return downloads.androidApk || downloads.android || downloads.releasePage || "";
    }

    if (userAgent.includes("windows") || userAgent.includes("win64") || userAgent.includes("win32")) {
      return downloads.windowsInstaller || downloads.windows || downloads.desktop || downloads.releasePage || "";
    }

    return downloads.releasePage || downloads.desktop || "";
  }

  function isAndroidPlatform() {
    return navigator.userAgent.toLowerCase().includes("android");
  }

  function isCapacitorNativeRuntime() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.()) || window.Capacitor?.getPlatform?.() === "android";
    } catch {
      return false;
    }
  }

  function isWebBrowserRuntime() {
    return !window.JornadaDesktop && !isCapacitorNativeRuntime();
  }

  function isDesktopLauncherAvailable() {
    return Boolean(window.JornadaDesktop?.checkForUpdates && window.JornadaDesktop?.installUpdate);
  }

  function runtimeKey() {
    if (window.JornadaDesktop) {
      return "desktop";
    }
    if (isCapacitorNativeRuntime() || isAndroidPlatform()) {
      return "android";
    }
    return "web";
  }

  function runtimeLabel() {
    const labels = {
      desktop: "Desktop",
      android: "Android",
      web: "Web",
    };
    return labels[runtimeKey()] || "Web";
  }

  function getAndroidDownloadsPlugin() {
    return window.Capacitor?.Plugins?.JornadaDownloads || null;
  }

  function findAssetUrl(assets = [], matcher) {
    const asset = assets.find((item) => matcher.test(item.name || ""));
    return asset?.browser_download_url || "";
  }

  function downloadFileNameFromUrl(url, fallback = "Codice.apk") {
    try {
      const parsedUrl = new URL(url, window.location.href);
      const lastPathPart = parsedUrl.pathname.split("/").filter(Boolean).pop() || fallback;
      return decodeURIComponent(lastPathPart).replace(/[\\/:*?"<>|]+/g, "-") || fallback;
    } catch {
      return fallback;
    }
  }

  function setUpdateBannerMessage(banner, message) {
    const messageNode = banner?.querySelector("[data-update-message]");
    if (messageNode) {
      messageNode.textContent = message;
    }
  }

  function setUpdateButtonLabel(banner, label) {
    const button = banner?.querySelector("a.button.primary");
    if (button) {
      button.textContent = label;
    }
  }

  function applyDesktopUpdateStatus(status, banner) {
    if (!status || !banner) {
      return;
    }

    banner.dataset.desktopUpdateReady = status.canInstall ? "true" : "false";

    if (status.canInstall) {
      setUpdateButtonLabel(banner, "Reiniciar e instalar");
      setUpdateBannerMessage(banner, status.message || "Atualizacao baixada. Reinicie para instalar.");
      return;
    }

    if (status.state === "checking") {
      setUpdateButtonLabel(banner, "Verificando...");
      setUpdateBannerMessage(banner, status.message || "Procurando atualizacao desktop...");
      return;
    }

    if (status.state === "downloading") {
      setUpdateButtonLabel(banner, "Baixando pelo app...");
      setUpdateBannerMessage(banner, status.message || "Atualizacao encontrada. Baixando pelo app...");
      return;
    }

    if (status.state === "error") {
      setUpdateButtonLabel(banner, "Tentar novamente");
      setUpdateBannerMessage(banner, status.message || "Nao foi possivel atualizar pelo app.");
      return;
    }

    setUpdateButtonLabel(banner, "Atualizar pelo app");
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function openDesktopManualDownload(downloadUrl, banner, message = "") {
    if (!downloadUrl) {
      setUpdateButtonLabel(banner, "Abrir pagina");
      setUpdateBannerMessage(banner, message || "Nao foi possivel encontrar o instalador da atualizacao.");
      return;
    }

    setUpdateButtonLabel(banner, "Baixar instalador");
    setUpdateBannerMessage(banner, message || "Abrindo o instalador pelo GitHub.");
    const opened = window.open(downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = downloadUrl;
    }
  }

  async function waitForDesktopUpdateDecision(initialStatus, banner, timeoutMs = 9000) {
    const terminalStates = new Set(["downloaded", "error", "not-available", "timeout", "unavailable"]);
    const visibleProgressStates = new Set(["downloading", "installing"]);
    let status = initialStatus || {};
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (status.canInstall || terminalStates.has(status.state) || visibleProgressStates.has(status.state)) {
        return status;
      }

      await wait(750);

      try {
        status = (await window.JornadaDesktop.getUpdateStatus?.()) || status;
        applyDesktopUpdateStatus(status, banner);
      } catch (error) {
        return {
          state: "error",
          canInstall: false,
          message: `Nao foi possivel consultar o launcher: ${error.message}`,
        };
      }
    }

    return {
      ...status,
      state: "timeout",
      canInstall: false,
      message: "O atualizador interno nao respondeu em tempo util.",
    };
  }

  function fallbackApkName(update) {
    const version = String(update?.version || "update").trim().replace(/^v/i, "") || "update";
    return `Codice-${version}.apk`;
  }

  function openUpdateDownload(downloadUrl, update, banner) {
    if (!downloadUrl) {
      return;
    }

    if (isDesktopLauncherAvailable()) {
      openDesktopUpdate(downloadUrl, banner);
      return;
    }

    if (isAndroidPlatform()) {
      openAndroidUpdateDownload(downloadUrl, update, banner);
      return;
    }

    const opened = window.open(downloadUrl, isAndroidPlatform() ? "_system" : "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = downloadUrl;
    }
  }

  async function openAndroidUpdateDownload(downloadUrl, update, banner) {
    const fileName = downloadFileNameFromUrl(downloadUrl, fallbackApkName(update));
    const plugin = getAndroidDownloadsPlugin();

    if (plugin?.downloadApk) {
      try {
        setUpdateButtonLabel(banner, "Baixando...");
        setUpdateBannerMessage(banner, "Iniciando download do APK pelo app...");
        const result = await plugin.downloadApk({ url: downloadUrl, fileName });
        setUpdateButtonLabel(banner, "Baixar novamente");
        setUpdateBannerMessage(
          banner,
          result?.message || "Download iniciado. Abra a notificacao ou a pasta Downloads para instalar.",
        );
        return;
      } catch (error) {
        setUpdateButtonLabel(banner, "Abrir GitHub");
        setUpdateBannerMessage(banner, `Download pelo app falhou: ${error.message}. Abrindo GitHub.`);
      }
    }

    if (window.JornadaAndroidDownloads?.downloadApk) {
      const result = window.JornadaAndroidDownloads.downloadApk(downloadUrl, fileName);
      setUpdateBannerMessage(banner, result || "Download iniciado. Abra a notificacao ou a pasta Downloads para instalar.");
      return;
    }

    const opened = window.open(downloadUrl, "_system", "noopener,noreferrer");
    if (!opened) {
      window.location.href = downloadUrl;
    }
  }

  async function openDesktopUpdate(downloadUrl, banner) {
    try {
      if (banner?.dataset.desktopUpdateReady === "true") {
        setUpdateBannerMessage(banner, "Reiniciando para instalar a atualizacao...");
        await window.JornadaDesktop.installUpdate();
        return;
      }

      setUpdateButtonLabel(banner, "Verificando...");
      setUpdateBannerMessage(banner, "O launcher vai baixar e instalar a atualizacao dentro do app.");
      const status = await window.JornadaDesktop.checkForUpdates();
      applyDesktopUpdateStatus(status, banner);
      const decision = await waitForDesktopUpdateDecision(status, banner);
      applyDesktopUpdateStatus(decision, banner);

      if (decision?.canInstall || decision?.state === "downloading" || decision?.state === "installing") {
        return;
      }

      openDesktopManualDownload(
        downloadUrl,
        banner,
        decision?.message
          ? `${decision.message} Abrindo o instalador manual.`
          : "O atualizador interno nao concluiu. Abrindo o instalador manual.",
      );
    } catch (error) {
      openDesktopManualDownload(downloadUrl, banner, `Launcher indisponivel: ${error.message}. Abrindo download manual.`);
    }
  }

  function normalizeUpdatePayload(payload, channel) {
    if (payload?.tag_name && Array.isArray(payload.assets)) {
      return {
        version: payload.tag_name,
        notes: payload.body || payload.name || "",
        downloads: {
          releasePage: payload.html_url || CONFIG.releasePageUrl || "",
          windowsInstaller: findAssetUrl(payload.assets, /^(Jornada|Codice)Setup\.exe$/i),
          androidApk: findAssetUrl(payload.assets, /^(Jornada|Codice)-[\d.]+\.apk$/i) || findAssetUrl(payload.assets, /\.apk$/i),
        },
      };
    }

    return payload.channels?.[channel] || payload;
  }

  function parseVersionFromAppConfig(source) {
    const match = String(source || "").match(/currentVersion\s*:\s*["']([^"']+)["']/);
    return match?.[1] || "";
  }

  async function latestWebAppVersion() {
    if (!/^https?:$/i.test(window.location.protocol)) {
      return "";
    }

    const configUrl = new URL("app-config.js", window.location.href);
    const response = await fetch(withCacheBust(configUrl.toString()), { cache: "no-store" });
    if (!response.ok) {
      return "";
    }

    return parseVersionFromAppConfig(await response.text());
  }

  async function clearWebRuntimeCaches() {
    const tasks = [];

    if ("caches" in window) {
      tasks.push(
        caches.keys().then((keys) => Promise.all(
          keys
            .filter((key) => /^(jornada|codice)-/i.test(key))
            .map((key) => caches.delete(key)),
        )),
      );
    }

    if ("serviceWorker" in navigator) {
      tasks.push(
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))),
      );
    }

    await Promise.allSettled(tasks);
  }

  async function refreshWebRuntime(version) {
    const nextVersion = String(version || "").trim();
    if (!nextVersion) {
      return false;
    }

    const reloadKey = `jornada-web-auto-refresh:${CURRENT_VERSION}->${nextVersion}`;
    try {
      if (sessionStorage.getItem(reloadKey)) {
        return false;
      }
      sessionStorage.setItem(reloadKey, "1");
    } catch {
      // If session storage is blocked, still try a single normal refresh path.
    }

    await clearWebRuntimeCaches();
    window.setTimeout(() => {
      window.location.reload();
    }, 200);
    return true;
  }

  async function checkForWebRuntimeUpdate() {
    const version = await latestWebAppVersion();
    if (!version || compareVersions(version, CURRENT_VERSION) <= 0) {
      return { checked: true, updateAvailable: false, version: version || "" };
    }

    const refreshStarted = await refreshWebRuntime(version);
    return { checked: true, updateAvailable: true, version, webAutoRefresh: refreshStarted };
  }

  async function getLatestUpdateInfo(options = {}) {
    if (isWebBrowserRuntime()) {
      const version = await latestWebAppVersion();
      const latestVersion = version || CURRENT_VERSION;
      const updateAvailable = Boolean(version && compareVersions(version, CURRENT_VERSION) > 0);
      return {
        checked: true,
        currentVersion: CURRENT_VERSION,
        latestVersion,
        updateAvailable,
        runtime: runtimeKey(),
        runtimeLabel: runtimeLabel(),
        notes: updateAvailable
          ? "A versao web atualiza automaticamente ao recarregar."
          : "A versao web ja esta na versao mais recente carregada pelo navegador.",
        downloads: {},
        downloadUrl: "",
        releasePageUrl: CONFIG.releasePageUrl || "",
      };
    }

    const feedUrl = options.feedUrl || CONFIG.updateFeedUrl;
    if (!feedUrl) {
      return {
        checked: false,
        reason: "missing-feed-url",
        currentVersion: CURRENT_VERSION,
        latestVersion: "",
        updateAvailable: false,
        runtime: runtimeKey(),
        runtimeLabel: runtimeLabel(),
        notes: "Feed de atualizacao nao configurado.",
        downloads: {},
        downloadUrl: "",
        releasePageUrl: CONFIG.releasePageUrl || "",
      };
    }

    const response = await fetch(withCacheBust(feedUrl), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Update feed returned ${response.status}`);
    }

    const payload = await response.json();
    const channel = options.channel || DEFAULT_CHANNEL;
    const update = normalizeUpdatePayload(payload, channel);
    const latestVersion = update.version || "";
    return {
      checked: true,
      currentVersion: CURRENT_VERSION,
      latestVersion,
      updateAvailable: Boolean(latestVersion && compareVersions(latestVersion, CURRENT_VERSION) > 0),
      runtime: runtimeKey(),
      runtimeLabel: runtimeLabel(),
      notes: update.notes || "",
      downloads: update.downloads || {},
      downloadUrl: platformDownload(update.downloads || {}) || update.url || CONFIG.releasePageUrl || "",
      releasePageUrl: CONFIG.releasePageUrl || update.url || "",
      update,
    };
  }

  function renderUpdateBanner(update) {
    const existing = document.querySelector("[data-app-update-banner]");
    if (existing) {
      existing.jornadaUpdateCleanup?.();
      existing.remove();
    }

    const downloadUrl = platformDownload(update.downloads || {}) || update.url || CONFIG.releasePageUrl || "";
    const banner = document.createElement("section");
    banner.className = "app-update-banner";
    banner.dataset.appUpdateBanner = "true";
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <div>
        <strong>Nova versão disponível: ${escapeHtml(update.version)}</strong>
        <span>${escapeHtml(update.notes || "Baixe a atualização para receber as últimas melhorias.")}</span>
      </div>
      <div class="app-update-actions">
        ${
          downloadUrl
            ? `<a class="button primary" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noreferrer">Baixar</a>`
            : ""
        }
        <button class="button ghost" type="button" data-dismiss-update>Depois</button>
      </div>
    `;

    const updateMessage = banner.querySelector("span");
    if (updateMessage) {
      updateMessage.dataset.updateMessage = "true";
    }

    if (isDesktopLauncherAvailable()) {
      setUpdateButtonLabel(banner, "Atualizar pelo app");
      setUpdateBannerMessage(banner, "Clique para baixar e instalar a atualizacao pelo app.");
      window.JornadaDesktop.getUpdateStatus?.().then((status) => {
        applyDesktopUpdateStatus(status, banner);
      }).catch(() => {});

      const cleanup = window.JornadaDesktop.onUpdateStatus?.((status) => {
        applyDesktopUpdateStatus(status, banner);
      });
      if (typeof cleanup === "function") {
        banner.jornadaUpdateCleanup = cleanup;
      }
    }

    banner.querySelector("a.button.primary")?.addEventListener("click", (event) => {
      event.preventDefault();
      openUpdateDownload(downloadUrl, update, banner);
    });

    banner.querySelector("[data-dismiss-update]")?.addEventListener("click", () => {
      banner.jornadaUpdateCleanup?.();
      banner.remove();
    });

    const shell = document.querySelector(".app-shell");
    if (shell) {
      shell.prepend(banner);
    } else {
      document.body.prepend(banner);
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  async function checkForUpdates(options = {}) {
    if (isWebBrowserRuntime()) {
      return checkForWebRuntimeUpdate();
    }

    const feedUrl = options.feedUrl || CONFIG.updateFeedUrl;
    if (!feedUrl) {
      return { checked: false, reason: "missing-feed-url" };
    }

    const response = await fetch(withCacheBust(feedUrl), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Update feed returned ${response.status}`);
    }

    const payload = await response.json();
    const channel = options.channel || DEFAULT_CHANNEL;
    const update = normalizeUpdatePayload(payload, channel);

    if (!update.version || compareVersions(update.version, CURRENT_VERSION) <= 0) {
      return { checked: true, updateAvailable: false, version: update.version || "" };
    }

    renderUpdateBanner(update);
    return { checked: true, updateAvailable: true, version: update.version };
  }

  window.VidaLocalVersion = {
    current: CURRENT_VERSION,
    checkForUpdates,
    getLatestUpdateInfo,
    compareVersions,
    runtime: runtimeKey,
    runtimeLabel,
  };

  document.addEventListener("DOMContentLoaded", () => {
    checkForUpdates().catch((error) => {
      console.warn("Não foi possível verificar atualização.", error);
    });
  });
})();
