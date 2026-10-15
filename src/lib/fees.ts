import type { Prisma } from "@prisma/client";

/**
 * Shared fee / scholarship arithmetic.
 *
 * Pure functions only — no DB import — so this is usable from both server and
 * client components and is trivially testable.
 *
 * ## The invariant
 *
 *     amountCharged = amountPaid + balance + waived
 *
 * `waived` is therefore DERIVED, never stored. A second stored copy could only
 * ever disagree with the other three columns.
 *
 * ## Vocabulary (use these consistently; they are not interchangeable)
 *
 * | Term            | Definition                          | Never                      |
 * |-----------------|-------------------------------------|----------------------------|
 * | Billed (gross)  | Σ amountCharged                     |                            |
 * | Sponsored/Waived| Σ (charged − paid − balance)        |                            |
 * | Net billed      | billed − waived (the collectible)   |                            |
 * | Outstanding     | Σ balance                           | never `billed − paid` —    |
 * |                 |                                     | that double-counts waivers |
 * | Collected       | Σ amountPaid (allocated to fees)    |                            |
 * | Cash received   | Σ Payment.amount                    | not the same as Collected  |
 * | Collection rate | paid / (billed − waived)            | not `paid / billed`        |
 *
 * Collection rate excludes waived money because a waiver cannot be collected —
 * leaving it in the denominator would permanently cap the school's score.
 *
 * All arithmetic runs in integer cents and rounds to 2dp before returning, so a
 * fractional percentage (e.g. 33.33%) cannot drift the invariant by a cent.
 */

export type DecimalLike = Prisma.Decimal | number | string | null | undefined;

/**
 * Accepts `unknown` because money columns reach client components as
 * serialised props typed `unknown`. Non-finite input collapses to 0 rather
 * than poisoning a total with NaN.
 */
export function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function cents(v: unknown): number {
  return Math.round(toNum(v) * 100);
}

// ─── Fee status ─────────────────────────────────────────────
// StudentFee.status is a bare String column with no DB-level protection
// against typos, so always use these constants rather than a literal.

export const FEE_STATUS = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  WAIVED: "WAIVED",
} as const;

export type FeeStatus = (typeof FEE_STATUS)[keyof typeof FEE_STATUS];

/** Statuses meaning "nothing left to collect on this row". */
export const SETTLED_STATUSES: string[] = [FEE_STATUS.PAID, FEE_STATUS.WAIVED];

// ─── Roles ──────────────────────────────────────────────────

export const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

export function isFinanceRole(role?: string | null): boolean {
  return (FINANCE_ROLES as readonly string[]).includes(role ?? "");
}

// ─── Scholarship selection ──────────────────────────────────
// The model has no isActive flag; "active" is derived from the date window.

export function activeScholarshipWhere(at: Date = new Date()) {
  return { startDate: { lte: at }, endDate: { gte: at } };
}

/** Two closed intervals overlap iff aStart <= bEnd && aEnd >= bStart. */
export function overlappingScholarshipWhere(startDate: Date, endDate: Date) {
  return { startDate: { lte: endDate }, endDate: { gte: startDate } };
}

/**
 * Most generous award first, then newest. Discounts are NEVER stacked — a
 * student with two awards gets the better one, not the sum. Without an
 * explicit order these lookups are non-deterministic.
 */
export const SCHOLARSHIP_PREFERENCE_ORDER = [
  { percentage: "desc" as const },
  { amount: "desc" as const },
  { createdAt: "desc" as const },
];

// ─── The single discount function ───────────────────────────

export type ScholarshipLike = {
  id: string;
  percentage: number | null;
  amount: unknown;
};

export type AppliedFee = {
  balance: number;
  status: FeeStatus;
  waivedAmount: number;
  scholarshipId: string | null;
};

/**
 * Work out what a fee row should look like under a scholarship.
 *
 * Status rules:
 *  - `WAIVED` means waived > 0 AND balance === 0 AND paid === 0 — nothing more.
 *  - A PARTIAL award with nothing paid stays `UNPAID`, because real money is
 *    owed and `PARTIAL` already means "partly *paid*" elsewhere in this
 *    codebase. The waived portion stays visible via the derivation.
 *  - A fee part-paid and then fully waived becomes `PAID` — the account is
 *    settled and the student did pay something.
 *
 * Existing `amountPaid` is always preserved; only the remainder is waived.
 * Zeroing it would break reconciliation against the payments table.
 */
