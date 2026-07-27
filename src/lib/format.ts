export function formatMoney(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toFixed(2)}`;
}
