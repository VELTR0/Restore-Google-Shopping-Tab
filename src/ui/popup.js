const browserApi = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", async () => {
  const checkbox = document.getElementById("enabled");
  const status = document.getElementById("status");
  const stored = await browserApi.storage.local.get("enabled");
  checkbox.checked = stored.enabled !== false;

  function updateStatus() {
    status.textContent = checkbox.checked
      ? "Extension enabled"
      : "Extension disabled";
  }

  updateStatus();
  checkbox.addEventListener("change", async () => {
    const enabled = checkbox.checked;
    await browserApi.storage.local.set({ enabled });
    updateStatus();

    const tabs = await browserApi.tabs.query({});
    await Promise.all(
      tabs
        .filter((tab) => tab.id !== undefined)
        .map((tab) =>
          browserApi.tabs
            .sendMessage(tab.id, { action: "setEnabled", enabled })
            .catch(() => undefined),
        ),
    );
  });
});
