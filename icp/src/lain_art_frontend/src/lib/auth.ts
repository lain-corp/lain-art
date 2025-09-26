import { AuthClient } from "@dfinity/auth-client";

export async function initAuth(buttonId: string) {
  const authClient = await AuthClient.create();

  async function login() {
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        const principal = authClient.getIdentity().getPrincipal().toText();
        console.log("Authenticated Principal:", principal);
        const btn = document.getElementById(buttonId) as HTMLButtonElement;
        if (btn) {
          btn.textContent = "Connected";
          btn.disabled = true;
        }
      },
    });
  }

  const btn = document.getElementById(buttonId);
  btn?.addEventListener("click", login);
}
