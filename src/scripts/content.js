(() => {
  const ITEM_ID = "restore-shopping-tab-item";
  const LINK_ID = "restore-shopping-tab-link";
  const LINK_SELECTOR = 'a[href], [role="link"][href]';
  const ACTIVE_SELECTOR =
    '[aria-current="page"], [aria-selected="true"], .hdtb-msel';
  const IMAGES_SELECTOR =
    'a[href*="tbm=isch"], a[href*="udm=2"], [role="link"][href*="tbm=isch"], [role="link"][href*="udm=2"]';

  let enabled = true;
  let scheduled = false;
  let observer = null;
  let navigationHandler = null;

  function isSearchPage() {
    return location.pathname === "/search" || location.pathname.startsWith("/search/");
  }

  function isShoppingPage() {
    const params = new URLSearchParams(location.search);
    return (
      params.get("tbm") === "shop" ||
      params.get("udm") === "28" ||
      location.pathname.startsWith("/shopping")
    );
  }

  function getQuery() {
    return new URLSearchParams(location.search).get("q");
  }

  function findNavigation() {
    return (
      document.querySelector("#hdtb-msb") ||
      document.querySelector('[role="navigation"] div[role="list"]') ||
      document.querySelector('[role="navigation"]')
    );
  }

  function findDirectChild(navigation, element) {
    let current = element;
    while (current && current.parentElement !== navigation) {
      current = current.parentElement;
    }
    return current && current.parentElement === navigation ? current : null;
  }

  function findImagesItem(navigation) {
    const imagesLink = navigation.querySelector(IMAGES_SELECTOR);
    if (imagesLink) {
      return findDirectChild(navigation, imagesLink);
    }

    const params = new URLSearchParams(location.search);
    if (params.get("tbm") === "isch" || params.get("udm") === "2") {
      const activeItem = navigation.querySelector(ACTIVE_SELECTOR);
      return activeItem ? findDirectChild(navigation, activeItem) : null;
    }

    return null;
  }

  function cleanTemplate(item) {
    item.removeAttribute("id");
    item.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    item.querySelectorAll(ACTIVE_SELECTOR).forEach((element) => {
      element.removeAttribute("aria-current");
      element.setAttribute("aria-selected", "false");
      element.classList.remove("hdtb-msel");
    });
    item.classList.remove("hdtb-msel");
  }

  function getShoppingUrl(query) {
    return `${location.origin}/search?tbm=shop&q=${encodeURIComponent(query)}`;
  }

  function createShoppingItem(template, query) {
    const item = template.cloneNode(true);
    cleanTemplate(item);
    item.id = ITEM_ID;

    const link = item.querySelector(LINK_SELECTOR);
    if (!link) return null;

    link.id = LINK_ID;
    link.href = getShoppingUrl(query);
    link.target = "_self";
    link.removeAttribute("rel");
    link.setAttribute("aria-label", "Shopping");

    const label =
      link.querySelector("span[aria-hidden], span") ||
      link.querySelector("div") ||
      link;
    label.textContent = "Shopping";
    return item;
  }

  function removeNativeShoppingItems(navigation) {
    navigation
      .querySelectorAll(
        'a[href*="tbm=shop"], a[href*="udm=28"], [role="link"][href*="tbm=shop"], [role="link"][href*="udm=28"]',
      )
      .forEach((link) => {
        if (link.id !== LINK_ID) {
          const item = link.closest('[role="listitem"], li, div') || link;
          if (item.id !== ITEM_ID) item.remove();
        }
      });
  }

  function updateShoppingButton() {
    if (!enabled) return;

    if (isShoppingPage()) {
      document.getElementById(ITEM_ID)?.remove();
      return;
    }

    if (!isSearchPage()) return;

    const query = getQuery();
    const navigation = findNavigation();
    if (!query || !navigation) return;

    removeNativeShoppingItems(navigation);
    const imagesItem = findImagesItem(navigation);
    if (!imagesItem) return;

    const existingItem = document.getElementById(ITEM_ID);
    const existingLink = document.getElementById(LINK_ID);
    const shoppingUrl = getShoppingUrl(query);

    if (existingItem && existingLink) {
      existingLink.href = shoppingUrl;
      if (imagesItem.nextSibling !== existingItem) {
        navigation.insertBefore(existingItem, imagesItem.nextSibling);
      }
      return;
    }

    let template = imagesItem;
    if (!template.querySelector(LINK_SELECTOR)) {
      template = Array.from(navigation.children).find((child) =>
        child.querySelector(LINK_SELECTOR),
      );
    }
    if (!template) return;

    const item = createShoppingItem(template, query);
    if (item) navigation.insertBefore(item, imagesItem.nextSibling);
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updateShoppingButton();
    });
  }

  function stopWatching() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (navigationHandler) {
      window.removeEventListener("popstate", navigationHandler);
      window.removeEventListener("hashchange", navigationHandler);
      navigationHandler = null;
    }
  }

  function startWatching() {
    if (observer) return;
    observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    navigationHandler = scheduleUpdate;
    window.addEventListener("popstate", navigationHandler);
    window.addEventListener("hashchange", navigationHandler);
  }

  function disable() {
    stopWatching();
    document.getElementById(ITEM_ID)?.remove();
  }

  async function initialize() {
    const result = await browser.storage.local.get("enabled");
    enabled = result.enabled !== false;
    if (!enabled) return;

    updateShoppingButton();
    startWatching();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleUpdate, { once: true });
    }
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.action !== "setEnabled") return;
    enabled = message.enabled;
    if (enabled) {
      updateShoppingButton();
      startWatching();
    } else {
      disable();
    }
  });

  initialize();
})();
