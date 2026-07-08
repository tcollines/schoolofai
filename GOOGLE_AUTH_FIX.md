# Fixing Google "Redirect URI Mismatch"

The error isn't in Supabase—it's in the **Google Cloud Console**.

When using Supabase Auth, Google doesn't talk directly to your localhost. It talks to Supabase.
So, you need to tell Google to trust **Supabase**, not just your localhost.

## Step-by-Step Fix

1.  Copy this URL (Your Supabase Callback URL):
    ```
    https://myyzgdkhyaxkcsngsapr.supabase.co/auth/v1/callback
    ```

2.  Go to the **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**.
3.  Select the **Project** you created for this app.
4.  Click on **Credentials** in the left sidebar.
5.  Under **OAuth 2.0 Client IDs**, click the pencil icon **(Edit client)** next to your Web client.
6.  Scroll down to **Authorized redirect URIs**.
7.  Click **ADD URI**.
8.  **Paste the URL** you copied in Step 1:
    `https://myyzgdkhyaxkcsngsapr.supabase.co/auth/v1/callback`
9.  Click **SAVE**.

## Why did this happen?
You correctly added `localhost:3003` to Supabase (so Supabase knows where to send you *after* login).
But you also need to tell Google where to send the data *during* login (which is to Supabase).
