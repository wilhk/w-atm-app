import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getSessionAccount,
  getSessionCookieName
} from "@/lib/mockBank";

function buildSessionCookie(value: string) {
  return {
    name: getSessionCookieName(),
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const account = getSessionAccount(token);

  if (!account) {
    return NextResponse.json(
      { message: "No active session." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: "Session restored.",
    session: account
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { pin?: unknown }
    | null;

  if (!body || typeof body.pin !== "string") {
    return NextResponse.json({ message: "PIN is required." }, { status: 400 });
  }

  const result = createSession(body.pin.trim());

  if (!result) {
    return NextResponse.json(
      { message: "Invalid PIN. Try 1234 for demo access." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    message: "PIN accepted.",
    session: result.account
  });

  response.cookies.set(buildSessionCookie(result.token));

  return response;
}
