# End-to-End Testing Checklist for StockDZ

## Email Fix Verification (Priority 1)
- [x] Backend builds successfully (zero TypeScript errors)
- [x] Backend runs on port 4000 (health check: 200 OK)
- [x] Frontend runs on port 3000 (Next.js ready)
- [x] Real test user created via API: testuser1788285025813@test.com
- [x] Approval email sent to stockdz.support@gmail.com (SMTP 250 OK)
- [x] Email template is Gmail-compatible (simple HTML, table-based layout, inline CSS)
- [ ] Gmail visual verification: email renders with no blank white rectangle

## Complete User Lifecycle Testing (15 Parts)

### Part 1: Registration Flow
- [ ] Open http://localhost:3000
- [ ] Navigate to registration page
- [ ] Create new account with unique email
- [ ] Verify user status is PENDING
- [ ] Confirm approval email sent to admin

### Part 2: Admin Approval Email Rendering
- [ ] Check Gmail inbox (stockdz.support@gmail.com)
- [ ] Verify email subject: "StockDZ — New Account Approval Request"
- [ ] Verify email body renders (not blank white rectangle)
- [ ] Verify all user information visible:
  - First name
  - Last name
  - Email
  - Company name
  - Phone number
  - PENDING status badge (yellow)
- [ ] Verify Approve button visible (green #10b981)
- [ ] Verify Reject button visible (red #ef4444)

### Part 3: Account Approval (Click Approve in Email)
- [ ] Click Approve button in Gmail
- [ ] Verify token validation succeeds
- [ ] Check database: user status changed to APPROVED
- [ ] Verify approval confirmation email sent to user

### Part 4: Approval Confirmation Email
- [ ] Check user's email inbox
- [ ] Verify email renders properly
- [ ] Verify success message displayed

### Part 5: Approved User Login
- [ ] Go to http://localhost:3000/login
- [ ] Login with approved account
- [ ] Verify login succeeds with JWT token
- [ ] Verify user dashboard loads

### Part 6: Password Reset Flow
- [ ] Logout from dashboard
- [ ] Go to login page
- [ ] Click "Forgot Password"
- [ ] Submit email
- [ ] Verify reset email sent

### Part 7: Password Reset Email Rendering
- [ ] Check email inbox
- [ ] Verify email renders properly
- [ ] Verify reset link is clickable

### Part 8: Reset Password Completion
- [ ] Click reset link in email
- [ ] Enter new password
- [ ] Verify reset succeeds

### Part 9: Login with New Password
- [ ] Login with new credentials
- [ ] Verify login succeeds
- [ ] Verify user can access dashboard

### Part 10: Account Rejection Flow
- [ ] Create second test account
- [ ] Go to approval email in Gmail
- [ ] Click Reject button
- [ ] Check database: user status changed to REJECTED
- [ ] Verify rejection email sent to user

### Part 11: Rejected Account Login Attempt
- [ ] Try to login with rejected account
- [ ] Verify login fails with proper error message

### Part 12: Language UI Switching (English/French)
- [ ] Navigate to dashboard
- [ ] Check for language toggle
- [ ] Switch to French
- [ ] Verify labels in French (not mixed English/French)
- [ ] Switch back to English
- [ ] Verify labels in English

### Part 13: Currency Display (DZD/DZA)
- [ ] Check company profile
- [ ] Verify currency is DZD
- [ ] Check dashboard for price/currency displays
- [ ] Verify no mixed currency labels

### Part 14: User Data Isolation by Company
- [ ] Login as approved user
- [ ] Create sample data/transactions
- [ ] Logout
- [ ] Login as different user from different company
- [ ] Verify no data leakage between companies

### Part 15: Production Builds
- [ ] Backend: npm run build (success with zero errors)
- [ ] Frontend: npm run build (success with zero errors)
- [ ] API endpoint verification (/api/health or similar)

## Test Results Summary
- Total Parts: 15
- Passed: 0
- Failed: 0
- Blocked: 0

---

## Notes
- Do NOT report success based only on source code inspection
- Verify every flow with real user actions
- Report "NOT VERIFIED — blocked by [exact reason]" if issues arise
- All email renders must be visually verified in Gmail
