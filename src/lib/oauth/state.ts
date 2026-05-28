import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { hmacSign } from "@/lib/crypto/tokens";

// State format: randomHex + "." + hmac(key, provider:userId:randomHex)
// Namespaced cookies per provider prevent provider mix-up.

const TTL_SECONDS = 600;

function cookieName(provider: string): string {
  return `oauth_state_${provider}`;
}

export async function setOAuthState(provider: string, userId: string): Promise<string> {
  const random = randomBytes(32).toString("hex");
  const sig = hmacSign(`${provider}:${userId}:${random}`);
  const state = `${random}.${sig}`;

  const jar = await cookies();
  jar.set(cookieName(provider), state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_SECONDS,
    path: "/",
  });
  return state;
}

export async function validateAndClearOAuthState(
  provider: string,
  userId: string,
  incoming: string
): Promise<boolean> {
  const jar = await cookies();
  const stored = jar.get(cookieName(provider))?.value;
  jar.delete(cookieName(provider));

  if (!stored || stored !== incoming) return false;

  const [random] = incoming.split(".");
  if (!random) return false;

  const expectedSig = hmacSign(`${provider}:${userId}:${random}`);
  const expectedState = `${random}.${expectedSig}`;
  return incoming === expectedState;
}
