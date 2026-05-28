import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAndClearOAuthState } from "@/lib/oauth/state";
import { saveToken } from "@/lib/integrations/token-store";

const BASE_URL = () => process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const failUrl = (reason: string) =>
    NextResponse.redirect(`${BASE_URL()}/integrations?error=${encodeURIComponent(reason)}`);

  if (error) return failUrl("Google authorization denied.");
  if (!code || !state) return failUrl("Invalid OAuth response.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${BASE_URL()}/auth/sign-in`);

  // Validate state — bound to provider + userId to prevent CSRF and provider mix-up
  const stateValid = await validateAndClearOAuthState("google", user.id, state);
  if (!stateValid) return failUrl("OAuth state mismatch — possible CSRF attempt.");

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${BASE_URL()}/api/oauth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return failUrl("Failed to exchange authorization code.");

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };

  // Extract provider_user_id from id_token (trusted back-channel response)
  let providerUserId: string | undefined;
  try {
    if (tokenJson.id_token) {
      const payload = JSON.parse(
        Buffer.from(tokenJson.id_token.split(".")[1], "base64url").toString("utf8")
      ) as { sub?: string };
      if (typeof payload.sub === "string") {
        providerUserId = payload.sub.slice(0, 50); // cap length, parameterized insert so no injection risk
      }
    }
  } catch {
    // non-fatal
  }

  const expiresIn = Math.min(Math.max(Number(tokenJson.expires_in) || 3600, 60), 2592000);

  await saveToken(
    user.id,
    "google",
    {
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token ?? null,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: tokenJson.scope.split(" ").filter(Boolean),
    },
    providerUserId
  );

  return NextResponse.redirect(`${BASE_URL()}/integrations?connected=google`);
}
