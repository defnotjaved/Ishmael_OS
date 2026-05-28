"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disconnectIntegration } from "@/app/integrations/actions";
import type { Provider } from "@/lib/integrations/token-store";

export function DisconnectButton({ provider }: { provider: Provider }) {
  const [isPending, startTransition] = useTransition();

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration(provider);
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDisconnect}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
      Disconnect
    </Button>
  );
}
