<div align="center">

# 💰 BudgetCo

**AI-powered personal finance tracker that turns receipts, voice notes, and manual entries into structured financial insights.**

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-3.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)]()

[Insert Screenshot/GIF Here]

</div>

---

## 📖 Overview & Problem Statement

Most personal finance apps demand tedious manual data entry, leading to low adoption and incomplete financial records. Users abandon budgeting workflows because logging every transaction is friction-heavy.

**BudgetCo** solves this by providing three AI-powered input methods — **receipt scanning** (camera → Gemini Vision), **voice logging** (microphone → Gemini Audio), and manual entry — that automatically extract, categorize, and persist transactions with zero friction. The app provides real-time budget tracking with automated email alerts, an AI assistant for querying spending patterns in natural language, and CSV export for portability.

### Who is this for?

- Individuals who want to track personal finances without spreadsheet overhead
- Users who prefer speaking or snapping over typing
- Anyone who needs multi-account, multi-currency budget management on mobile

---

## ⚙️ How It Works (Under the Hood)

### System Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Expo/RN)                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │  Camera   │  │   Mic    │  │  Manual  │  ← Input Methods    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       │ base64       │ base64      │ form                      │
│       ▼              ▼             │                            │
│  ┌─────────────────────────┐       │                            │
│  │   Gemini 3.5 Flash Lite │       │  ← Structured Extraction  │
│  │   (Vision / Audio API)  │       │    via JSON Schema         │
│  └──────────┬──────────────┘       │                            │
│             │ ExtractedTransaction │                            │
│             ▼                      ▼                            │
│       ┌────────────────────────────────┐                       │
│       │   React Hook Form + Zod        │  ← Validation Layer   │
│       └───────────────┬────────────────┘                       │
│                       │                                         │
│                       ▼                                         │
│       ┌────────────────────────────────┐                       │
│       │  TanStack Query Mutation       │  ← Optimistic Cache   │
│       │  (useCreateTransaction)        │    Invalidation        │
│       └───────────────┬────────────────┘                       │
│                       │ Clerk JWT                               │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                       │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐ │
│  │  users    │  │ transactions │  │ accounts │  │ budgets  │ │
│  └──────────┘  └──────────────┘  └──────────┘  └──────────┘ │
│        ↑              ↑                              ↑        │
│        │         RLS Policies                        │        │
│        │        (auth.jwt()->>'sub')                 │        │
│        │                                             │        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Supabase Edge Functions (Deno)              │ │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐  │ │
│  │  │ check-budget-alerts │  │     weekly-tips           │  │ │
│  │  │ (Daily cron)        │  │     (Weekly cron)         │  │ │
│  │  │ → Resend emails     │  │     → Gemini → Resend     │  │ │
│  │  └─────────────────────┘  └──────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Step-by-Step User Journey

1. **Authentication** — User signs up/in via Clerk (email + password with MFA support). Clerk issues a JWT.
2. **User Sync** — `useUserSync` hook checks Supabase for the user record. On first login, it upserts the user row and creates a default "Cash" account.
3. **Onboarding** — First-time users select a currency and enter a starting balance. The Zustand `userStore` tracks onboarding state to gate navigation.
4. **Adding Transactions** — Three input paths converge on the same form:
   - **Receipt Scan**: Camera captures image → base64-encoded → sent to Gemini 3.5 Flash Lite Vision with a structured JSON schema → auto-fills amount, category, description, date.
   - **Voice Entry**: Microphone records audio → base64-encoded → sent to Gemini 3.5 Flash Lite Audio → transcribes + extracts transaction fields.
   - **Manual**: User fills the form directly.
5. **Persistence** — `createTransaction` service inserts the row, then fetches and updates the linked account balance in two sequential calls. TanStack Query mutations invalidate both `["transactions"]` and `["accounts"]` query keys.
6. **Dashboard** — Home screen aggregates: total balance across accounts, monthly income/expense split, category-wise pie chart breakdown, budget progress bar, and last 5 transactions.
7. **AI Assistant** — User asks natural-language questions. The app builds a context string from the last 30 days of transactions + budget, sends it as a prompt to Gemini, and streams the answer into a chat UI.
8. **Background Jobs** — Two Supabase Edge Functions run on cron schedules:
   - `check-budget-alerts`: Daily — emails users at 80% and 100% budget thresholds via Resend.
   - `weekly-tips`: Weekly — generates personalized saving tips via Gemini and emails a formatted recap.

---

## ✨ Key Features

