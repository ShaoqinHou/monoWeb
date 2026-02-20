# Stub Features

These files contain stub implementations — they render UI but use hardcoded or mock data.
They are clearly marked with `// @stub` comments at the top of the file.

Find all stubs: `grep -r "@stub" src/ --include="*.tsx" --include="*.ts"`

## Current Stubs

| File | Reason |
|------|--------|
| `features/settings/routes/PaymentServicesPage.tsx` | Fake payment gateway toggles. No real Stripe/PayPal OAuth. |
| `features/settings/routes/ConnectedAppsPage.tsx` | Hardcoded 5 apps with toggles. No real OAuth integrations. |
| `components/layout/OrgSwitcher.tsx` | 3 hardcoded orgs, only 1 unlocked. No multi-org backend. |
| `features/bank/components/BankFeedSetup.tsx` | CSV upload only. No Plaid/Yodlee live bank feeds. |

## When to Unstub

A stub becomes a real feature when:
1. Backend API exists for the data
2. Real integration is wired (OAuth, bank feed provider, etc.)
3. The `@stub` comment is removed
