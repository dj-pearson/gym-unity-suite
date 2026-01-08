# Authentication Quick Start Guide
## Gym Unity Suite - Self-Hosted Supabase Setup

**Status:** ✅ Code Implementation Complete  
**Next Steps:** Configuration & Testing

---

## What Was Changed

### ✅ 1. Security Enhancements
- **New:** URL sanitization utilities to prevent open redirect attacks
- **Updated:** ProtectedRoute now safely handles redirect URLs
- **Location:** `src/lib/security/url-sanitization.ts`

### ✅ 2. Email Verification (OTP)
- **New:** Complete OTP verification component
- **Features:** 6-digit code input, resend with cooldown, user-friendly UI
- **Location:** `src/components/auth/OTPVerification.tsx`

### ✅ 3. Stronger Passwords
- **Changed:** Minimum password length increased from 8 to 12 characters
- **Required:** Special character now mandatory
- **Updated Files:**
  - `src/lib/security/password-policy.ts`
  - `src/components/auth/PasswordStrengthIndicator.tsx`
  - `src/lib/validation-schemas.ts`

### ✅ 4. OAuth Support (Google & Apple)
- **New:** OAuth buttons with proper branding
- **Features:** Callback URL handling, error management
- **Location:** `src/components/auth/LoginForm.tsx`

### ✅ 5. Enhanced Supabase Client
- **Added:** PKCE flow for better security
- **Added:** Session detection in URL for OAuth
- **Location:** `src/integrations/supabase/client.ts`

### ✅ 6. Improved Auth Context
- **New Methods:** `verifyOtp()`, `resendOtp()`
- **Enhanced:** Sign-up flow with email verification flag
- **Location:** `src/contexts/AuthContext.tsx`

---

## Next Steps for Deployment

### 1. Configure Email Service (Required for OTP)

Update your Supabase server environment variables:

```bash
# Email Service (Resend, SendGrid, or SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_SENDER_NAME=Rep Club
SMTP_SENDER_EMAIL=noreply@repclub.net

# Enable email confirmation
MAILER_AUTOCONFIRM=false
```

**Test Email Sending:**
```bash
# In Supabase dashboard or via API
# Send a test email to verify SMTP is working
```

### 2. Enable OAuth Providers (Optional)

#### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Gym Unity Suite"
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   ```
   https://api.repclub.net/auth/v1/callback
   https://repclub.net/auth
   ```
6. Copy Client ID and Secret
7. Add to Supabase environment:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### Apple OAuth Setup:

