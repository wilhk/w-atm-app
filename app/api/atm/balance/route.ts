import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, getSessionCookieName } from "@/lib/mockBank";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const account = getSessionAccount(token);

  if (!account) {
    return NextResponse.json(
      { message: "NO Account Found." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    balance: account.balance,
    currency: account.currency
  });
}
