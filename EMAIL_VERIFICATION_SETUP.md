# Email Verification Setup Guide - SmartShield

## Overview
The email verification system has been implemented in the code, but requires configuration in Supabase to send emails. This guide will help you complete the setup.

## What's Been Added

### 1. **API Endpoint for Resending Emails**
- **Path**: `/api/auth/resend-email`
- **Purpose**: Allows users to resend verification emails if they didn't receive the first one
- **Uses**: Supabase's `auth.resend()` method

### 2. **Enhanced Sign-Up Flow**
- Account creation check for duplicates
- Verification confirmation screen after signup
- "Resend Verification Email" button for users who miss the email
- Clear instructions for Gmail users (check spam/promotions folder)

### 3. **Automatic Redirect on Verification**
- Users are redirected to the homepage after successful verification

## Required Supabase Configuration

### Step 1: Enable Email Confirmations in Supabase

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Navigate to your project
3. Go to **Authentication** → **Providers**
4. Find **Email** section
5. Enable **"Enable email confirmations"** toggle
6. Set **Confirmation email grace period** (recommended: 24 hours)
7. Click **Save**

### Step 2: Configure Email Templates

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. **For each template below:**

#### Template 1: Confirm Signup
1. Click on "**Confirm signup**" template
2. Replace the entire content with `/email-templates/confirm-signup.html`
3. Update the subject line to: `Confirm Your Email - SmartShield`
4. **Important**: Update the logo URL from `http://smartshield.it.com/images/light-logo.png` to your actual domain:
   ```
   https://yourdomain.com/images/light-logo.png
   ```
   Or your deployment URL (Railway, Vercel, etc.)
5. Click **Save**

#### Template 2: Reset Password (Optional)
1. Click on "Reset Password" template
2. Replace with `/email-templates/reset-password.html`
3. Subject: `Reset Your Password - SmartShield`
4. Update logo URL
5. Click **Save**

#### Template 3: Magic Link (Optional)
1. Click on "Magic Link" template
2. Replace with `/email-templates/magic-link.html`
3. Subject: `Your Login Link - SmartShield`
4. Update logo URL
5. Click **Save**

### Step 3: Verify Project Plan

- **Free Plan**: Limited to test emails only (won't send to real users)
- **Pro Plan or Higher**: Full email sending enabled

To check or upgrade your plan:
1. Go to **Supabase Dashboard** → **Settings** → **Billing**
2. Check your current plan
3. If on free tier, upgrade to **Pro** to enable production emails

### Step 4: Test Email Sending

1. Go back to your app's sign-up page
2. Create a test account with a real email address you have access to
3. Check your inbox for the verification email
4. **If not received:**
   - Check spam/promotions folder
   - Wait 2-3 minutes (emails can be delayed)
   - Use the **"Resend Verification Email"** button on the confirmation page

## Troubleshooting

### Problem: No emails received

**Possible Causes:**
1. ❌ Email templates not configured in Supabase
2. ❌ Email confirmations not enabled in Auth settings
3. ❌ Project on free tier (test mode only)
4. ❌ SMTP not configured (if not using Supabase email service)

**Solutions:**
1. ✅ Follow "Step 2" above to configure templates
2. ✅ Follow "Step 1" above to enable email confirmations
3. ✅ Upgrade to Pro plan if needed
4. ✅ Add email service credentials if using external SMTP

### Problem: Logo not showing in emails

- Update the logo URL in email templates to your actual domain
- Ensure the `/images/light-logo.png` file exists at that URL

### Problem: Wrong redirect after verification

- Verify that `/auth/callback` route exists
- Check that `next` parameter defaults to `/` in the route

## Testing the Flow

1. **Sign Up**: Fill in email and password
2. **See Confirmation Screen**: Message appears after account creation
3. **Resend Email**: If not received, click "Resend Verification Email" button
4. **Verify Email**: Click link in received email
5. **Redirect**: Should redirect to homepage

## File References

- **Sign-up form**: `apps/web/src/app/components/UserSignupForm.tsx`
- **Resend email API**: `apps/web/src/app/api/auth/resend-email/route.ts`
- **Auth callback**: `apps/web/src/app/auth/callback/route.ts`
- **Email templates**: `email-templates/` directory

## Next Steps

After completing setup:
1. Test with a real email address
2. Monitor email delivery in Supabase dashboard
3. Adjust email templates as needed
4. Set up email rate limiting if necessary

For more help, refer to:
- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