- **AI Receipt Scanner** — Point camera at any receipt; Gemini Vision extracts amount, merchant, category, and date via structured JSON output
- **Voice Transaction Logging** — Speak a transaction naturally ("Spent 400 on groceries yesterday"); Gemini Audio transcribes and extracts structured fields
- **AI Financial Assistant** — Chat interface that answers questions about spending patterns, budget status, and category breakdowns using real transaction data
- **Multi-Account Management** — Support for Cash, Bank, Credit Card, and Savings accounts with per-account balance tracking and default account selection
- **Multi-Currency Support** — Full currency picker with 150+ currencies; locale-aware formatting via `Intl.NumberFormat`
- **Monthly Budget Tracking** — Set a spending limit, see a real-time progress bar with color-coded thresholds (green → yellow → red)
- **Automated Budget Alerts** — Server-side cron job emails users when spending hits 80% and 100% of their monthly budget (once per threshold per month)
- **AI-Powered Weekly Email Recaps** — Gemini-generated personalized saving tips based on the past week's spending, delivered via Resend
- **Interactive Data Visualizations** — Donut chart for expense breakdown, grouped bar chart for daily income vs. expense trends
- **Transaction Search & Filtering** — Filter by type (Income/Expense), account, and free-text search across descriptions and categories
- **CSV Export** — One-tap export of last 30 days of transactions to a shareable CSV file
- **Form Validation** — Every form uses Zod schemas with React Hook Form for type-safe, declarative validation
- **Platform-Adaptive Navigation** — Native iOS tab bar (`NativeTabs` with SF Symbols) with JS-based fallback for Android

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81 + Expo SDK 54 (New Architecture enabled) |
| **Language** | TypeScript 5.9 (strict mode) |
| **Navigation** | Expo Router v6 (file-based routing, typed routes) |
| **Styling** | NativeWind v4 (TailwindCSS) + StyleSheet |
| **State Management** | Zustand (client state) + TanStack Query v5 (server state) |
| **Forms** | React Hook Form v7 + Zod v4 (validation schemas) |
| **Authentication** | Clerk (email/password, MFA, email verification, secure token cache) |
| **Database** | Supabase PostgreSQL (Row-Level Security via Clerk JWT) |
| **AI/ML** | Google Gemini 3.5 Flash Lite (Vision, Audio, Text generation) |
| **Edge Functions** | Supabase Edge Functions (Deno runtime) |
| **Email** | Resend API (transactional emails with custom HTML templates) |
| **Charts** | react-native-gifted-charts (PieChart, BarChart) |
| **Camera** | expo-camera + expo-image-picker |
| **Audio** | expo-audio (voice recording) |
| **Animations** | react-native-reanimated v4 |
| **Linting** | ESLint with expo config |

---

## 🏗️ Architecture & Design Decisions

### Folder Structure

```
budgetco/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root: Clerk + QueryClient + GestureHandler providers
│   ├── index.tsx                 # Auth gate — redirects based on sign-in state
│   ├── (auth)/                   # Unauthenticated routes
│   │   ├── _layout.tsx           # Stack with headerShown: false
│   │   ├── sign-in.tsx           # Email/password + MFA verification
│   │   └── sign-up.tsx           # Registration with email code verification
│   └── (root)/                   # Authenticated routes
│       ├── _layout.tsx           # User sync + onboarding gate
│       ├── onboarding.tsx        # Currency + starting balance setup
│       └── (tabs)/               # Bottom tab navigator
│           ├── _layout.tsx       # Native iOS tabs / JS Android fallback
│           ├── index.tsx         # Dashboard (balance, charts, quick actions)
│           ├── transactions.tsx  # List + search + filter + bar chart + CSV export
│           ├── add-transaction.tsx # Form + receipt scanner + voice recorder
│           ├── assistant.tsx     # AI chat interface
│           └── profile.tsx       # Account management + preferences
├── components/                   # Reusable UI components
├── constants/                    # Categories config, theme tokens
├── hooks/
│   ├── queries/                  # TanStack Query hooks (read operations)
│   ├── mutations/                # TanStack Query hooks (write operations)
│   ├── useSupabase.ts            # Clerk-authenticated Supabase client factory
│   └── useUserSync.ts           # First-login user provisioning
├── lib/
│   ├── query/                    # QueryClient config + query key factory
│   ├── schemas/                  # Zod validation schemas (auth, transaction, onboarding)
│   ├── services/                 # Data access layer (accounts, transactions, budgets, AI)
│   ├── supabase.ts               # Supabase client + Clerk JWT integration
│   └── utils/                    # Formatters, CSV export utility
├── store/                        # Zustand stores (currency, onboarding state)
├── types/                        # Shared TypeScript interfaces
└── supabase/
    └── functions/                # Edge Functions (Deno)
        ├── _shared/              # Shared modules (email template, Resend client, admin client)
        ├── check-budget-alerts/  # Daily budget threshold alerting
        └── weekly-tips/          # Weekly AI-generated financial tips
```

