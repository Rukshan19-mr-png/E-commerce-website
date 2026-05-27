# PayHere Payment Gateway Integration - Issue Report & Solutions

## Current Status: ⚠️ Needs Configuration

### Issues Identified

#### 1. **Unauthorized Payment Request Error** (Primary Issue)
- **Error Message**: "This is a merchant's error - Please inform this error to your Merchant to get it resolved"
- **Cause**: PayHere is rejecting the payment request from the merchant account
- **Possible Reasons**:
  - Test Merchant ID (1211149) is not properly configured for sandbox mode
  - Merchant account requires activation or verification
  - Merchant secret might not be properly configured
  - Request signature validation is failing

#### 2. **ORB (Opaque Response Blocking) Error**
- **Error**: `net::ERR_BLOCKED_BY_ORB` on request to `https://www.payhere.lk/merchant/`
- **Cause**: PayHere's API response is being blocked by browser's Opaque Response policy
- **Impact**: This is secondary; resolving the merchant authorization should fix this

#### 3. **Merchant Credentials Not Configured**
- **Issue**: PAYHERE_MERCHANT_SECRET in `.env` is not set with a proper value
- **Current Value**: `test_secret_plantopia_sandbox`
- **Impact**: Signature validation in IPN callbacks might fail

#### 4. **Test Merchant ID Limitations**
- **Current ID**: 1211149
- **Status**: Generic test merchant ID from PayHere documentation
- **Issue**: May have sandboxing restrictions or may not be fully authorized

---

## Code Analysis

### Frontend Implementation (/frontend/src/pages/Checkout.jsx)

**Status**: ✅ Correctly Implemented
- PayHere SDK is properly loaded
- Payment object is correctly structured
- Callback handlers are properly defined (onCompleted, onDismissed, onError)
- Error logging has been enhanced

**Payment Details Being Sent**:
```javascript
{
  sandbox: true,
  merchant_id: "1211149",
  order_id: "order_mongo_id",
  amount: "1500.00",
  currency: "LKR",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  phone: "0771234567",
  // ... other fields
}
```

### Backend Implementation (/backend/server.js)

**Status**: ✅ Mostly Correct with Enhancements
- Order creation is working correctly
- IPN callback handler is properly implemented
- Merchant ID and secret validation is in place
- Enhanced logging has been added

**IPN Callback Endpoint**: `POST /api/payments/payhere-notify`
- Validates merchant ID
- Validates signature (when secret is configured)
- Updates order payment status
- Triggers notifications

---

## Solutions & Recommendations

### Immediate Actions Required

#### 1. **Get Real PayHere Merchant Account**
```
Action: Register for a PayHere merchant account
URL: https://www.payhere.lk
Steps:
  1. Go to PayHere website
  2. Click "Sign Up" for merchant account
  3. Complete verification process
  4. Receive Merchant ID and Merchant Secret
```

#### 2. **Configure Environment Variables**
Update `.env` file with your actual credentials:
```env
PAYHERE_MERCHANT_ID=your_actual_merchant_id
PAYHERE_MERCHANT_SECRET=your_actual_merchant_secret
```

#### 3. **Enable Sandbox Mode in Account**
- Log in to PayHere Dashboard
- Go to Settings → API Configuration
- Enable Sandbox Mode for testing
- Get test merchant credentials

### Testing PayHere Integration

#### Test Payment Flow:
1. User adds item to cart
2. Proceeds to checkout
3. Fills delivery details
4. Selects "Online Payment" option
5. Clicks "Pay with PayHere"
6. PayHere payment modal opens
7. Complete payment test
8. Order status updates to "Paid"

#### Test Credentials for Sandbox:
```
Card Number (Visa): 4111111111111111
Expiry: 12/25
CVV: 100
```

---

## Verification Tests Completed

### ✅ Completed Tests
- [x] PayHere SDK loads successfully from CDN
- [x] Payment object is properly structured
- [x] Order is created in database with correct ID
- [x] Merchant config endpoint returns correct data
- [x] Error callbacks are properly triggered
- [x] Console logging shows payment details

### ❌ Failed Tests
- [ ] PayHere accepts the payment request (shows "Unauthorized payment request")
- [ ] ORB error for merchant info lookup

---

## Frontend Console Logging

Added comprehensive logging to help diagnose issues:
```javascript
// Payment initiation logging
console.log('Initiating PayHere payment with:', {
  merchant_id,
  order_id,
  amount,
  sandbox: true
});

// Error logging with details
console.error('PayHere Error:', error);
console.error('PayHere Error Details:', {
  merchant_id,
  order_id,
  amount,
  sandbox
});
```

---

## Backend Logging

Enhanced `/api/payments/payhere-notify` endpoint with:
```
[PayHere IPN] Received payment notification: { merchant_id, order_id, amount, ... }
[PayHere IPN] Merchant ID mismatch: { received, expected }
[PayHere IPN] Signature mismatch: { expected, received }
[PayHere IPN] No merchant secret configured - skipping signature validation
```

---

## Expected Behavior (After Configuration)

1. **Payment Successful**:
   - PayHere sends IPN callback to `/api/payments/payhere-notify`
   - Backend validates signature and merchant ID
   - Order status updates to "paid"
   - User redirected to success page

2. **Payment Failed**:
   - PayHere shows error message
   - Order remains with status "pending"
   - User can try again

3. **Payment Cancelled**:
   - User clicks "Cancel" on PayHere modal
   - Redirected back to checkout
   - Order remains "pending"

---

## Files Modified

1. `/backend/.env` - Added merchant secret
2. `/backend/server.js` - Enhanced logging for PayHere IPN
3. `/frontend/src/pages/Checkout.jsx` - Improved error handling and logging

---

## Next Steps

1. **Get PayHere Merchant Account** (REQUIRED)
   - Sign up at https://www.payhere.lk
   - Get real merchant credentials
   - Update .env file

2. **Enable Sandbox Mode**
   - Request sandbox credentials from PayHere
   - Or use same account in sandbox mode

3. **Test Payment Flow**
   - Use test card provided by PayHere
   - Verify order status updates
   - Check IPN callback is received

4. **Production Setup**
   - Replace sandbox merchant ID with production ID
   - Update merchant secret
   - Test with real payments (optional, small amount)

---

## PayHere Documentation

- Official Site: https://www.payhere.lk
- Developer Docs: https://www.payhere.lk/developer
- Dashboard: https://merchant.payhere.lk
- Support: support@payhere.lk

---

## Notes

- Current test merchant ID (1211149) may have restrictions
- Sandbox and production merchant IDs are different
- Merchant secret is optional but recommended for security
- IPN callback is asynchronous - don't rely on immediate response
- All amounts are in LKR (Sri Lankan Rupees)