export function applyScholarshipToFee(args: {
  amountCharged: unknown;
  amountPaid?: unknown;
  scholarship?: ScholarshipLike | null;
}): AppliedFee {
  const chargedC = Math.max(0, cents(args.amountCharged));
  const paidC = Math.min(Math.max(0, cents(args.amountPaid)), chargedC);

  let waivedC = 0;
  const s = args.scholarship;
  if (s) {
    if (s.percentage !== null && s.percentage !== undefined) {
      // Note `!= null` rather than a truthy check: a deliberate 0% award
      // should waive 0%, not silently fall through to the fixed amount.
      waivedC = Math.round((chargedC * s.percentage) / 100);
    } else if (s.amount !== null && s.amount !== undefined) {
      waivedC = cents(s.amount);
    }
    // Never waive money already collected, never waive more than charged.
    waivedC = Math.min(Math.max(0, waivedC), chargedC - paidC);
  }

  const balanceC = chargedC - paidC - waivedC;

  const status: FeeStatus =
    waivedC > 0 && balanceC === 0 && paidC === 0
      ? FEE_STATUS.WAIVED
      : balanceC <= 0
        ? FEE_STATUS.PAID
        : paidC > 0
          ? FEE_STATUS.PARTIAL
          : FEE_STATUS.UNPAID;

  return {
    balance: balanceC / 100,
    status,
    waivedAmount: waivedC / 100,
    // Never claim attribution for a scholarship that waived nothing.
    scholarshipId: waivedC > 0 ? (s?.id ?? null) : null,
  };
}

// ─── Summarising ────────────────────────────────────────────

export type FeeRowLike = {
  amountCharged: unknown;
  amountPaid: unknown;
  balance: unknown;
  status?: string | null;
};

export type FeeSummary = {
  billed: number;
  paid: number;
  waived: number;
  outstanding: number;
  netBilled: number;
  /** 0..100, one decimal place. Denominator is netBilled, not billed. */
  collectionRate: number;
};

export function summariseFees(rows: readonly FeeRowLike[]): FeeSummary {
  let billedC = 0;
  let paidC = 0;
  let balanceC = 0;
  for (const r of rows) {
    billedC += cents(r.amountCharged);
    paidC += cents(r.amountPaid);
    balanceC += cents(r.balance);
  }
  return buildSummary(billedC, paidC, balanceC);
}

/**
 * For pages using
 * `db.studentFee.aggregate({ _sum: { amountCharged, amountPaid, balance } })`.
 * One three-field aggregate replaces the old two-call pattern and yields
 * `waived` for free — no extra query, no row fetching.
 */
export function summariseFeeAggregate(sum: {
  amountCharged?: unknown;
  amountPaid?: unknown;
  balance?: unknown;
}): FeeSummary {
  return buildSummary(
    cents(sum.amountCharged),
    cents(sum.amountPaid),
    cents(sum.balance),
  );
}

function buildSummary(
  billedC: number,
  paidC: number,
  balanceC: number,
): FeeSummary {
  const waivedC = Math.max(0, billedC - paidC - balanceC);
  const netC = Math.max(0, billedC - waivedC);
  return {
    billed: billedC / 100,
    paid: paidC / 100,
    waived: waivedC / 100,
    outstanding: Math.max(0, balanceC) / 100,
    netBilled: netC / 100,
    collectionRate:
      netC > 0
        ? Math.round((paidC / netC) * 1000) / 10
        : billedC > 0
          ? 100
          : 0,
  };
}

/**
 * Account-level roll-up label. The stored `status` is PER FEE, so an
 * account-wide label genuinely has to be recomputed — this just stops each
 * page inventing its own version.
 *
 * Returns `SPONSORED` rather than `PAID` for a fully-waived account, so
 * finance can tell a payer from a sponsored student at a glance.
 */
export function deriveAccountStatus(
  s: FeeSummary,
): "NO FEES" | "UNPAID" | "PARTIAL" | "SPONSORED" | "PAID" {
  if (s.billed === 0) return "NO FEES";
  if (s.outstanding > 0) return s.paid > 0 ? "PARTIAL" : "UNPAID";
  if (s.paid > 0) return "PAID";
  if (s.waived > 0) return "SPONSORED";
  return "PAID";
}
