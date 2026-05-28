"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/auth/sign-in");
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Sign out"
      className="shrink-0"
      onClick={handleSignOut}
    >
      <LogOut />
    </Button>
  );
}
