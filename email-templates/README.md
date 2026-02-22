# Email Templates for SmartShield

This folder contains email templates for Supabase authentication.

## How to Use

### 1. Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Select the template type (e.g., "Confirm signup")
5. Copy the content from the corresponding HTML file
6. Paste it into the template editor
7. Click **Save**

## Available Templates

### `confirm-signup.html`
Email sent when a user signs up with email/password.

**Features:**
- Modern gradient header with logo
- Clear call-to-action button
- "What's Next?" section with feature icons
- Responsive design for all email clients
- Brand colors (#545BFF)

## Customization Options

### Replace Icons

The current template uses icons from Flaticon. You can replace them with:

**Option 1: Upload to your own server**
```html
<img src="https://yourdomain.com/images/extension-icon.png" ...>
```

**Option 2: Use different free icon services**

- **Flaticon** (current): https://www.flaticon.com/
- **Icons8**: https://icons8.com/
- **Font Awesome CDN**: https://fontawesome.com/
- **Heroicons**: https://heroicons.com/

**Current Icons Used:**
1. Browser Extension: https://cdn-icons-png.flaticon.com/512/3281/3281307.png
2. Scan URLs: https://cdn-icons-png.flaticon.com/512/1828/1828551.png
3. Scan History: https://cdn-icons-png.flaticon.com/512/3135/3135715.png

### Alternative Icon Suggestions

Replace the icon URLs with these alternatives:

**Browser Extension:**
- https://cdn-icons-png.flaticon.com/512/2920/2920277.png (puzzle piece)
- https://cdn-icons-png.flaticon.com/512/3281/3281289.png (chrome)
- https://cdn-icons-png.flaticon.com/512/888/888846.png (extension)

**Scan URLs:**
- https://cdn-icons-png.flaticon.com/512/709/709612.png (search)
- https://cdn-icons-png.flaticon.com/512/2919/2919906.png (shield check)
- https://cdn-icons-png.flaticon.com/512/1828/1828640.png (magnifying glass)

**Scan History:**
- https://cdn-icons-png.flaticon.com/512/3394/3394888.png (clipboard list)
- https://cdn-icons-png.flaticon.com/512/2991/2991148.png (document)
- https://cdn-icons-png.flaticon.com/512/3059/3059989.png (analytics)

### Use Your Own Icons

For best results, host icons on your domain:

1. Create icons as 64x64 PNG files with transparent background
2. Upload to `/public/images/email/` in your project
3. Update the template URLs:
```html
<img src="https://smartshield.it.com/images/email/extension-icon.png" ...>
```

### Change Colors

Update the brand color throughout the template:

**Primary Color: #545BFF**
- Change all instances to match your brand
- Update gradient: `linear-gradient(135deg, #545BFF 0%, #7B83FF 100%)`

### Change Logo

Update the header logo URL:
```html
<img src="http://smartshield.it.com/images/light-logo.png" alt="SmartShield" width="60" height="60">
```

## Testing

Before deploying:

1. Send a test email to yourself
2. Check rendering in multiple email clients:
   - Gmail (web, mobile)
   - Outlook (desktop, web)
   - Apple Mail
   - Yahoo Mail
3. Verify all links work correctly
4. Check images load properly
5. Test on mobile devices

## Supabase Variables

These variables are automatically replaced by Supabase:

- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

## Other Templates Needed

Create similar templates for:

- **Magic Link** (`magic-link.html`)
- **Reset Password** (`reset-password.html`)
- **Email Change** (`change-email.html`)
- **Invite User** (`invite-user.html`)

## Support

- Supabase Email Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Email Template Testing: https://litmus.com/
- HTML Email Guide: https://www.campaignmonitor.com/dev-resources/guides/coding/
