## ATM App Demo 

This is an ATM-liked demo web app built with next.js and react with mocking service. Features included UI updates according to state changes, fetching data from backend through API (mock), session & state management (browser cookies and demo sessions). 


## Installation and run
1. Ensure Node.js 18.17+ (or Node 20+) is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Tech stack
- Next.js (App Router)
- React + TypeScript
- React hooks + `useReducer` for state management
- Next.js Route Handlers as mocked backend APIs

## Project structure
- `app/page.tsx` - main ATM screen
- `app/AtmScreen.tsx` - ATM UI + flow logic + reducer state management
- `app/api/atm/*` - mock backend endpoints
- `lib/mockBank.ts` - in-memory account/session store and business rules
- `lib/apiClient.ts` - frontend API client


