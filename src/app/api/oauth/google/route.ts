import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setOAuthState } from "@/lib/oauth/state";

// Use gmail.metadata (not gmail.readonly) to prevent access to message bodies
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
  "openid",
  "email",
].join(" ");

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/auth/sign-in", process.env.NEXT_PUBLIC_BASE_URL!));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });

  const state = await setOAuthState("google", user.id);
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/google/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return NextResponse.redirect(url.toString());
}
