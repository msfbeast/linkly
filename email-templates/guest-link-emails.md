# Email Notification Templates for Guest Links

Email templates for guest link conversion funnel.

## Day 5 Reminder Email

**Subject:** Your link got {clicks} clicks! 🎉

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Link Performance</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%); padding: 40px 24px; text-align: center;">
      <h1 style="color: #1E293B; font-size: 28px; margin: 0 0 8px 0; font-weight: bold;">
        Your link is doing great! 🎉
      </h1>
      <p style="color: #475569; font-size: 16px; margin: 0;">
        linkly.co/{shortCode}
      </p>
    </div>

    <!-- Stats -->
    <div style="padding: 32px 24px; text-align: center;">
      <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <div style="font-size: 48px; font-weight: bold; color: #1E293B; margin-bottom: 8px;">
          {clicks}
        </div>
        <div style="color: #78716C; font-size: 16px;">
          Total Clicks
        </div>
      </div>

      <p style="color: #78716C; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your link has been clicked <strong>{clicks} times</strong> in the last 5 days!
        Sign up now to keep it forever and unlock detailed analytics.
      </p>

      <!-- Benefits -->
      <div style="text-align: left; margin-bottom: 32px;">
        <div style="display: flex; align-items: start; margin-bottom: 16px;">
          <div style="background: #FEF3C7; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
            ✓
          </div>
          <div>
            <strong style="color: #1E293B;">Keep your link forever</strong>
            <div style="color: #78716C; font-size: 14px;">No expiration, unlimited clicks</div>
          </div>
        </div>

        <div style="display: flex; align-items: start; margin-bottom: 16px;">
          <div style="background: #FEF3C7; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
            📊
          </div>
          <div>
            <strong style="color: #1E293B;">See detailed analytics</strong>
            <div style="color: #78716C; font-size: 14px;">Devices, locations, referrers</div>
          </div>
        </div>

        <div style="display: flex; align-items: start;">
          <div style="background: #FEF3C7; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
            🚀
          </div>
          <div>
            <strong style="color: #1E293B;">Create unlimited links</strong>
            <div style="color: #78716C; font-size: 14px;">Build your complete link hub</div>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <a href="{claimUrl}" style="display: inline-block; background: #FCD34D; color: #1E293B; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(252, 211, 77, 0.3);">
        Claim Your Link (Free)
      </a>

      <p style="color: #A8A29E; font-size: 14px; margin: 24px 0 0 0;">
        Your link expires in <strong>2 days</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F5F5F4; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
      <p style="color: #78716C; font-size: 14px; margin: 0 0 8px 0;">
        Free forever. No credit card required.
      </p>
      <p style="color: #A8A29E; font-size: 12px; margin: 0;">
        © 2025 Linkly. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
```

**Plain Text Version:**
```
Your link is doing great! 🎉

linkly.co/{shortCode} has been clicked {clicks} times!

Sign up now to:
✓ Keep your link forever (no expiration)
📊 See detailed analytics (devices, locations, referrers)
🚀 Create unlimited links

Claim your link: {claimUrl}

Your link expires in 2 days.

- The Linkly Team
```

---

## Day 7 Expiry Warning Email

**Subject:** ⏰ Your link expires today

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expiring Soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 24px; text-align: center;">
      <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0; font-weight: bold;">
        ⏰ Your link expires today
      </h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">
        linkly.co/{shortCode}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px; text-align: center;">
      <div style="background: #FEE2E2; border: 2px solid #EF4444; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 8px;">⏰</div>
        <div style="color: #1E293B; font-size: 18px; font-weight: bold;">
          Expires in 24 hours
        </div>
      </div>

      <p style="color: #78716C; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your link will stop working tomorrow. Sign up now to save it and keep all your analytics.
      </p>

      {clicks > 0 && (
        <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #1E293B; font-size: 16px; margin: 0;">
            Don't lose your <strong>{clicks} clicks</strong> of data!
          </p>
        </div>
      )}

      <!-- CTA Button -->
      <a href="{claimUrl}" style="display: inline-block; background: #EF4444; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
        Save My Link Now
      </a>

      <p style="color: #A8A29E; font-size: 14px; margin: 24px 0 0 0;">
        This is your last chance to claim this link
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F5F5F4; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
      <p style="color: #78716C; font-size: 14px; margin: 0 0 8px 0;">
        Free forever. No credit card required.
      </p>
      <p style="color: #A8A29E; font-size: 12px; margin: 0;">
        © 2025 Linkly. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
```

**Plain Text Version:**
```
⏰ Your link expires today

linkly.co/{shortCode} will stop working in 24 hours.

{clicks > 0 && "Don't lose your {clicks} clicks of data!"}

Sign up now to save your link: {claimUrl}

This is your last chance.

- The Linkly Team
```

---

## Claim Link Confirmation Email

**Subject:** ✅ Link claimed successfully!

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Claimed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 24px; text-align: center;">
      <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0; font-weight: bold;">
        ✅ Link claimed successfully!
      </h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">
        Welcome to Linkly
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px; text-align: center;">
      <p style="color: #78716C; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your link <strong>linkly.co/{shortCode}</strong> has been added to your account!
      </p>

      <!-- Next Steps -->
      <div style="text-align: left; margin-bottom: 32px;">
        <h3 style="color: #1E293B; font-size: 18px; margin: 0 0 16px 0;">What's next?</h3>
        
        <div style="margin-bottom: 12px;">
          <a href="{dashboardUrl}" style="color: #F59E0B; text-decoration: none; font-weight: 500;">
            → View your dashboard
          </a>
        </div>
        
        <div style="margin-bottom: 12px;">
          <a href="{analyticsUrl}" style="color: #F59E0B; text-decoration: none; font-weight: 500;">
            → See detailed analytics
          </a>
        </div>
        
        <div>
          <a href="{bioUrl}" style="color: #F59E0B; text-decoration: none; font-weight: 500;">
            → Create your bio page
          </a>
        </div>
      </div>

      <!-- CTA Button -->
      <a href="{dashboardUrl}" style="display: inline-block; background: #FCD34D; color: #1E293B; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(252, 211, 77, 0.3);">
        Go to Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #F5F5F4; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
      <p style="color: #78716C; font-size: 14px; margin: 0 0 8px 0;">
        Need help? Reply to this email or visit our help center.
      </p>
      <p style="color: #A8A29E; font-size: 12px; margin: 0;">
        © 2025 Linkly. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
```

---

## Implementation Notes

### Sending Emails

Use Supabase Edge Functions or a service like SendGrid/Resend:

```typescript
// Example with Supabase Edge Function
const sendEmail = async (to: string, template: string, data: any) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      to,
      template,
      data,
    }),
  });
  
  return response.json();
};
```

### Scheduling

Use a cron job or Supabase scheduled functions:

```sql
-- Day 5 reminder (runs daily)
SELECT * FROM links
WHERE is_guest = true
AND created_at::date = (CURRENT_DATE - INTERVAL '5 days')::date;

-- Day 7 expiry warning (runs daily)
SELECT * FROM links
WHERE is_guest = true
AND expires_at::date = (CURRENT_DATE + INTERVAL '1 day')::date;
```

### Variables

Replace these in templates:
- `{shortCode}` - Link short code
- `{clicks}` - Total click count
- `{claimUrl}` - Claim link URL (`https://linkly.co/claim/{claimToken}`)
- `{dashboardUrl}` - Dashboard URL
- `{analyticsUrl}` - Analytics URL
- `{bioUrl}` - Bio page URL
