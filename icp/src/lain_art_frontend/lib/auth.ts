import { AuthClient } from "@dfinity/auth-client";

let authClient: AuthClient | null = null;

/**
 * Ensure we always reuse the same AuthClient instance.
 */
export async function getAuthClient(): Promise<AuthClient> {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  return authClient;
}

/**
 * Check if authenticated and return principal string if so.
 */
export async function getPrincipal(): Promise<string | null> {
  const client = await getAuthClient();
  if (await client.isAuthenticated()) {
    return client.getIdentity().getPrincipal().toText();
  }
  return null;
}

/**
 * Perform login and resolve with principal on success.
 */
export async function login(): Promise<string | null> {
  const client = await getAuthClient();
  return new Promise((resolve, reject) => {
    client.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        const principal = client.getIdentity().getPrincipal().toText();
        document.dispatchEvent(
          new CustomEvent("userAuthenticated", { detail: { principal } })
        );
        resolve(principal);
      },
      onError: (err) => {
        console.error("[Auth] Login error:", err);
        reject(err);
      },
    });
  });
}

/**
 * Perform logout.
 */
export async function logout(): Promise<void> {
  const client = await getAuthClient();
  await client.logout();
  document.dispatchEvent(new Event("userLoggedOut"));
}

/**
 * Initialize a button by ID with login/logout behavior.
 */
export async function initAuth(buttonId: string) {
  const client = await getAuthClient();
  const authBtn = document.getElementById(buttonId) as HTMLButtonElement | null;
  if (!authBtn) {
    console.warn(`[Auth] Button with id="${buttonId}" not found`);
    return;
  }

  async function updateUI() {
    const principal = await getPrincipal();
    if (principal) {
      authBtn.textContent = "Logout";
      // Dispatch again on load so other pages can react
      document.dispatchEvent(
        new CustomEvent("userAuthenticated", { detail: { principal } })
      );
    } else {
      authBtn.textContent = "Authenticate";
    }
  }

  authBtn.addEventListener("click", async () => {
    if (await client.isAuthenticated()) {
      await logout();
      authBtn.textContent = "Authenticate";
    } else {
      const principal = await login();
      if (principal) {
        authBtn.textContent = "Logout";
      }
    }
  });

  updateUI();
}
