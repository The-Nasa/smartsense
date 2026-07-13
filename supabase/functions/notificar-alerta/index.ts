import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import nodemailer from "npm:nodemailer"

serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const payload = await req.json()
    console.log("Notificar-alerta webhook triggered with payload:", JSON.stringify(payload))

    // Extraer los datos del registro insertado en la tabla gas_eventos
    const record = payload.record
    if (!record) {
      return new Response(JSON.stringify({ error: "No record found in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const valorGas = record.valor_gas
    const alerta = record.alerta
    const fechaISO = record.created_at || new Date().toISOString()
    const fechaLocal = new Date(fechaISO).toLocaleString('es-ES', { timeZone: 'America/Lima' }) // Hora de Perú

    // Si la lectura no es una alerta, no enviamos notificaciones
    if (!alerta) {
      return new Response(JSON.stringify({ message: "No alert triggered (alerta is false)" }), {
        headers: { "Content-Type": "application/json" }
      })
    }

    // --- CONECTAR CON SUPABASE PARA LEER TODOS LOS USUARIOS DESTINATARIOS ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let usersList: any[] = []

    try {
      console.log("Fetching all user profiles from Supabase...")
      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('nombre, email, telefono, notif_email, notif_sms')

      if (!usersError && users) {
        usersList = users
        console.log(`Loaded ${usersList.length} users from database.`)
      } else {
        console.warn("Could not load users from DB, falling back to defaults:", usersError)
        // Fallback por defecto si hay error en la tabla
        usersList = [{
          nombre: 'Usuario Principal',
          email: 'tapullimasernam@gmail.com',
          telefono: '',
          notif_email: true,
          notif_sms: false
        }]
      }
    } catch (dbErr) {
      console.error("Database query failed, using defaults:", dbErr)
      usersList = [{
        nombre: 'Usuario Principal',
        email: 'tapullimasernam@gmail.com',
        telefono: '',
        notif_email: true,
        notif_sms: false
      }]
    }

    // --- CONFIGURAR GMAIL SMTP (NODEMAILER) ---
    // Lee exclusivamente las variables de entorno configuradas en Supabase Secrets
    const smtpUser = Deno.env.get('SMTP_USER') ?? ''
    const smtpPass = Deno.env.get('SMTP_PASS') ?? ''

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in Supabase Edge Function Secrets.")
      return new Response(JSON.stringify({ error: "SMTP credentials missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    // Filtrar los usuarios habilitados para recibir notificaciones por correo
    const emailRecipients = usersList
      .filter(u => u.notif_email && u.email && u.email.trim() !== '')
      .map(u => u.email.trim())

    let emailSent = false
    let emailError = null

    if (emailRecipients.length > 0) {
      console.log(`Sending email warnings via Gmail SMTP to: ${emailRecipients.join(', ')}...`)
      try {
        const mailOptions = {
          from: `"SmartSense IoT" <${smtpUser}>`,
          to: emailRecipients.join(', '), // Enviamos a todos los destinatarios habilitados
          subject: '⚠️ ALERTA: Fuga de Gas Detectada - SmartSense',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="text-align: center; padding: 25px 15px; background-color: #dc2626; color: white; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">⚠️ ALERTA CRÍTICA</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 500;">Fuga de gas o humo detectado por sensor MQ2</p>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">Hola,</p>
                <p style="font-size: 15px;">El sistema de monitoreo **SmartSense** ha registrado un nivel de concentración de gas que sobrepasa el límite establecido.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">Detalles de la Lectura</p>
                  <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; color: #475569;">Valor del Sensor:</td>
                      <td style="padding: 6px 0; color: #dc2626; font-weight: 800; font-size: 16px;">${valorGas} ppm</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; color: #475569;">Fecha y Hora:</td>
                      <td style="padding: 6px 0; color: #334155; font-weight: 500;">${fechaLocal}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; color: #475569;">Gravedad:</td>
                      <td style="padding: 6px 0;">
                        <span style="background-color: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                          Peligro
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <p style="color: #dc2626; font-weight: 700; font-size: 14px; margin-bottom: 8px;">Recomendaciones de seguridad inmediatas:</p>
                <ul style="padding-left: 20px; color: #475569; font-size: 13.5px; margin-top: 0;">
                  <li style="margin-bottom: 6px;"><b>No enciendas interruptores</b>, fósforos ni uses linternas o celulares cerca de la zona.</li>
                  <li style="margin-bottom: 6px;"><b>Abre ventanas y puertas</b> de inmediato para ventilar el área.</li>
                  <li style="margin-bottom: 6px;">Cierra la llave de paso de gas principal si es seguro acceder a ella.</li>
                  <li style="margin-bottom: 6px;">Evacúa la zona afectada y notifica a las autoridades locales de ser necesario.</li>
                </ul>
              </div>
              <div style="text-align: center; padding: 15px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; background-color: #fafafa; border-radius: 0 0 12px 12px;">
                Este correo fue autogenerado por tu sistema de seguridad SmartSense IoT.
              </div>
            </div>
          `
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Email sent successfully. Message ID:", info.messageId)
        emailSent = true
      } catch (err) {
        console.error("Error sending email via Google SMTP:", err)
        emailError = err.message
      }
    } else {
      console.log("No active recipients found for email notifications.")
    }

    // --- PARTE 2: ENVÍO DE SMS CON TWILIO ---
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER')

    // Filtrar los usuarios habilitados para recibir notificaciones por SMS
    const smsRecipients = usersList
      .filter(u => u.notif_sms && u.telefono && u.telefono.trim() !== '')
      .map(u => u.telefono.trim())

    let smsSentCount = 0
    const smsErrors: string[] = []

    if (smsRecipients.length > 0 && twilioSid && twilioAuthToken && twilioFrom) {
      console.log(`Sending SMS alerts via Twilio to ${smsRecipients.length} recipients: ${smsRecipients.join(', ')}...`)
      
      for (const to of smsRecipients) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
          const formData = new URLSearchParams()
          formData.append('From', twilioFrom)
          formData.append('To', to)
          formData.append('Body', `🚨 ALERTA SMARTSENSE: Fuga de gas detectada. Valor del sensor: ${valorGas} ppm. Hora: ${fechaLocal}. Toma precauciones de inmediato.`)

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuthToken}`)
            },
            body: formData.toString()
          })

          if (!twilioResponse.ok) {
            const twilioErr = await twilioResponse.text()
            throw new Error(twilioErr)
          }

          console.log(`SMS sent successfully to ${to}.`)
          smsSentCount++
        } catch (err) {
          console.error(`Error sending SMS to ${to}:`, err)
          smsErrors.push(`${to}: ${err.message}`)
        }
      }
    } else {
      console.log("Skipping Twilio SMS: No active recipients or Twilio credentials not configured in secrets.")
    }

    // --- RESPUESTA DE LA EDGE FUNCTION ---
    return new Response(JSON.stringify({
      success: emailSent || smsSentCount > 0,
      notifications: {
        email: { sent: emailSent, recipients: emailRecipients, error: emailError },
        sms: { sent_count: smsSentCount, recipients: smsRecipients, errors: smsErrors }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Critical error in function execution:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