### Design Patterns & Principles

| Pattern | Implementation |
|---|---|
| **Service Layer** | `lib/services/` encapsulates all Supabase queries, separating data access from UI. Each service accepts a `SupabaseClient` instance — no global imports, fully testable. |
| **Query/Mutation Separation** | Read operations in `hooks/queries/`, writes in `hooks/mutations/`. Each mutation auto-invalidates related query keys for cache consistency. |
| **Schema-Driven Validation** | Zod schemas in `lib/schemas/` are the single source of truth for both runtime validation and TypeScript type inference (`z.infer<>`). |
| **Provider Composition** | Root layout composes `GestureHandlerRootView` → `QueryClientProvider` → `ClerkProvider`, establishing a clean dependency hierarchy. |
| **Dependency Injection** | `useSupabase()` hook creates a Clerk-authenticated Supabase client via closure over `getToken()`. Services receive the client as a parameter rather than importing a singleton. |
| **Structured AI Output** | Gemini calls use `responseSchema` with JSON mode to guarantee typed, parseable output — eliminating fragile regex/text parsing of LLM responses. |
| **Two-Phase Deletion** | `deleteAccount` first counts linked transactions (dry run), then requires explicit `force: true` to cascade — preventing accidental data loss. |
| **Threshold-Based Alerting** | Budget alerts track `last_alert_threshold` per row to ensure each threshold (80%, 100%) fires exactly once per calendar month, even if the cron runs multiple times. |

### Database Schema

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
│    users     │       │   accounts      │       │   budgets    │
├──────────────┤       ├─────────────────┤       ├──────────────┤
│ clerk_id PK  │───┐   │ id PK (uuid)    │       │ id PK (uuid) │
│ email        │   │   │ user_id FK      │───┐   │ user_id FK   │
│ name         │   ├──▶│ name            │   │   │ amount       │
│ image_url    │   │   │ type (enum)     │   │   │ last_alert_  │
│ currency     │   │   │ balance         │   │   │   sent       │
│ created_at   │   │   │ is_default      │   │   │ last_alert_  │
└──────────────┘   │   │ created_at      │   │   │   threshold  │
                   │   └─────────────────┘   │   │ created_at   │
                   │                         │   │ updated_at   │
                   │   ┌─────────────────┐   │   └──────────────┘
                   │   │  transactions   │   │
                   │   ├─────────────────┤   │
                   │   │ id PK (uuid)    │   │
                   └──▶│ user_id FK      │   │
                       │ account_id FK   │◀──┘
                       │ type (enum)     │
                       │ amount          │
                       │ category (enum) │
                       │ description     │
                       │ date            │
                       │ status          │
                       │ input_method    │
                       │ voice_transcript│
                       │ is_flagged      │
                       │ flag_reason     │
                       │ created_at      │
                       │ updated_at      │
                       └─────────────────┘
```

**Row-Level Security**: All tables enforce RLS. The Supabase client embeds the Clerk JWT, and policies filter rows using `auth.jwt()->>'sub'` to match `user_id`, ensuring complete tenant isolation.

---

## 🚀 Installation & Local Setup

### Prerequisites

- Node.js ≥ 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- [Expo Go](https://expo.dev/go) app on your device (for quick testing)
- Supabase project ([supabase.com](https://supabase.com))
- Clerk application ([clerk.com](https://clerk.com))
- Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/budgetco.git
cd budgetco

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in the values (see template below)

# 4. Start the development server
npx expo start

# 5. Scan the QR code with Expo Go (iOS/Android) or press 'a' for Android emulator
```

### Environment Variables (`.env.example`)

```bash
# Clerk — Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase — Database & Edge Functions
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJ...                              # anon/public key

# Google Gemini — AI features (receipt scan, voice, assistant)
EXPO_PUBLIC_GEMINI_API_KEY=AIza...

# ── Edge Function Secrets (set via Supabase Dashboard → Secrets) ──
# SUPABASE_URL=https://<project-ref>.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# GEMINI_API_KEY=AIza...
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL=alerts@yourdomain.com
# EMAIL_LOGO_URL=https://<project-ref>.supabase.co/storage/v1/object/public/email-assets/logo.png
```

