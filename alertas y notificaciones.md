Paso 1 — Crear cuenta en Resend (email)

Ve a resend.com → Sign up gratis
Verifica tu email
Ve a API Keys → crear una key → cópiala
Ve a Domains → agrega tu dominio o usa el dominio sandbox de prueba que te dan gratis (onboarding@resend.dev)


Paso 2 — Crear cuenta en Twilio (SMS)

Ve a twilio.com → Sign up gratis
Verifica tu número de teléfono
En el dashboard copia:

Account SID
Auth Token


Ve a Phone Numbers → Get a free number (número de prueba gratuito)


Paso 3 — Guardar las keys en Supabase
En tu proyecto Supabase ve a Settings → Edge Functions → Secrets y agrega estas variables:
RESEND_API_KEY      → re_B4FThKab_AZ7Pit9oRXHPtMkPoEcmnF9n
TWILIO_ACCOUNT_SID  → tu Account SID
TWILIO_AUTH_TOKEN   → tu Auth Token
TWILIO_FROM_NUMBER  → tu número Twilio (+1XXXXXXXXXX)
TWILIO_TO_NUMBER    → tu número personal (+51XXXXXXXXX)
RESEND_TO_EMAIL     → tapullimasernam@gmail.com

Paso 4 — Crear la Edge Function en Supabase
En Supabase → Edge Functions → New Function → nombre: notificar-alerta
