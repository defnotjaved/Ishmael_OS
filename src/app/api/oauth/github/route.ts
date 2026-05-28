import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setOAuthState } from "@/lib/oauth/state";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/auth/sign-in", process.env.NEXT_PUBLIC_BASE_URL!));

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });

  const state = await setOAuthState("github", user.id);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/github/callback`);
  // Minimal scopes: read user profile + public repos (for assigned issues)
  url.searchParams.set("scope", "read:user public_repo");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