### Supabase Setup

1. Create the `users`, `accounts`, `transactions`, and `budgets` tables matching the schema above.
2. Enable Row-Level Security on all tables and add policies using `auth.jwt()->>'sub'`.
3. Deploy edge functions:
   ```bash
   supabase functions deploy check-budget-alerts
   supabase functions deploy weekly-tips
   ```
4. Set up cron jobs in the Supabase Dashboard (Database → Extensions → `pg_cron`).

---

## 📡 API Reference

BudgetCo uses the **Supabase JavaScript client** as its data access layer rather than a custom REST API. All operations execute via the Supabase PostgREST interface with Clerk JWT authentication.

### Service Layer Functions

| Service | Function | Description |
|---|---|---|
| **Transactions** | `getTransactions(supabase, userId, filters?)` | Fetch all transactions with optional type/account filters, ordered by date descending |
| **Transactions** | `createTransaction(supabase, payload)` | Insert transaction + adjust linked account balance |
| **Transactions** | `deleteTransaction(supabase, txId, accountId, amount, type)` | Delete transaction + reverse account balance delta |
| **Accounts** | `getAccounts(supabase, userId)` | Fetch all accounts, defaults first |
| **Accounts** | `createAccount(supabase, userId, {name, type})` | Create a new financial account |
| **Accounts** | `setDefaultAccount(supabase, userId, accountId)` | Unset all defaults, then set target as default |
| **Accounts** | `updateAccount(supabase, accountId, {name, type})` | Update account metadata |
| **Accounts** | `deleteAccount(supabase, accountId, {force?})` | Dry-run (count linked txns) or force-delete with cascade |
| **Budgets** | `getBudget(supabase, userId)` | Fetch the user's monthly budget (single row) |
| **Budgets** | `upsertBudget(supabase, userId, amount)` | Create or update the monthly budget (upsert on `user_id`) |
| **Assistant** | `askAssistant(question, transactions, budget, currency)` | Build financial context → prompt Gemini → return natural-language answer |
| **Extraction** | `extractTransactionFromReceipt(base64, mimeType)` | Send receipt image to Gemini Vision → structured `ExtractedTransaction` |
| **Extraction** | `extractTransactionFromVoice(base64, mimeType)` | Send audio to Gemini Audio → transcription + structured `ExtractedTransaction` |

### Supabase Edge Functions

| Endpoint | Schedule | Description |
|---|---|---|
| `POST /functions/v1/check-budget-alerts` | Daily (cron) | Checks monthly spend vs. budget for all users; emails at 80%/100% thresholds via Resend |
| `POST /functions/v1/weekly-tips` | Weekly (cron) | Generates personalized saving tips via Gemini; emails weekly recap with income/expense summary |

---

## 🧗 Challenges Faced & Learnings

### Challenge: Clerk ↔ Supabase JWT Integration

**Problem**: Clerk manages authentication and issues its own JWTs, while Supabase expects its native `auth.uid()` for Row-Level Security. These two auth systems don't share identity out of the box.

**Solution**: Implemented a custom `createClerkSupabaseClient()` factory that injects the Clerk JWT into every Supabase request via the `accessToken` option. On the Supabase side, RLS policies use `auth.jwt()->>'sub'` (the Clerk user ID) instead of `auth.uid()` to match rows. This approach preserves full RLS enforcement while keeping Clerk as the single source of truth for auth.

**Takeaway**: When bridging two auth systems, the key is to identify the common identity claim (`sub`) and ensure both systems resolve it consistently. This pattern is portable to any third-party auth provider + Supabase combination.

### Challenge: Structured AI Output Without Post-Processing

**Problem**: LLM responses are inherently unstructured text. Parsing transaction fields from free-form Gemini output via regex or string splitting was unreliable — amounts could appear in different formats, categories might not match the app's enum, and dates could be ambiguous.

**Solution**: Leveraged Gemini's `responseSchema` parameter with `responseMimeType: "application/json"` to constrain the model's output to a strict JSON schema matching the `ExtractedTransaction` type. The schema includes explicit `enum` constraints for `type` and `category`, ensuring the output is directly parseable with `JSON.parse()` — zero post-processing.

**Takeaway**: Structured output from LLMs (via JSON mode / function calling) is drastically more reliable than parsing free text. Define your schema upfront and let the model conform to it rather than building fragile parsing logic.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with precision, not just passion.**

If this project resonated with you, consider giving it a ⭐

</div>