1. Go to [Apple Developer Console](https://developer.apple.com)
2. Create App ID: `com.repclub.app`
3. Enable "Sign in with Apple"
4. Create Service ID: `com.repclub.web`
5. Add return URL: `https://api.repclub.net/auth/v1/callback`
6. Download `.p8` key and convert to JWK
7. Add to Supabase environment:
   ```bash
   APPLE_CLIENT_ID=com.repclub.web
   APPLE_CLIENT_SECRET=generated-jwt-token
   ```

### 3. Update Frontend Environment Variables

**Cloudflare Pages** (or your hosting):

```bash
# Already configured (verify these are set)
VITE_SUPABASE_URL=https://api.repclub.net
VITE_SUPABASE_ANON_KEY=your-anon-jwt-key
VITE_SUPABASE_FUNCTIONS_URL=https://functions.repclub.net

# Add these if using OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APPLE_CLIENT_ID=com.repclub.web
```

### 4. Database Migrations (If Not Applied)

Run these SQL commands on your Supabase database:

```sql
-- Add onboarding flag to profiles (if not exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON profiles(onboarding_completed);

-- Verify RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure proper RLS policies exist
CREATE POLICY IF NOT EXISTS "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 5. Deploy Edge Function (If Not Deployed)

Your `setup-new-user` edge function needs to be deployed:

```bash
# Deploy the function
supabase functions deploy setup-new-user

# Or deploy all functions
supabase functions deploy
```

Make sure the function has access to these environment variables:
```bash
SUPABASE_URL=https://api.repclub.net
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Enable Sign-Up Form (When Ready)

Currently, the sign-up tab shows a "coming soon" message. When you're ready to launch:

**File:** `src/components/auth/LoginForm.tsx`

**Find:** Line ~464 (the commented-out sign-up form)

**Action:** Uncomment the form section between:
```typescript
{/* Uncomment this section to enable sign-up with password strength indicator */}
```
and
```typescript
{/* */}
```

This will enable:
- Email/password sign-up
- Real-time password strength indicator
- Confirm password field
- OAuth buttons for Google/Apple

---

## Testing Your Authentication

### Test Sign-Up Flow (After Enabling)

1. Navigate to `/auth`
2. Click "Sign Up" tab
3. Enter email and strong password (12+ chars, mixed case, number, special char)
4. Submit form
5. Check email for 6-digit OTP code
6. Enter OTP code on verification screen
7. Should redirect to `/dashboard` after verification

### Test Sign-In Flow

1. Navigate to `/auth`
2. Click "Sign In" tab
3. Enter credentials
4. Should redirect to intended page or `/dashboard`

### Test Rate Limiting

1. Try to sign in with wrong password 5 times
2. Should see account lockout message
3. Wait 15 minutes or clear localStorage
4. Try again

### Test Safe Redirects

1. Try: `/auth?redirect=https://evil.com`
2. After login, should go to `/dashboard` (not evil.com)
3. Try: `/auth?redirect=/members`
4. After login, should go to `/members` (valid)

### Test OAuth (After Setup)

1. Click "Continue with Google" or "Continue with Apple"
2. Should redirect to provider
3. Authorize the app
4. Should return and be logged in
5. Check database for new profile entry

---

## Current Status

### ✅ Ready to Use
- Sign-in with email/password
- Rate limiting
- Password reset
- Safe URL redirects
- Session management
- Protected routes

### ⏳ Requires Configuration
- Email OTP verification (needs SMTP setup)
- OAuth sign-in (needs provider setup)

### 🔒 Disabled (Launch Ready)
- Sign-up form (currently showing "coming soon")
- Uncomment when ready to accept registrations

---

## Monitoring & Maintenance

### Security Monitoring

Watch for these in your logs:
- `[Security] Blocked potential open redirect:` - Someone tried to exploit redirect
- Failed login attempts per user/IP
- OTP verification failures (could indicate brute force)
- Unusual OAuth callback URLs

### Performance Monitoring

Track these metrics:
- Email delivery rate (OTP codes)
- OTP verification success rate
- OAuth conversion rate
- Average time to complete sign-up
- Session refresh frequency

### Regular Maintenance

- [ ] Rotate JWT secrets every 90 days
- [ ] Review failed login logs weekly
- [ ] Test email delivery monthly
- [ ] Update OAuth credentials before expiry
- [ ] Review RLS policies quarterly
- [ ] Update password policy as needed

---

## Troubleshooting

### "Email OTP not received"

**Check:**
1. SMTP credentials correct?
2. Sender email verified with provider?
3. Check spam folder
4. Check Supabase Auth logs for errors

**Debug:**
```bash
# Check Supabase logs
supabase logs --project-ref your-project

# Test SMTP connection
curl -v --url "smtp://${SMTP_HOST}:${SMTP_PORT}" \
  --user "${SMTP_USER}:${SMTP_PASS}"
```

### "OAuth redirect not working"

**Check:**
1. Redirect URIs match exactly in provider console?
2. Using HTTPS (not HTTP)?
3. Callback URL includes `/auth/v1/callback`?
4. Client ID/Secret correct in environment?

**Test:**
```javascript
// In browser console after OAuth attempt
localStorage.getItem('sb-auth-token')
// Should contain JWT if successful
```

### "Session not persisting"

**Check:**
1. localStorage enabled?
2. Cookies allowed?
3. Browser not in private/incognito mode?

**Debug:**
```javascript
// In browser console
const { data: { session } } = await supabase.auth.getSession();
console.log(session);
// Should show user and access_token
```

### "Rate limit not working"

**Check:**
1. LocalStorage cleared between tests?
2. Using different email addresses for tests?

**Debug:**
```javascript
// In browser console
localStorage.getItem('login_attempts_test@example.com')
// Should show attempt count and timestamps
```

---

## Support

### Documentation Files

- `AUTH_IMPLEMENTATION_SUMMARY.md` - Comprehensive implementation details
- `AUTH_SETUP_DOCUMENTATION.md` - Original reference (EatPal project)
- `CLAUDE.md` - Project overview and conventions

### Need Help?

1. Check the troubleshooting section above
2. Review Supabase Auth logs
3. Check browser console for errors
4. Verify environment variables are set correctly
5. Test with a fresh browser session (clear cache/localStorage)

---

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy edge functions
supabase functions deploy

# Check Supabase status
supabase status

# View Supabase logs
supabase logs

# Test email delivery
# (via Supabase dashboard or API)
```

---

**Last Updated:** January 7, 2026  
**Status:** Implementation Complete - Ready for Configuration  
**Next Action:** Configure email service and test OTP flow
