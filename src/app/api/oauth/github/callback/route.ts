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

  if (error) return failUrl("GitHub authorization denied.");
  if (!code || !state) return failUrl("Invalid OAuth response.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${BASE_URL()}/auth/sign-in`);

  // Validate state — bound to provider + userId
  const stateValid = await validateAndClearOAuthState("github", user.id, state);
  if (!stateValid) return failUrl("OAuth state mismatch — possible CSRF attempt.");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: `${BASE_URL()}/api/oauth/github/callback`,
    }),
  });

  if (!tokenRes.ok) return failUrl("Failed to exchange authorization code.");

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
  };

  if (!tokenJson.access_token) return failUrl("GitHub did not return an access token.");

  let providerUserId: string | undefined;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (userRes.ok) {
      const ghUser = (await userRes.json()) as { id?: number };
      if (typeof ghUser.id === "number") {
        providerUserId = String(ghUser.id);
      }
    }
  } catch {
    // non-fatal
  }

  await saveToken(
    user.id,
    "github",
    {
      accessToken: tokenJson.access_token,
      refreshToken: null,
      expiresAt: null,
      scopes: (tokenJson.scope ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    },
    providerUserId
  );

  return NextResponse.redirect(`${BASE_URL()}/integrations?connected=github`);
}
