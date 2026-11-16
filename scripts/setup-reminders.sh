#!/usr/bin/env bash
# One-time setup for the live-class email reminders. Run it yourself, in this repository:
#   bash scripts/setup-reminders.sh
# It stores the sending details as GitHub Actions secrets (only GitHub keeps them) and prints a "hash" line
# that goes into the database. Nothing secret is printed or saved to a file.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Welile live-class reminders: one-time setup"
read -r -s -p "Gmail app password for welileschoolofai@gmail.com (the one Supabase uses for sign-up emails): " SMTP_PASS
echo
[ -n "$SMTP_PASS" ] || { echo "No password entered. Stopping."; exit 1; }

get_env() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '\r'; }
SECRET="$(openssl rand -hex 32)"

printf %s "$SECRET"                         | gh secret set REMINDER_SECRET
printf %s "$(get_env SUPABASE_URL)"         | gh secret set SUPABASE_URL
printf %s "$(get_env SUPABASE_ANON_KEY)"    | gh secret set SUPABASE_ANON_KEY
printf %s "https://www.welileschoolofai.org" | gh secret set APP_URL
printf %s "smtp.gmail.com"                  | gh secret set SMTP_HOST
printf %s "465"                             | gh secret set SMTP_PORT
printf %s "welileschoolofai@gmail.com"      | gh secret set SMTP_USER
printf %s "$SMTP_PASS"                      | gh secret set SMTP_PASS
printf %s "Welile School of AI"             | gh secret set SMTP_FROM_NAME

HASH="$(printf %s "$SECRET" | shasum -a 256 | awk '{print $1}')"
echo
echo "Done. GitHub secrets saved. Send this line back (it is safe to share):"
echo "REMINDER_HASH=$HASH"
