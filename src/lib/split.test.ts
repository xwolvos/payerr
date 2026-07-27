import { test } from "node:test";
import assert from "node:assert/strict";
import { splitCost, monthlyEquivalent, type SplitUser } from "./split.ts";

test("monthlyEquivalent converts yearly costs to a monthly figure", () => {
  assert.equal(monthlyEquivalent({ amount: 120, interval: "yearly" }), 10);
  assert.equal(monthlyEquivalent({ amount: 15, interval: "monthly" }), 15);
});

test("equal split divides the total evenly", () => {
  const users: SplitUser[] = [
    { id: 1, name: "A", shareType: "equal", shareValue: 1 },
    { id: 2, name: "B", shareType: "equal", shareValue: 1 },
    { id: 3, name: "C", shareType: "equal", shareValue: 1 },
  ];
  const result = splitCost(30, users);
  assert.equal(result.length, 3);
  const total = result.reduce((sum, r) => sum + r.amountDue, 0);
  assert.equal(total, 30);
  // Splitting evenly should give each user the same share.
  assert.deepEqual(
    result.map((r) => r.amountDue),
    [10, 10, 10]
  );
});

test("equal split reconciles rounding cents on the last user", () => {
  const users: SplitUser[] = [
    { id: 1, name: "A", shareType: "equal", shareValue: 1 },
    { id: 2, name: "B", shareType: "equal", shareValue: 1 },
    { id: 3, name: "C", shareType: "equal", shareValue: 1 },
  ];
  const result = splitCost(10, users);
  const total = result.reduce((sum, r) => sum + r.amountDue, 0);
  assert.equal(total, 10);
});

test("weighted split allocates proportionally to weight", () => {
  const users: SplitUser[] = [
    { id: 1, name: "A", shareType: "weighted", shareValue: 1 },
    { id: 2, name: "B", shareType: "weighted", shareValue: 3 },
  ];
  const result = splitCost(40, users);
  const total = result.reduce((sum, r) => sum + r.amountDue, 0);
  assert.equal(total, 40);
  const a = result.find((r) => r.userId === 1)!;
  const b = result.find((r) => r.userId === 2)!;
  assert.equal(a.amountDue, 10);
  assert.equal(b.amountDue, 30);
});

test("fixed-share users are billed their flat amount, not proportional", () => {
  const users: SplitUser[] = [
    { id: 1, name: "A", shareType: "fixed", shareValue: 5 },
    { id: 2, name: "B", shareType: "equal", shareValue: 1 },
    { id: 3, name: "C", shareType: "equal", shareValue: 1 },
  ];
  const result = splitCost(25, users);
  const a = result.find((r) => r.userId === 1)!;
  const b = result.find((r) => r.userId === 2)!;
  const c = result.find((r) => r.userId === 3)!;
  assert.equal(a.amountDue, 5);
  // Remaining $20 splits evenly between the two equal-share users.
  assert.equal(b.amountDue, 10);
  assert.equal(c.amountDue, 10);
});

test("fixed shares that exceed the total cost clamp the remaining pool to zero", () => {
  const users: SplitUser[] = [
    { id: 1, name: "A", shareType: "fixed", shareValue: 50 },
    { id: 2, name: "B", shareType: "equal", shareValue: 1 },
  ];
  const result = splitCost(30, users);
  const a = result.find((r) => r.userId === 1)!;
  const b = result.find((r) => r.userId === 2)!;
  assert.equal(a.amountDue, 50);
  assert.equal(b.amountDue, 0);
});

test("a single pool user absorbs the entire remaining cost", () => {
  const users: SplitUser[] = [{ id: 1, name: "A", shareType: "equal", shareValue: 1 }];
  const result = splitCost(19.99, users);
  assert.equal(result[0].amountDue, 19.99);
});

test("no users returns no invoices", () => {
  const result = splitCost(100, []);
  assert.deepEqual(result, []);
});
