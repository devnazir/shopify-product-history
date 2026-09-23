// ==UserScript==
// @name         Shopify Product History Panel
// @namespace    shopify-product-history
// @version      1.2.0
// @description  Floating table of a Shopify product's event history (status changes, publish/unpublish per channel, who/what app did it) — auto-injects on every product page load, survives refreshes and in-admin navigation.
// @match        https://admin.shopify.com/store/*/products/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "__ph_collapsed";
  let lastPath = null;

  function removePanel() {
    document.getElementById("__product_history_panel")?.remove();
    document.getElementById("__product_history_tab")?.remove();
  }

  async function inject() {
    const m = location.pathname.match(/\/store\/([^/]+)\/products\/(\d+)/);
    if (!m) return;
    const [, shop, productId] = m;

    let res;
    try {
      res = await fetch(`/store/${shop}/products/${productId}/events.json?_=${Date.now()}`, { cache: "no-store" });
    } catch {
      return;
    }
    if (!res.ok) return;

    // bail if the user has already navigated elsewhere by the time this resolves
    if (location.pathname !== m.input) return;

    const { events } = await res.json();

    const strip = html => html.replace(/<[^>]+>/g, "");
    const fmt = iso => new Date(iso).toLocaleString();

    const rows = events.slice().reverse().map(e => `<tr><td style="white-space:nowrap;padding:4px 8px;border-bottom:1px solid #eee;">${fmt(e.created_at)}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:${/^shopify$/i.test(e.author) ? 400 : 600};">${e.author}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${e.verb}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${strip(e.message)}</td></tr>`).join("");

    removePanel();

    const tab = document.createElement("button");
    tab.id = "__product_history_tab";
    tab.textContent = `Product History (${events.length})`;
    tab.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:999999;background:#111;color:#fff;border:none;border-radius:6px;padding:8px 14px;font:12px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);";

    const panel = document.createElement("div");
    panel.id = "__product_history_panel";
    panel.style.cssText = "position:fixed;bottom:16px;right:16px;width:640px;max-height:70vh;overflow:auto;background:#fff;border:1px solid #ccc;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:999999;font:12px -apple-system,BlinkMacSystemFont,sans-serif;color:#111;";
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #ddd;background:#fafafa;position:sticky;top:0;"><strong>Product Event History (${events.length})</strong><button id="__ph_close" style="border:none;background:none;font-size:16px;cursor:pointer;line-height:1;">–</button></div><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f5f5f5;text-align:left;"><th style="padding:4px 8px;">When</th><th style="padding:4px 8px;">Who</th><th style="padding:4px 8px;">Action</th><th style="padding:4px 8px;">Detail</th></tr></thead><tbody>${rows}</tbody></table>`;

    const setCollapsed = (collapsed) => {
      panel.style.display = collapsed ? "none" : "block";
      tab.style.display = collapsed ? "block" : "none";
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    };

    tab.onclick = () => setCollapsed(false);

    document.body.appendChild(panel);
    document.body.appendChild(tab);
    panel.querySelector("#__ph_close").onclick = () => setCollapsed(true);

    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }

  function checkAndInject() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    removePanel();
    inject();
  }

  // admin.shopify.com is a single-page app: client-side navigation (Shopify's
  // router, and browser back/forward) doesn't trigger a fresh @match run, so
  // hook every way the URL can change instead of only polling for it.
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function (...args) { origPushState.apply(this, args); checkAndInject(); };
  history.replaceState = function (...args) { origReplaceState.apply(this, args); checkAndInject(); };
  window.addEventListener("popstate", checkAndInject);   // browser back/forward
  window.addEventListener("pageshow", checkAndInject);   // restored from bfcache

  checkAndInject();
  setInterval(checkAndInject, 1000); // fallback safety net
})();
