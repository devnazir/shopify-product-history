# Shopify Product History

Shows a Shopify product's event history — status changes, publish/unpublish
per sales channel, and who or what app did it — as a floating table on the
product's admin page. This isn't shown anywhere in Shopify's normal product
UI.

No API token needed — it uses the documented
[`.json` admin URL pattern](https://help.shopify.com/en/manual/shopify-admin/using-json)
(`/store/<shop>/products/<id>/events.json`), authenticated by your existing
logged-in browser session rather than an API token.

> Events aren't logged in real time — Shopify notes they can take a few
> minutes to show up in the JSON. And unlike the versioned Admin API, this
> URL pattern has no stability/versioning guarantees, so treat it as good for
> ad-hoc debugging rather than something to build critical tooling on.

## Install as a bookmarklet

1. Open `chrome://bookmarks/`
2. Click the three-dot (⋮) menu
3. Click **Add new bookmark**
4. Name it something like "Product History"
5. For the URL, paste the entire contents of
   [`product-history.bookmarklet.txt`](product-history.bookmarklet.txt)
   (starts with `javascript:`)
6. Save

**To use:** open any product's detail page
(`https://admin.shopify.com/store/<shop>/products/<id>`) and click the
bookmark. A table appears bottom-right — click `–` to collapse it to a small
tab, click the tab to bring it back.

Once clicked, it keeps tracking navigation for the rest of that tab's
session — switching products, using back/forward, all auto-update the table
without clicking the bookmark again. A full page refresh resets it, though;
you'll need to click it once more after a reload.

## Install as a Tampermonkey userscript (auto-runs, survives refresh)

If you don't want to re-click after every refresh:

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open its dashboard → **Create a new script**
3. Delete the placeholder content and paste in
   [`product-history.user.js`](product-history.user.js)
4. Save (Ctrl/Cmd+S)

It now runs automatically on every product page — including full refreshes —
with no clicking required at all.

## Files

- `product-history.bookmarklet.txt` — the bookmarklet (minified, ready to paste as a bookmark URL)
- `product-history.user.js` — the same logic as a Tampermonkey userscript
