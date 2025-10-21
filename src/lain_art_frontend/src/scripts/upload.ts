import { getPrincipal } from "../../lib/auth";
// Import the generated backend actor bindings
import { lain_art_backend } from "../declarations/lain_art_backend";

// --- Patch: expose actor globally in dev for debugging ---
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).lain_art_backend = lain_art_backend;
}

export function initUpload() {
  const uploadInput = document.getElementById("upload-input");
  const paymentDiv = document.createElement("div");
  paymentDiv.id = "payment-step";
  paymentDiv.style.margin = "1.5em 0";
  paymentDiv.style.padding = "2em";
  paymentDiv.style.borderRadius = "18px";
  paymentDiv.style.border = "none";
  paymentDiv.style.background = "linear-gradient(135deg, #ff00cc 0%, #333399 100%)";
  paymentDiv.style.boxShadow = "0 4px 24px 0 rgba(255,0,204,0.25), 0 1.5px 8px 0 rgba(51,51,153,0.15)";
  paymentDiv.style.display = "none";
  paymentDiv.style.color = "#fff";
  paymentDiv.style.fontFamily = "'Orbitron', 'Montserrat', 'Arial', sans-serif";
  paymentDiv.style.textAlign = "center";
  uploadInput.parentElement?.appendChild(paymentDiv);

  let currentSubmissionId = null;

  function enableUI(principal) {
    uploadInput.disabled = true;
    paymentDiv.style.display = "block";
    paymentDiv.innerHTML = `
      <button id="enable-upload-btn" style="
        background: linear-gradient(90deg, #ff00cc 0%, #333399 100%);
        color: #fff;
        font-size: 1.3em;
        font-family: 'Orbitron', 'Montserrat', 'Arial', sans-serif;
        font-weight: bold;
        border: none;
        border-radius: 12px;
        padding: 0.8em 2em;
        box-shadow: 0 2px 12px 0 rgba(255,0,204,0.25), 0 1px 4px 0 rgba(51,51,153,0.15);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 1em;
      "
      onmouseover="this.style.transform='scale(1.07)';this.style.boxShadow='0 6px 32px 0 rgba(255,0,204,0.35), 0 2px 12px 0 rgba(51,51,153,0.25)';"
      onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 24px 0 rgba(255,0,204,0.25), 0 1.5px 8px 0 rgba(51,51,153,0.15)';"
      >
        <span style="letter-spacing: 2px;">⚡ ENABLE UPLOADS</span><br>
        <span style="font-size:0.9em;font-weight:normal;opacity:0.85;">Pay 0.1 ICP to unlock</span>
      </button>
      <div id="payment-info" style="margin-top:1em;font-size:1.1em;"></div>
    `;
    document.getElementById("enable-upload-btn")?.addEventListener("click", async () => {
      // Start submission
      try {
        currentSubmissionId = await lain_art_backend.start_submission();
        const invoice = await lain_art_backend.get_fee_invoice(currentSubmissionId);
  const canisterAddr = 'kfp4o-2qaaa-aaaab-qcmsa-cai';
        const paymentInfo = `
          <div style="margin:1em 0;padding:1em;border-radius:10px;background:rgba(0,0,0,0.25);box-shadow:0 1px 8px 0 rgba(255,0,204,0.10);">
            <span style="font-size:1.15em;">Send <b style='color:#ff00cc;'>0.1 ICP</b> to canister<br><b style='color:#fff;text-shadow:0 0 8px #ff00cc;'>${canisterAddr}</b></span><br>
            <span style="font-size:0.95em;opacity:0.8;">Memo: <b style='color:#fff;'>${invoice.memo ?? "none"}</b></span>
          </div>
          <button id="confirm-payment-btn" style="
            background: linear-gradient(90deg, #333399 0%, #ff00cc 100%);
            color: #fff;
            font-size: 1.1em;
            font-family: 'Orbitron', 'Montserrat', 'Arial', sans-serif;
            font-weight: bold;
            border: none;
            border-radius: 10px;
            padding: 0.7em 1.5em;
            box-shadow: 0 2px 12px 0 rgba(51,51,153,0.25), 0 1px 4px 0 rgba(255,0,204,0.15);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 0.5em;
          "
          onmouseover="this.style.transform='scale(1.07)';this.style.boxShadow='0 6px 32px 0 rgba(51,51,153,0.35), 0 2px 12px 0 rgba(255,0,204,0.25)';"
          onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 2px 12px 0 rgba(51,51,153,0.25), 0 1px 4px 0 rgba(255,0,204,0.15)';"
          >I've Paid</button>
        `;
        document.getElementById("payment-info").innerHTML = paymentInfo;
        document.getElementById("confirm-payment-btn").addEventListener("click", async () => {
          await lain_art_backend.confirm_fee(currentSubmissionId);
          // Check payment status
          const submission = await lain_art_backend.get_submission(currentSubmissionId);
          if (submission && submission.fee_paid) {
            paymentDiv.style.display = "none";
            uploadInput.disabled = false;
            alert("Payment confirmed! You can now upload your artwork.");
          } else {
            alert("Payment not detected yet. Please wait or retry.");
          }
        });
      } catch (err) {
        paymentDiv.innerHTML = `<span style="color:red">Error: ${err.message || err}</span>`;
      }
    });
  }

  function disableUI() {
    uploadInput.disabled = true;
    paymentDiv.style.display = "none";
  }

  document.addEventListener("userAuthenticated", (e) => {
    const detail = (e).detail;
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
    if (!currentSubmissionId) {
      alert("You must enable uploads and pay the fee first.");
      return;
    }
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
      // 2. Upload in 1MB chunks
      const chunkSize = 1024 * 1024;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        const index = i / chunkSize;
        await lain_art_backend.put_chunk(currentSubmissionId, index, chunk);
        console.log(`[Upload] Uploaded chunk ${index}`);
      }
      // 3. Compute SHA-256
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      // 4. Finalize asset
      await lain_art_backend.finalize_asset(
        currentSubmissionId,
        file.type,
        BigInt(file.size),
        hashArray
      );
      uploadInput.value = "";
      alert("✅ Upload complete! Submission ID: " + currentSubmissionId.toString());
    } catch (err) {
      console.error("[Upload] Error:", err);
    }
  });
}
