
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const response = await fetch(
    `https://api.frankfurter.app/latest?from=${from}&to=${to}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rate for ${from} -> ${to}`);
  }

  const data = await response.json();
  const rate = data.rates?.[to];

  if (!rate) {
    throw new Error(`No rate found for ${from} -> ${to}`);
  }

  return rate;
}