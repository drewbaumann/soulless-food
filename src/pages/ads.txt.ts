import { ADSENSE_CLIENT, adsEnabled } from "../config";

// Authorized Digital Sellers file. AdSense needs this to serve full-rate ads.
export function GET() {
  const body = adsEnabled
    ? `google.com, ${ADSENSE_CLIENT.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`
    : "# No ad sellers configured yet.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
