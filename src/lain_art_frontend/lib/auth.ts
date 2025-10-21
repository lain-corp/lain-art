const PRINCIPAL_KEY = "icp_principal";

function hasPlug(): boolean {
  // Plug injects window.ic.plug
  // @ts-ignore
  return typeof window !== "undefined" && !!(window as any).ic && !!(window as any).ic.plug;
}

async function loginWithPlug(): Promise<string> {
  // @ts-ignore
  const plug = (window as any).ic.plug;
  try {
    // Always request connection first
    const connected = await plug.requestConnect({
      whitelist: ["l7gmx-5aaaa-aaaab-qca2a-cai"],
      host: window.location.origin,
    });
    if (!connected) throw new Error("Plug connection rejected");

    await plug.createAgent({
      whitelist: ["l7gmx-5aaaa-aaaab-qca2a-cai"],
      host: window.location.origin,
    });

    const principal = await plug.agent.getPrincipal();
    if (!principal) throw new Error("Plug did not return principal");
    const principalText = principal.toText();
    localStorage.setItem(PRINCIPAL_KEY, principalText);
    return principalText;
  } catch (err) {
    console.error("[Auth][Plug] login error:", err);
    throw err;
  }
}

async function logoutPlug(): Promise<void> {
  try {
    // @ts-ignore
    const plug = (window as any).ic.plug;
    if (plug && plug.agent && plug.agent.disconnect) await plug.agent.disconnect();
  } catch (e) {
    console.warn("[Auth][Plug] disconnect failed:", e);
  }
  localStorage.removeItem(PRINCIPAL_KEY);
}

export async function getPrincipal(): Promise<string | null> {
  // Only check localStorage, never call Plug APIs on page load
  return localStorage.getItem(PRINCIPAL_KEY);
}

export async function login(): Promise<string> {
  if (!hasPlug()) throw new Error("Plug not available in this environment");
  return loginWithPlug();
}

export async function logout(): Promise<void> {
  if (!hasPlug()) return localStorage.removeItem(PRINCIPAL_KEY);
  return logoutPlug();
}

export async function initAuth(buttonId: string) {
  const authBtn = document.getElementById(buttonId) as HTMLButtonElement | null;
  if (!authBtn) {
    console.warn(`[Auth] Button with id="${buttonId}" not found`);
    return;
  }

  async function updateUI() {
    if (!hasPlug()) {
      authBtn!.textContent = "Plug not found";
      document.dispatchEvent(new Event("userLoggedOut"));
      return;
    }
    // Use localStorage to determine authentication state
    const principalText = localStorage.getItem(PRINCIPAL_KEY);
    if (principalText) {
      authBtn!.textContent = "Logout";
      document.dispatchEvent(
        new CustomEvent("userAuthenticated", { detail: { principal: principalText } })
      );
      return;
    }
    authBtn!.textContent = "Authenticate";
    document.dispatchEvent(new Event("userLoggedOut"));
  }

  authBtn.addEventListener("click", async () => {
    if (!hasPlug()) return;
    try {
      // Use localStorage to check authentication state
      const principalText = localStorage.getItem(PRINCIPAL_KEY);
      if (principalText) {
        // Already authenticated: perform logout
        await logout();
        await updateUI();
        return;
      }
      // Not authenticated: perform login
      // @ts-ignore
      const plug = (window as any).ic.plug;
      const connected = await plug.requestConnect({
        whitelist: ["l7gmx-5aaaa-aaaab-qca2a-cai"],
        host: window.location.origin,
      });
      if (!connected) throw new Error("Plug connection rejected");

      await plug.createAgent({
        whitelist: ["l7gmx-5aaaa-aaaab-qca2a-cai"],
        host: window.location.origin,
      });

      const principal = await plug.agent.getPrincipal();
      if (principal) {
        localStorage.setItem(PRINCIPAL_KEY, principal.toText());
        await updateUI();
        return;
      }
      // Not connected, try loginWithPlug fallback
      await loginWithPlug();
      await updateUI();
    } catch (e) {
      console.warn("[Auth] Plug click handler failed:", e);
    }
  });

  await updateUI();
}
