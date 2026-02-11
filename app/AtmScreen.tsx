"use client";

import { useEffect, useMemo, useReducer } from "react";
import { createSession, getBalance, SessionPayload, logoutSession, depositFunds, withdrawFunds } from "@/lib/apiClient";

type Mode = "welcome" | "pin" | "menu" | "balance" | "deposit" | "withdraw";

interface AtmState {
  mode: Mode;
  session: SessionPayload | null;
  pin: string;
  amount: string;
  loading: boolean;
  statusText: string;
  errorText: string;
}

interface SideButtonConfig {
  label: string;
  onClick?: () => void;
}

const INITIAL_STATE: AtmState = {
  mode: "welcome",
  session: null,
  pin: "",
  amount: "",
  loading: false,
  statusText: "",
  errorText: ""
};




function atmReducer(state: AtmState, action: AtmAction): AtmState {
  switch (action.type) {
    case "SET_PIN":
      return {
        ...state,
        pin: action.payload.replace(/\D/g, "").slice(0, 4),
        errorText: ""
      };
    case "SET_AMOUNT":
      return {
        ...state,
        amount: action.payload,
        errorText: ""
      };
    case "START_REQUEST":
      return {
        ...state,
        loading: true,
        errorText: ""
      };
    case "SET_ERROR":
      return {
        ...state,
        loading: false,
        errorText: action.payload
      };
    case "SET_STATUS":
      return {
        ...state,
        loading: false,
        statusText: action.payload,
        errorText: ""
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        mode: "menu",
        session: action.payload,
        pin: "",
        amount: "",
        statusText: "PIN accepted.",
        errorText: ""
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        loading: false,
        mode: "menu",
        session: action.payload,
        statusText: "Session restored.",
        errorText: ""
      };
    case "SET_MODE":
      return {
        ...state,
        loading: false,
        mode: action.payload,
        amount: "",
        statusText: action.payload === "menu" ? "" : state.statusText,
        errorText: ""
      };
    case "UPDATE_BALANCE":
      return {
        ...state,
        loading: false,
        session: state.session
          ? {
              ...state.session,
              balance: action.payload
            }
          : state.session
      };
    case "LOGOUT":
      return {
        ...INITIAL_STATE,
        statusText: "Session ended."
      };
    default:
      return state;
  }
}

