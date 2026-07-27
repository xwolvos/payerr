export interface CostLike {
  amount: number;
  interval: string;
}

export function monthlyEquivalent(item: CostLike): number {
  return item.interval === "yearly" ? item.amount / 12 : item.amount;
}

export type ShareType = "equal" | "weighted" | "fixed";

export interface SplitUser {
  id: number;
  name: string;
  shareType: ShareType;
  shareValue: number;
}

export interface SplitResult {
  userId: number;
  name: string;
  amountDue: number;
}

/**
 * Fixed-share users are billed their flat amount first; whatever cost remains
 * is divided among equal/weighted users proportional to their weight
 * (equal counts as weight 1). The last remaining-pool user absorbs any
 * rounding cent so totals reconcile exactly with the input cost.
 */
export function splitCost(totalCost: number, users: SplitUser[]): SplitResult[] {
  const fixedUsers = users.filter((u) => u.shareType === "fixed");
  const poolUsers = users.filter((u) => u.shareType !== "fixed");

  const fixedTotal = fixedUsers.reduce((sum, u) => sum + u.shareValue, 0);
  const remainingPool = Math.max(totalCost - fixedTotal, 0);

  const results: SplitResult[] = fixedUsers.map((u) => ({
    userId: u.id,
    name: u.name,
    amountDue: round2(u.shareValue),
  }));

  if (poolUsers.length === 0) return results;

  const totalWeight = poolUsers.reduce(
    (sum, u) => sum + (u.shareType === "weighted" ? u.shareValue : 1),
    0
  );

  let allocated = 0;
  poolUsers.forEach((u, index) => {
    const weight = u.shareType === "weighted" ? u.shareValue : 1;
    const isLast = index === poolUsers.length - 1;
    let amount: number;
    if (totalWeight === 0) {
      amount = 0;
    } else if (isLast) {
      amount = round2(remainingPool - allocated);
    } else {
      amount = round2((remainingPool * weight) / totalWeight);
      allocated += amount;
    }
    results.push({ userId: u.id, name: u.name, amountDue: amount });
  });

  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
