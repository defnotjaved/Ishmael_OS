export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate required secrets at server boot — fail fast before any request
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    if (key !== undefined && key.length !== 64) {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY must be a 64-character hex string. " +
          "Generate one with: openssl rand -hex 32"
      );
    }
    // Note: when TOKEN_ENCRYPTION_KEY is absent, integrations features are
    // gracefully unavailable (OAuth routes return 500, token helpers throw).
    // If integrations are required, set the env var and this check will enforce it.
  }
}
