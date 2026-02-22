# Quick Setup Guide - Email Templates

## Steps to Configure Email Templates in Supabase

### 1. Access Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/jlgktijajxapqclgjyjx)
2. Navigate to **Authentication** → **Email Templates**

### 2. Configure Each Template

#### Confirm Signup Template

1. Click on **"Confirm signup"** template
2. Copy the entire content from `confirm-signup.html`
3. Paste it into the template editor
4. Update the subject line: `Confirm Your Email - SmartShield`
5. Click **Save**

#### Reset Password Template

1. Click on **"Reset Password"** template
2. Copy the entire content from `reset-password.html`
3. Paste it into the template editor
4. Update the subject line: `Reset Your Password - SmartShield`
5. Click **Save**

#### Magic Link Template

1. Click on **"Magic Link"** template
2. Copy the entire content from `magic-link.html`
3. Paste it into the template editor
4. Update the subject line: `Your Login Link - SmartShield`
5. Click **Save**

### 3. Important URLs to Update

Before saving templates, replace the logo URL with your actual domain:

**Current (placeholder):**
```html
<img src="http://smartshield.it.com/images/light-logo.png" ...>
```

**Update to:**
```html
<img src="https://yourdomain.com/images/light-logo.png" ...>
```

Or use your deployment URL (Railway, Vercel, etc.):
```html
<img src="https://smartshield-production.up.railway.app/images/light-logo.png" ...>
```

### 4. Test the Templates

#### Option A: Test via Supabase Dashboard
1. Go to **Authentication** → **Email Templates**
2. Click the **"Send test email"** button
3. Enter your email address
4. Check your inbox

#### Option B: Test via Your App
1. Try signing up with a new email
2. Try requesting a password reset
3. Verify emails arrive and look correct

### 5. Customize Icons (Optional)

The `confirm-signup.html` template uses external icons. You can:

**Option 1: Keep the current icons** (from Flaticon CDN)
- Works immediately, no setup needed
- Icons may load slower or fail in some email clients

**Option 2: Host icons yourself** (Recommended)
1. Download the icons you want to use
2. Save them in `/apps/web/public/images/email/`
3. Update the template URLs:
```html
<img src="https://yourdomain.com/images/email/extension.png" ...>
<img src="https://yourdomain.com/images/email/scan.png" ...>
<img src="https://yourdomain.com/images/email/history.png" ...>
```

### 6. Configure SMTP (Required for Emails to Work)

**Quick Fix for Development:**
1. Go to **Authentication** → **Providers** → **Email**
2. Disable "Confirm email" toggle
3. Save

**For Production (Recommended):**
1. Set up SMTP provider (SendGrid, Mailgun, etc.)
2. Go to **Project Settings** → **Auth**
3. Scroll to **SMTP Settings**
4. Enable **Custom SMTP**
5. Enter your SMTP credentials
6. Save

See the main README for detailed SMTP setup instructions.

### 7. Verify Setup

✅ **Checklist:**
- [ ] All three email templates configured
- [ ] Logo URL updated to your domain
- [ ] Test emails sent and received
- [ ] Emails display correctly in Gmail, Outlook
- [ ] Images and styles render properly
- [ ] Links work correctly
- [ ] SMTP configured (or email confirmation disabled)

### Troubleshooting

**Problem: Emails not sending**
- Check SMTP configuration
- Verify email confirmation is enabled/disabled correctly
- Check Supabase logs: **Logs** → **Auth**

**Problem: Images not loading**
- Ensure URLs are absolute (not relative)
- Check images are publicly accessible
- Test URLs in browser
- Use HTTPS (not HTTP) for all image URLs

**Problem: Styles not rendering**
- Use inline styles (already done in templates)
- Avoid using `<style>` tags for better email client support
- Test in multiple email clients

**Problem: Links not working**
- Verify `{{ .ConfirmationURL }}` is not modified
- Check callback URLs in Supabase settings
- Test the full signup/login flow

### Next Steps

After setup:
1. Complete SMTP configuration for production
2. Customize icon images to match your brand
3. Test thoroughly across different email clients
4. Monitor email delivery rates in your SMTP provider dashboard

### Support Resources

- Supabase Email Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Email Template Testing: https://litmus.com/
- SMTP Providers:
  - SendGrid: https://sendgrid.com/
  - Mailgun: https://www.mailgun.com/
  - AWS SES: https://aws.amazon.com/ses/

---

**Your Supabase Project:** `jlgktijajxapqclgjyjx`
**Dashboard:** https://supabase.com/dashboard/project/jlgktijajxapqclgjyjx
