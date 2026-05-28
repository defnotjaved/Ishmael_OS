import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/crypto/tokens";

export type Provider = "google" | "github";

export type StoredToken = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
};

export async function saveToken(
  userId: string,
  provider: Provider,
  token: StoredToken,
  providerUserId?: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("integrations").upsert(
    {
      owner_id: userId,
      provider,
      access_token: encrypt(token.accessToken),
      refresh_token: token.refreshToken ? encrypt(token.refreshToken) : null,
      expires_at: token.expiresAt?.toISOString() ?? null,
      scopes: token.scopes,
      provider_user_id: providerUserId ?? null,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,provider" }
  );
}

export async function getToken(
  userId: string,
  provider: Provider
): Promise<StoredToken | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("access_token, refresh_token, expires_at, scopes")
    .eq("owner_id", userId)
    .eq("provider", provider)
    .single();

  if (error || !data) return null;

  try {
    return {
      accessToken: decrypt(data.access_token),
      refreshToken: data.refresh_token ? decrypt(data.refresh_token) : null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      scopes: data.scopes ?? [],
    };
  } catch {
    // Decryption failure (e.g., key rotation issue) — treat as missing
    return null;
  }
}

export async function getValidGoogleToken(userId: string): Promise<string | null> {
  const token = await getToken(userId, "google");
  if (!token) return null;

  const isExpired =
    token.expiresAt !== null && token.expiresAt.getTime() - Date.now() < 60_000;

  if (!isExpired) return token.accessToken;
  if (!token.refreshToken) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      // On invalid_grant, the refresh token is permanently invalid — clean up
      if (body.error === "invalid_grant") {
        await deleteToken(userId, "google");
      }
      return null;
    }

    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    const expiresIn = Math.min(Math.max(Number(json.expires_in) || 3600, 60), 2592000);
    const newToken: StoredToken = {
      accessToken: json.access_token,
      refreshToken: token.refreshToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: token.scopes,
    };

    await saveToken(userId, "google", newToken);
    return json.access_token;
  } catch {
    return null;
  }
}

export async function deleteToken(userId: string, provider: Provider): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("integrations")
    .delete()
    .eq("owner_id", userId)
    .eq("provider", provider);
}

export async function listConnectedProviders(userId: string): Promise<Provider[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("provider")
    .eq("owner_id", userId);

  return (data ?? []).map((r) => r.provider as Provider);
}
