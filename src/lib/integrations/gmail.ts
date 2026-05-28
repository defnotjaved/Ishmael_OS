import { getValidGoogleToken } from "@/lib/integrations/token-store";

export type GmailReceipt = {
  id: string;
  subject: string;
  from: string;
  date: string; // ISO
};

type GmailMessage = {
  id: string;
};

type GmailMessageDetail = {
  id: string;
  payload?: {
    headers?: { name: string; value: string }[];
  };
  internalDate?: string;
};

// Heuristic: fetch recent emails that look like receipts — metadata only, no body/snippet
const RECEIPT_QUERY =
  '(subject:receipt OR subject:order OR subject:invoice OR subject:"your order") newer_than:30d';

export async function fetchRecentReceipts(userId: string, max = 10): Promise<GmailReceipt[]> {
  const token = await getValidGoogleToken(userId);
  if (!token) return [];

  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", RECEIPT_QUERY);
  listUrl.searchParams.set("maxResults", String(max));

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 600 },
  });

  if (!listRes.ok) return [];
  const listJson = (await listRes.json()) as { messages?: GmailMessage[] };
  const messages = listJson.messages ?? [];

  const receipts = await Promise.all(
    messages.map(async (m): Promise<GmailReceipt | null> => {
      const detailRes = await fetch(
        // format=metadata + specific metadataHeaders — no message body returned
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 600 },
        }
      );
      if (!detailRes.ok) return null;
      const detail = (await detailRes.json()) as GmailMessageDetail;
      const headers = detail.payload?.headers ?? [];
      const get = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

      return {
        id: detail.id,
        subject: get("Subject") || "(No subject)",
        from: get("From"),
        date: detail.internalDate
          ? new Date(Number(detail.internalDate)).toISOString()
          : new Date().toISOString(),
      };
    })
  );

  return receipts.filter((r): r is GmailReceipt => r !== null);
}
