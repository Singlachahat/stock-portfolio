export interface GoogleFinanceQuote {
  peRatio: number | null;
  latestEarning: string | null;
  error?: string;
}

const EXCHANGE_MAP: Record<string, string> = {
  NSE: "NSE",
  BSE: "BSE",
  NASDAQ: "NASDAQ",
  NYSE: "NYSE",
  NYSEARCA: "NYSEARCA",
  BOM: "BSE",
};

function toGoogleSymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO|NSE|BSE|NASDAQ|NYSE|BOM)$/i, "").trim() || symbol;
}

function parsePeRatio(html: string): number | null {
  const altMatch = html.match(/P\/E\s*ratio[\s\S]{0,150}?(\d+\.?\d*)/i);
  if (altMatch) return parseFloat(altMatch[1]);
  return null;
}

function parseLatestEarning(html: string): string | null {
  const fiscalMatch = html.match(/Fiscal\s+Q\d+\s+\d{4}\s+ended\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (fiscalMatch) {
    const [, mon, day, year] = fiscalMatch;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${mon.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const monthMatch = html.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/);
  if (monthMatch) {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    return `${monthMatch[2]}-${months[monthMatch[1]] || "01"}-01`;
  }
  return null;
}

export async function fetchGoogleFinanceQuote(
  symbol: string,
  exchange: string
): Promise<GoogleFinanceQuote> {
  const cleanSymbol = toGoogleSymbol(symbol);
  const googleExchange = EXCHANGE_MAP[exchange] || exchange || "NASDAQ";

  const url = `https://www.google.com/finance/quote/${encodeURIComponent(cleanSymbol)}:${encodeURIComponent(googleExchange)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Finance returned ${response.status}`);
    }

    const html = await response.text();
    const peRatio = parsePeRatio(html);
    const latestEarning = parseLatestEarning(html);

    return { peRatio, latestEarning };
  } catch (err: any) {
    return {
      peRatio: null,
      latestEarning: null,
      error: err?.message ?? "Failed to fetch from Google Finance",
    };
  }
}
