"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, deleteToken } from "@/lib/integrations/token-store";
import type { Provider } from "@/lib/integrations/token-store";

const ProviderSchema = z.enum(["google", "github"]);

async function revokeGoogleToken(accessToken: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
    });
  } catch {
    // Non-fatal — token is already removed from our DB
  }
}

async function revokeGitHubToken(accessToken: string): Promise<void> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return;

  try {
    await fetch(`https://api.github.com/applications/${clientId}/token`, {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {
    // Non-fatal
  }
}

export async function disconnectIntegration(providerRaw: unknown): Promise<{
  success?: boolean;
  error?: string;
}> {
  const parsed = ProviderSchema.safeParse(providerRaw);
  if (!parsed.success) return { error: "Invalid provider." };
  const provider = parsed.data as Provider;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Capture decrypted token before deletion so we can revoke it at the provider
  const token = await getToken(user.id, provider);

  // Delete from our DB first — intent is always to disconnect, even if revocation fails
  await deleteToken(user.id, provider);

  // Then revoke at provider (best-effort — non-fatal on failure)
  if (token) {
    if (provider === "google") await revokeGoogleToken(token.accessToken);
    if (provider === "github") await revokeGitHubToken(token.accessToken);
  }

  revalidatePath("/integrations");
  revalidatePath("/");
  return { success: true };
}
