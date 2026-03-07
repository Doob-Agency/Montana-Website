export default function isWebView() {
  const ua = navigator.userAgent || "";

  // 1️⃣ Android WebView detection
  const isAndroid =
    navigator.userAgentData?.brands?.some((b) =>
      b.brand.toLowerCase().includes("webview"),
    ) ||
    (ua.includes("Android") &&
      (/; wv\)/.test(ua) || /Version\/[\d.]+/.test(ua)));

  // 2️⃣ iOS WebView detection
  const isIOS = /iP(hone|od|ad)/.test(ua);
  let isIOSWebView = false;

  if (isIOS) {
    // iOS WebViews usually:
    // - Have no "Safari" in userAgent for in-app browsers
    // - Disable standalone mode (window.navigator.standalone === undefined)
    isIOSWebView =
      !ua.includes("Safari") ||
      (typeof window.navigator.standalone === "boolean" &&
        !window.navigator.standalone);
  }

  return isAndroid || isIOSWebView;
}
