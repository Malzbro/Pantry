# Stripe Setup Guide

All steps below use **test mode**. When going live, replace every `sk_test_`, `whsec_`, and `price_` with their live-mode equivalents. The code stays the same — only env vars change.

## 1. Create a Stripe account

Sign up at [stripe.com](https://stripe.com). UK signup. Test mode is available immediately without business verification.

## 2. Create the product and prices

1. Go to **Products → Add product**
2. Name: **Pantry Premium**
3. Description: "Unlimited plans, pantry tracking, receipt scanning, multi-household"
4. Add two prices:
   - **£5.99 GBP / month** (recurring, monthly) — copy the `price_...` ID
   - **£39.00 GBP / year** (recurring, yearly) — copy the `price_...` ID

## 3. Configure the Customer Portal

1. Go to **Settings → Billing → Customer Portal**
2. Enable the portal
3. Allow customers to:
   - Switch plans (both prices on the same product)
   - Update payment methods
   - Cancel subscriptions

## 4. Create the webhook endpoint

### Production

1. Go to **Developers → Webhooks → Add endpoint**
2. URL: `https://<your-railway-url>/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret (`whsec_...`)

### Local development

1. Install the Stripe CLI: `brew install stripe/stripe-cli/stripe` (macOS) or [download from Stripe](https://stripe.com/docs/stripe-cli)
2. Log in: `stripe login` (one-time)
3. Forward webhooks to localhost:
   ```
   stripe listen --forward-to http://localhost:8000/webhooks/stripe
   ```
4. Copy the `whsec_...` output and put it in your `.env` as `STRIPE_WEBHOOK_SECRET`

## 5. Environment variables

Add to your backend `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
FRONTEND_URL=http://localhost:3000
```

## 6. Test cards

| Card number            | Scenario           |
|------------------------|--------------------|
| `4242 4242 4242 4242`  | Success            |
| `4000 0000 0000 9995`  | Insufficient funds |

Use any future expiry date, any CVC, any postcode.

## 7. Verify end-to-end

1. Start the backend: `uvicorn main:app --reload`
2. Start the Stripe CLI listener: `stripe listen --forward-to http://localhost:8000/webhooks/stripe`
3. Start the frontend: `npm run dev`
4. Go to `/pricing`, click "Subscribe monthly", complete checkout with a test card
5. You should land on `/billing/success`
6. Verify the profile row updated:
   ```sql
   SELECT stripe_customer_id, subscription_tier, subscription_status
   FROM profiles WHERE id = '<your-user-id>';
   ```

## 8. Going live

1. Complete Stripe business verification
2. Create the same product and prices in live mode (new `price_` IDs)
3. Add a live webhook endpoint (new `whsec_`)
4. Swap env vars: `sk_test_` → `sk_live_`, test `price_` → live `price_`, test `whsec_` → live `whsec_`
5. Enable Stripe Tax for UK VAT (separate launch-prep task)
