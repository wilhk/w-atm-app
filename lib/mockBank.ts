import { console } from "inspector";

export type CardType = "star" | "mastercard";

interface Account {
  id: string;
  name: string;
  pin: string;
  cardType: CardType;
  currency: "CAD";
  balanceInCents: number;
}

interface PublicAccount {
  userName: string;
  cardType: CardType;
  currency: "CAD";
  balance: number;
}

interface SessionRecord {
  accountId: string;
  createdAt: number;
}

const SESSION_COOKIE = "w_atm_app_session";

const accountStore: Account = {
  id: "acc_1001",
  name: "Peter Parker",
  pin: "1234",
  cardType: "star",
  currency: "CAD",
  balanceInCents: 127540
};

const sessionStore = new Map<string, SessionRecord>();

function toPublicAccount(account: Account): PublicAccount {
  return {
    userName: account.name,
    cardType: account.cardType,
    currency: account.currency,
    balance: Number((account.balanceInCents / 100).toFixed(2))
  };
}

function normalizeAmountToCents(amount: number): number | null {
  if (amount <= 0) {
    return null;
  }

  const cents = Math.round(amount * 100);
  return cents;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function createSession(pin: string) {
  if (pin !== accountStore.pin) {
    return null;
  }

  const token = crypto.randomUUID();
  sessionStore.set(token, {
    accountId: accountStore.id,
    createdAt: Date.now()
  });

  return {
    token,
    account: toPublicAccount(accountStore)
  };
}

export function getSessionAccount(token?: string | null) {
  if (!token) {
    return null;
  }

  const session = sessionStore.get(token);

  if (!session || session.accountId !== accountStore.id) {
    return null;
  }

  return toPublicAccount(accountStore);
}

export function clearSession(token?: string | null) {
  if (!token) {
    return;
  }

  sessionStore.delete(token);
}

export function deposit(token: string | null | undefined, amount: number) {
  const account = getSessionAccount(token);
  if (!account) {
    return { ok: false as const, code: "UNAUTHENTICATED" as const };
  }

  const cents = normalizeAmountToCents(amount);
  if (cents === null) {
    return { ok: false as const, code: "INVALID_AMOUNT" as const };
  }

  accountStore.balanceInCents += cents;

  return {
    ok: true as const,
    account: toPublicAccount(accountStore),
    delta: Number((cents / 100).toFixed(2))
  };
}

export function withdraw(token: string | null | undefined, amount: number) {
  const account = getSessionAccount(token);
  if (!account) {
    return { ok: false as const, code: "UNAUTHENTICATED" as const };
  }

  const cents = normalizeAmountToCents(amount);
  if (cents === null) {
    return { ok: false as const, code: "INVALID_AMOUNT" as const };
  }

  if (cents > accountStore.balanceInCents) {
    return { ok: false as const, code: "INSUFFICIENT_FUNDS" as const };
  }

  accountStore.balanceInCents -= cents;

  return {
    ok: true as const,
    account: toPublicAccount(accountStore),
    delta: Number((cents / 100).toFixed(2))
  };
}
