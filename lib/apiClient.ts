export interface SessionPayload {
  userName: string;
  cardType: "star" | "mastercard";
  currency: "CAD";
  balance: number;
}


async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Request failed");
  }

  return data;
}

export async function loadSession() {
  const response = await fetch("/api/atm/session", {
    method: "GET",
    cache: "no-store"
  });

  return parseResponse<{ session: SessionPayload; message: string }>(response);
}

export async function createSession(pin: string) {
  const response = await fetch("/api/atm/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pin }) //TODO: in a real app, this should be hashed or encrypted before sent over HTTPS
  });

  return parseResponse<{ session: SessionPayload; message: string }>(response); 
}

export async function getBalance() {
  const response = await fetch("/api/atm/balance", {
    method: "GET",
    cache: "no-store"
  });

  return parseResponse<{ balance: number; currency: string }>(response);
}

export async function depositFunds(amount: number) {
  const response = await fetch("/api/atm/deposit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount })
  });

  return parseResponse<{ balance: number; currency: string; deposited: number; message: string }>(response);
}

export async function withdrawFunds(amount: number) {
  const response = await fetch("/api/atm/withdraw", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount })
  });

  return parseResponse<{ balance: number; currency: string; withdrawn: number; message: string }>(response);
}

export async function logoutSession() {
  const response = await fetch("/api/atm/logout", {
    method: "POST"
  });

  return parseResponse<{ message: string }>(response);
}
