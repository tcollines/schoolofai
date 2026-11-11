# Welile School of AI: branded emails

These are the sign-up and account emails, designed to look like the rest of the site and to arrive from **Welile School of AI**, not from Supabase.

Two things have to be done in the Supabase dashboard. Neither changes any student data.

## Part 1. Send from your own name and address (SMTP)

Supabase's built-in mailer is only for testing: it sends from a Supabase address and allows very few emails per hour. To send from `Welile School of AI <no-reply@yourdomain>` you connect an email-sending service.

1. **Pick a sending service** and create an account. Resend, Brevo, Postmark and Amazon SES all work. Most have a free tier that is plenty to start.
2. **Add your domain** in that service (for example `welile.com`). It shows you a few DNS records (SPF, DKIM, sometimes DMARC). Add them where your domain's DNS is managed, then click Verify. Without this step, emails go to spam.
3. In Supabase open **Authentication, then Emails, then SMTP Settings** for the School of AI project and switch on **Custom SMTP**:
   - **Sender email:** an address on your verified domain, e.g. `no-reply@welile.com`
   - **Sender name:** `Welile School of AI`
   - **Host, port, username, password:** copy these from your sending service (for Resend: host `smtp.resend.com`, port `465`, username `resend`, password = your API key)
4. Save, then register a test account with your own email to check it arrives (look in spam the first time).

## Part 2. Use the new designs

In Supabase open **Authentication, then Emails, then Templates**. For each template below, paste the file's contents into **Message body** and the subject into **Subject**, then Save.

| Supabase template | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirm your email to start learning with Welile School of AI |
| Magic Link | `magic-link.html` | Your sign-in link for Welile School of AI |
| Reset Password | `reset-password.html` | Reset your Welile School of AI password |
| Invite user | `invite.html` | You have been invited to Welile School of AI |
| Change Email Address | `change-email.html` | Confirm your new email address |
| Reauthentication | `reauthentication.html` | Your Welile School of AI confirmation code |

The `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}` and similar pieces are filled in by Supabase. Leave them exactly as written.

## Part 3. Check the links point to your live site

Open **Authentication, then URL Configuration**:

- **Site URL:** your public website address (not localhost). The logo in the emails is loaded from `{{ .SiteURL }}/schoolofai-logo.png`.
- **Redirect URLs:** add `https://your-site/**` so the confirmation link can land students on the profile page.

## Tips

- Emails are built from tables and inline styles so they look right in Gmail, Outlook and phone mail apps.
- Some mail apps hide images until the reader allows them. The logo has a text fallback, and the button is plain HTML, so the message still works.
- To preview a design, open the HTML file in a browser. The `{{ ... }}` placeholders will show as text there; that is normal.
