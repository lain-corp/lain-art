import { getPrincipal } from "../../lib/auth";

export function initUpload() {
  const uploadInput = document.getElementById("upload-input");
  const statusEl = document.getElementById("upload-status");

  if (!(uploadInput instanceof HTMLInputElement)) {
    console.warn("[Upload] #upload-input not found or not an input");
    return;
  }

  // UI helpers (status element optional)
  function setStatus(message: string, cls?: "auth" | "unauth" | "ok" | "error") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("auth", "unauth", "ok", "error");
    if (cls) statusEl.classList.add(cls);
  }

  function enableUI(principal: string) {
    uploadInput.disabled = false;
    setStatus(`✅ Connected as ${principal}`, "auth");
    console.log("[Upload] Enabled for", principal);
  }

  function disableUI() {
    uploadInput.disabled = true;
    setStatus("❌ Please authenticate to enable uploads", "unauth");
    console.log("[Upload] Disabled");
  }

  // React to global auth events from Header/auth.ts
  document.addEventListener("userAuthenticated", (e: Event) => {
    const detail = (e as CustomEvent<{ principal: string }>).detail;
    enableUI(detail.principal);
  });

  document.addEventListener("userLoggedOut", () => {
    disableUI();
  });

  // Initial state on load
  getPrincipal().then((principal) => {
    if (principal) enableUI(principal);
    else disableUI();
  });

  // Upload handler
  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    const principal = await getPrincipal();

    if (!principal) {
      disableUI();
      setStatus("⚠️ Authenticate before uploading.", "error");
      return;
    }
    if (!file) {
      setStatus("No file selected.", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus("Only image files are supported.", "error");
      return;
    }
    // Optional size guard (e.g., 10 MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setStatus("File too large (max 10 MB).", "error");
      return;
    }

    try {
      setStatus("Uploading…", "ok");
      const bytes = new Uint8Array(await file.arrayBuffer());

      // TODO: replace with your actual canister call
      // await actor.uploadArtwork(bytes, file.name, file.type);

      // Placeholder: simulate success
      await new Promise((r) => setTimeout(r, 800));
      setStatus("✅ Upload complete!", "ok");
      uploadInput.value = "";
    } catch (err) {
      console.error("[Upload] Error:", err);
      setStatus("❌ Upload failed. Check console.", "error");
    }
  });
}
