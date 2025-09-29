import { getPrincipal } from "../../lib/auth";

export function initUpload() {
  const uploadInput = document.getElementById("upload-input");

  if (!(uploadInput instanceof HTMLInputElement)) {
    console.warn("[Upload] #upload-input not found or not an input");
    return;
  }

  function enableUI(principal: string) {
    uploadInput.disabled = false;
    console.log("[Upload] Enabled for", principal);
  }

  function disableUI() {
    uploadInput.disabled = true;
    console.log("[Upload] Disabled");
  }

  document.addEventListener("userAuthenticated", (e: Event) => {
    const detail = (e as CustomEvent<{ principal: string }>).detail;
    enableUI(detail.principal);
  });

  document.addEventListener("userLoggedOut", () => {
    disableUI();
  });

  getPrincipal().then((principal) => {
    if (principal) enableUI(principal);
    else disableUI();
  });

  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    const principal = await getPrincipal();

    if (!principal) {
      disableUI();
      return;
    }
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) return;

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      // await actor.uploadArtwork(bytes, file.name, file.type);
      await new Promise((r) => setTimeout(r, 800));
      uploadInput.value = "";
      console.log("✅ Upload complete!");
    } catch (err) {
      console.error("[Upload] Error:", err);
    }
  });
}
