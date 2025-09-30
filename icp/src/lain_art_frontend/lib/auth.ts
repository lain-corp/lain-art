import { AuthClient } from "@dfinity/auth-client";

let authClient: AuthClient | null = null;
const PRINCIPAL_KEY = "icp_principal";

export async function getAuthClient(): Promise<AuthClient> {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  return authClient;
}

export async function getPrincipal(): Promise<string | null> {
  const client = await getAuthClient();
  if (await client.isAuthenticated()) {
    const principal = client.getIdentity().getPrincipal().toText();
    localStorage.setItem(PRINCIPAL_KEY, principal);
    return principal;
  }
  return localStorage.getItem(PRINCIPAL_KEY);
}

export async function login(): Promise<string | null> {
  const client = await getAuthClient();
  return new Promise((resolve, reject) => {
    client.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        const principal = client.getIdentity().getPrincipal().toText();
        localStorage.setItem(PRINCIPAL_KEY, principal);
        resolve(principal);
      },
      onError: (err) => {
        console.error("[Auth] Login error:", err);
        reject(err);
      },
    });
  });
}

export async function logout(): Promise<void> {
  const client = await getAuthClient();
  await client.logout();
  localStorage.removeItem(PRINCIPAL_KEY);
}

export async function initAuth(buttonId: string) {
  const authBtn = document.getElementById(buttonId) as HTMLButtonElement | null;
  if (!authBtn) {
    console.warn(`[Auth] Button with id="${buttonId}" not found`);
    return;
  }

  async function updateUI() {
    const client = await getAuthClient();
    if (await client.isAuthenticated()) {
      const principal = client.getIdentity().getPrincipal().toText();
      authBtn.textContent = "Logout";
      document.dispatchEvent(
        new CustomEvent("userAuthenticated", { detail: { principal } })
      );
    } else {
      authBtn.textContent = "Authenticate";
      document.dispatchEvent(new Event("userLoggedOut"));
    }
  }

  authBtn.addEventListener("click", async () => {
    const client = await getAuthClient();
    if (await client.isAuthenticated()) {
      await logout();
    } else {
      await login();
    }
    await updateUI();
  });

  updateUI();
}
