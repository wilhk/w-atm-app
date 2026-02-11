import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, withdraw } from "@/lib/mockBank";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { amount?: unknown }
    | null;

  const token = request.cookies.get(getSessionCookieName())?.value;
  const amount = typeof body?.amount === "number" ? body.amount : NaN;

  const result = withdraw(token, amount);

  if (!result.ok) {
    if (result.code === "UNAUTHENTICATED") {
      return NextResponse.json(
        { message: "No Account Found." },
        { status: 401 }
      );
    }

    if (result.code === "INSUFFICIENT_FUNDS") {
      return NextResponse.json(
        { message: "Insufficient funds." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Please provide a valid amount greater than $0." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: `Withdrew $${result.delta.toFixed(2)} successfully.`,
    withdrawn: result.delta,
    balance: result.account.balance,
    currency: result.account.currency
  });
}
