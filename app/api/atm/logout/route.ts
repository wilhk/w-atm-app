import { NextRequest, NextResponse } from "next/server";
import { clearSession, getSessionCookieName } from "@/lib/mockBank";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;

  clearSession(token);

  const response = NextResponse.json({ message: "Session ended." });

  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    path: "/",
    maxAge: 0
  });

  return response;
}