export function AtmScreen() {
    const [state, dispatch] = useReducer(atmReducer, INITIAL_STATE);

    const handleLogin = async () => {
    if (state.pin.length < 4) {
      dispatch({ type: "SET_ERROR", payload: "Please enter a 4-digit PIN." });
      return;
    }
    dispatch({ type: "START_REQUEST" });

    try {
      const data = await createSession(state.pin);
      dispatch({ type: "LOGIN_SUCCESS", payload: data.session });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Unable to validate PIN."
      });
    }
  };

  const handleLogout = async () => {
    dispatch({ type: "START_REQUEST" });
    
    try {
      await logoutSession();
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Unable to logout."
      });
    }
  }

  const checkBalance = async () => {
    dispatch({ type: "START_REQUEST" });
    
    try {
        const data = await getBalance();
        dispatch({ type: "SET_MODE", payload: "balance" });
    } catch (error) {
        dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Unable to retrieve balance."
        });
    }
  }

  const handleTransaction = async (type: "deposit" | "withdraw") => {
    dispatch({ type: "START_REQUEST" });

    try {
        const amount = parseFloat(state.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error("Please enter a valid amount greater than $0.");
        }

        let data;
        if (type === "deposit") {
            data = await depositFunds(amount);
            dispatch({ type: "SET_STATUS", payload: `Deposited $${data.deposited.toFixed(2)} successfully.` });
        } else {
            data = await withdrawFunds(amount);
            dispatch({ type: "SET_STATUS", payload: `Withdrew $${data.withdrawn.toFixed(2)} successfully.` });
        }

        dispatch({ type: "UPDATE_BALANCE", payload: data.balance });
        setTimeout(() => {
             dispatch({ type: "SET_MODE", payload: "menu" });
            }, 1000); // return to menu after 1 seconds
    } catch (error) {
        dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Transaction failed."
        });
    }
  }


    
  const leftButtons = useMemo<SideButtonConfig[]>(() => {
    if (state.mode === "menu") {
      return [
        { label: "" },
        { label: "" },
        { label: "Withdraw", onClick: () => dispatch({ type: "SET_MODE", payload: "withdraw" }) },
        { label: "Deposit", onClick: () => dispatch({ type: "SET_MODE", payload: "deposit" }) }
      ];
    }

    if (state.mode === "deposit" || state.mode === "withdraw") {
      return [
        { label: "" },
        { label: "" },
        { label: "" },
        {
          label: "Confirm",
          onClick: () => void handleTransaction(state.mode)
        }
      ];
    }

    return [{ label: "" }, { label: "" }, { label: "" }, { label: "" }];
  }, [state.mode, state.amount]);


  const rightButtons = useMemo<SideButtonConfig[]>(() => {

    if (state.mode === "welcome") {
      return [
        { label: "" },
        { label: "" },
        { label: "" },
        { label: "Enter PIN", onClick: () => dispatch({ type: "SET_MODE", payload: "pin" }) }
      ];
    }


    if (state.mode === "pin") {
      return [
        { label: "" },
        { label: "" },
        { label: "" },
        { label: "Confirm", onClick: () => void handleLogin() }
      ];
    }

    if (state.mode === "menu") {
      return [
        { label: "" },
        { label: "Exit", onClick: () => void handleLogout() },
        { label: "Balance", onClick: () => void checkBalance() },
        { label: "Re-enter Pin", onClick: () => dispatch({ type: "SET_MODE", payload: "pin" }) }
      ];
    }

    if (state.mode === "balance") {
      return [
        { label: "Exit", onClick: () => void handleLogout() },
        { label: "" },
        { label: "" },
        { label: "Back", onClick: () => dispatch({ type: "SET_MODE", payload: "menu" }) }
      ];
    }

    return [
      { label: "Exit", onClick: () => void handleLogout() },
      { label: "" },
      { label: "" },
      { label: "Cancel", onClick: () => dispatch({ type: "SET_MODE", payload: "menu" }) }
    ];
  }, [state.mode, state.pin, state.amount]);
    
  return (
        <main className="atm-page">
            <section className="atm-machine">
                {/* ATM Header Sign and Body */}
                <img
                src="/assets/atm_sign.png"
                alt="ATM 24 hour banking sign"
                className="atm-sign"
                />
                <img src="/assets/graffiti.png" alt="Graffiti" className="graffiti" />

                <div className="atm-body">
                    <div className="card-strip" aria-label="Supported card types">
                        <div className="card-logo" title="Card logos"></div>
                        <div className={`card-logo star ${
                                    state.session?.cardType === "star" ? "active" : ""
                                } ${state.session ? "logged-in" : ""}`}
                        />
                    </div>

                    {/* ATM Screen Shell */}
                    <div className="atm-screen-shell">
                        <div className="atm-screen">
                        {state.mode === "welcome" && (
                            <div className="screen-state screen-welcome">
                            <p>Welcome to the ATM</p>
                            <p className="screen-sub">Touch the screen to begin.</p>
                            <div className="screen-link right row-3">Enter PIN</div>
                            </div>
                        )}
                        {state.mode === "pin" && (
                            <div className="screen-state screen-pin">
                            <p>Welcome to the ATM</p>
                            <p className="screen-sub">Please enter your 4-digit PIN.</p>
                            <label htmlFor="pin" className="pin-input-row">
                                <span>PIN</span>
                                <input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={state.pin}
                                onChange={(event) =>
                                    dispatch({ type: "SET_PIN", payload: event.target.value })
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                    void handleLogin();
                                    }
                                }}
                                placeholder="Enter PIN"
                                />
                            </label>
                            <div className="screen-link right row-3">Enter</div>
                            <p className="screen-hint">Demo PIN: 1234</p>
                            </div>
                        )}

                        {state.mode === "menu" && state.session && (
                            <div className="screen-state screen-menu">
                            <p>Hi {state.session.userName}!</p>
                            <p>Please make a choice...</p>
                            <div className="screen-link right row-1">Exit</div>
                            <div className="screen-link left row-2">Withdraw</div>
                            <div className="screen-link right row-2">Balance</div>
                            <div className="screen-link left row-3">Deposit</div>
                            <div className="screen-link right row-3">Re-Enter PIN</div>
                            </div>
                        )}

                        {state.mode === "balance" && state.session && (
                            <div className="screen-state screen-balance">
                            <p>Current Balance</p>
                            <p className="money">
                                {state.session.balance}
                            </p>
                            <p className="screen-sub">Press Back for menu.</p>
                            <div className="screen-link right row-3">Back</div>
                            </div>
                        )}

                        {(state.mode === "deposit" || state.mode === "withdraw") &&
                            state.session && (
                            <div className="screen-state screen-action">
                                <p>
                                {state.mode === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
                                </p>
                                <label htmlFor="amount" className="amount-row">
                                <span>Amount</span>
                                <input
                                    id="amount"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.01"
                                    value={state.amount}
                                    onChange={(event) =>
                                    dispatch({ type: "SET_AMOUNT", payload: event.target.value })
                                    }
                                    onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        void handleTransaction(state.mode);
                                    }
                                    }}
                                    placeholder="20.00"
                                />
                                </label>
                                <p className="screen-sub">
                                Available: {state.session.balance}
                                </p>
                                <div className="screen-link left row-3">Confirm</div>
                                <div className="screen-link right row-3">Cancel</div>
                            </div>
                            )}

                        {state.errorText && <p className="screen-error">{state.errorText}</p>}
                        {state.statusText && !state.errorText && (
                            <p className="screen-status">{state.statusText}</p>
                        )}
                        {state.loading && <p className="screen-loading">Processing...</p>}
                        </div>
                     </div>
                    
                    {/* Side buttons  */}
                    <img src="/assets/systems.png" alt="Systems mark" className="systems-logo" />
                    <img src="/assets/sticker_graf.png" alt="Sticker graffiti" className="sticker" />

                    <div className="side-buttons left">
                        {leftButtons.map((button, index) => (
                        <button
                            key={`left-${index}`}
                            type="button"
                            className="side-button"
                            onClick={button.onClick}
                            disabled={!button.onClick || state.loading}
                            aria-label={button.label || `left-button-${index + 1}`}
                        />
                        ))}
                    </div>

                  

                    <div className="side-buttons right">
                        {rightButtons.map((button, index) => (
                        <button
                            key={`right-${index}`}
                            type="button"
                            className="side-button"
                            onClick={button.onClick}
                            disabled={!button.onClick || state.loading}
                            aria-label={button.label || `right-button-${index + 1}`}
                        />
                        ))}
                    </div>
                </div>                
            </section>
        </main>
        
        );
}
