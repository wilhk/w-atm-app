import { NextRequest, NextResponse } from "next/server";
import { deposit, getSessionCookieName } from "@/lib/mockBank";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { amount?: unknown }
    | null;

  const token = request.cookies.get(getSessionCookieName())?.value;
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  const result = deposit(token, amount);

  if (!result.ok) {
    if (result.code === "UNAUTHENTICATED") {
      return NextResponse.json(
        { message: "NO Account Found." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Please provide a valid amount greater than $0." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: `Deposited $${result.delta.toFixed(2)} successfully.`,
    deposited: result.delta,
    balance: result.account.balance,
    currency: result.account.currency
  });
}
