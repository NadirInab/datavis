# Stripe Testing Guide

## Setup for Local Development

### 1. Install Stripe CLI

Download and install the Stripe CLI from: https://stripe.com/docs/stripe-cli

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks to Your Local Server

```bash
stripe listen --forward-to http://localhost:5000/api/v1/webhooks/stripe
```

This will output a webhook signing secret. Add this to your `.env` file:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Test Cards

Use these test card numbers to simulate different payment scenarios:

| Card Number         | Scenario                |
|---------------------|-------------------------|
| 4242 4242 4242 4242 | Successful payment      |
| 4000 0000 0000 0002 | Card declined           |
| 4000 0000 0000 9995 | Insufficient funds      |
| 4000 0000 0000 3220 | 3D Secure 2 required    |
| 4000 0027 6000 3184 | 3D Secure 2 (Frictionless) |

Use any future expiration date, any 3-digit CVC, and any postal code.

## Testing Subscription Lifecycle

### 1. Create a Subscription

1. Sign up or log in to your application
2. Navigate to the subscription page
3. Select a plan and billing cycle
4. Use test card `4242 4242 4242 4242` for successful payment

### 2. Test Subscription Webhook Events

Use the Stripe CLI to trigger test webhook events:

```bash
# Simulate successful payment
stripe trigger invoice.payment_succeeded

# Simulate failed payment
stripe trigger invoice.payment_failed

# Simulate subscription update
stripe trigger customer.subscription.updated

# Simulate subscription cancellation
stripe trigger customer.subscription.deleted
```

### 3. Test Subscription Cancellation

1. Log in to your application
2. Navigate to subscription management
3. Cancel your subscription
4. Verify the cancellation is reflected in both your database and Stripe

## Verifying Integration

### Database Checks

After creating a subscription, verify these records exist:

1. User document has updated subscription tier
2. UserSubscription document is created with correct status
3. Payment record is created for the transaction

### Stripe Dashboard Checks

In the Stripe dashboard (test mode), verify:

1. Customer is created with correct metadata
2. Subscription is created with correct plan
3. Payment is recorded correctly

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Ensure STRIPE_WEBHOOK_SECRET is correct
   - Check that you're using the raw request body

2. **Subscription Not Found in Database**
   - Check that metadata is correctly set when creating subscriptions
   - Verify customer ID mapping is correct

3. **Payment Succeeded but Subscription Not Activated**
   - Check webhook handling for invoice.payment_succeeded
   - Verify database updates are working correctly

### Debugging Tools

1. **Stripe CLI logs**
   ```bash
   stripe listen --log-level debug
   ```

2. **Stripe Dashboard Events**
   - Check Events tab in Stripe Dashboard for detailed event logs

3. **Application Logs**
   - Monitor your application logs during subscription operations