import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "./lain_art_backend.did.js";
export { idlFactory } from "./lain_art_backend.did.js";

// 🔧 Hard‑code your deployed backend canister ID as a string
export const canisterId = "l7gmx-5aaaa-aaaab-qca2a-cai";

export const createActor = (id, options = {}) => {
  // Always talk to the IC boundary node
  const agent = options.agent || new HttpAgent({
    host: "https://ic0.app",
    ...options.agentOptions,
  });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: String(id), // ✅ force string, not Principal
    ...options.actorOptions,
  });
};

// ✅ Always export a defined actor
export const lain_art_backend = createActor(canisterId);

// 👇 Expose globally for debugging
if (typeof window !== "undefined") {
  window.lain_art_backend = lain_art_backend;
  console.log("[Debug] Actor attached to window:", Object.keys(lain_art_backend));
}

// 👇 Log to confirm this module was picked up
console.log(
  "[Debug] declarations/lain_art_backend/index.js loaded, canisterId =",
  String(canisterId)
);
