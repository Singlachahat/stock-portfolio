const RAPID_API_KEY = process.env.RAPIDAPI_KEY || process.env.RAPID_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "yh-finance.p.rapidapi.com";

const IS_REALTIME = RAPIDAPI_HOST.includes("yahoo-finance-real-time");

export interface RapidQuoteResult {
  cmp: number;
  error?: string;
}

function extractPrice(data: any): number | null {
  if (data == null) return null;
  const paths = [
    data?.price?.regularMarketPrice?.raw,
    data?.price?.regularMarketPrice,
    data?.regularMarketPrice?.raw,
    data?.regularMarketPrice,
    data?.result?.[0]?.regularMarketPrice,
    data?.quoteResponse?.result?.[0]?.regularMarketPrice,
    data?.underlyingSymbol && data?.strike, // options sometimes have underlying
  ];
  for (const v of paths) {
    if (typeof v === "number" && v > 0) return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

export async function getYahooViaRapid(symbol: string): Promise<RapidQuoteResult> {
  if (!RAPID_API_KEY) {
    return { cmp: 0, error: "RAPIDAPI_KEY not configured" };
  }

  const headers: Record<string, string> = {
    "x-rapidapi-key": RAPID_API_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };

  let url: string;
  if (IS_REALTIME) {
    url = `https://${RAPIDAPI_HOST}/stock/get-quote?symbol=${encodeURIComponent(symbol)}`;
  } else {
    url = `https://${RAPIDAPI_HOST}/stock/v2/get-summary?symbol=${encodeURIComponent(symbol)}`;
  }

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (IS_REALTIME && res.status === 404) {
        const optionsUrl = `https://${RAPIDAPI_HOST}/stock/get-options?symbol=${encodeURIComponent(symbol)}&lang=en-US&region=US`;
        const optRes = await fetch(optionsUrl, { headers });
        if (optRes.ok) {
          const optData = (await optRes.json()) as any;
          const cmp = extractPrice(optData) ?? extractPrice(optData?.optionChain?.result?.[0]?.quote);
          if (cmp != null && cmp > 0) return { cmp };
        }
      }
      return { cmp: 0, error: `RapidAPI returned ${res.status}` };
    }

    const data = (await res.json()) as any;
    const cmp = extractPrice(data) ?? extractPrice(data?.optionChain?.result?.[0]?.quote);
    if (cmp != null && cmp > 0) return { cmp };
    return { cmp: 0, error: "Invalid or missing price in response" };
  } catch (err: any) {
    return { cmp: 0, error: err?.message ?? "RapidAPI request failed" };
  }
}
