import { getPrincipal } from "../../lib/auth";
// Import the generated backend actor bindings
import { lain_art_backend } from "../declarations/lain_art_backend";

// --- Patch: expose actor globally in dev for debugging ---
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).lain_art_backend = lain_art_backend;
}

export function initUpload() {
  const uploadInput = document.getElementById("upload-input");

  // --- Checker: verify actor import ---
  if (!lain_art_backend) {
    console.error("[Upload] ❌ Backend actor is undefined. Check your import path or dfx generate.");
  } else {
    console.log("[Upload] ✅ Backend actor loaded:", Object.keys(lain_art_backend));
  }

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
    if (file.size > maxBytes) {
      console.warn("[Upload] File too large");
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());

      // --- Checker: verify method exists ---
      if (typeof lain_art_backend.start_submission !== "function") {
        throw new Error("Backend actor has no start_submission method");
      }

      // 1. Start submission
      const submissionId = await lain_art_backend.start_submission();
      console.log("[Upload] Started submission", submissionId.toString());

      // 2. Upload in 1MB chunks
      const chunkSize = 1024 * 1024;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        const index = i / chunkSize;
        await lain_art_backend.put_chunk(submissionId, index, chunk);
        console.log(`[Upload] Uploaded chunk ${index}`);
      }

      // 3. Compute SHA-256
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));

      // 4. Finalize asset
      await lain_art_backend.finalize_asset(
        submissionId,
        file.type,
        BigInt(file.size),
        hashArray
      );

      uploadInput.value = "";
      console.log("✅ Upload complete! Submission ID:", submissionId.toString());
    } catch (err) {
      console.error("[Upload] Error:", err);
    }
  });
}
