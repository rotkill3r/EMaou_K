// Vercel Serverless Function — Node.js 18+
// Valida, guarda en Supabase, envía email con Resend

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, site_url, message } = req.body || {};

    // Validación manual
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nombre inválido (mín. 2 caracteres)' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (site_url && typeof site_url === 'string') {
      site_url = site_url.trim();
      if (!/^https?:\/\//i.test(site_url)) {
        site_url = 'https://' + site_url;
      }
    }

    // Insertar en Supabase via REST API (sin SDK)
    const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        site_url: (site_url || '').trim(),
        message: (message || '').trim()
      })
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Supabase insert error:', errText);
      throw new Error('Error al guardar en base de datos');
    }

    const [row] = await insertRes.json();

    // Enviar email con Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Seb_PROYECT <onboarding@resend.dev>',
        to: 'sebpowerop@hotmail.com',
        subject: `✉ Nuevo contacto: ${name.trim()}`,
        html: `
          <h2 style="color:#D4AF37;font-family:Georgia,serif">Nuevo lead desde Seb_PROYECT</h2>
          <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px">
            <tr>
              <td style="padding:10px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;width:100px">Nombre</td>
              <td style="padding:10px 12px;border:1px solid #ddd">${name.trim()}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9">Email</td>
              <td style="padding:10px 12px;border:1px solid #ddd">${email.trim().toLowerCase()}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9">Sitio</td>
              <td style="padding:10px 12px;border:1px solid #ddd">${(site_url || '').trim() || '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9">Mensaje</td>
              <td style="padding:10px 12px;border:1px solid #ddd">${(message || '').trim() || '—'}</td>
            </tr>
          </table>
          <p style="color:#888;font-size:12px;margin-top:20px;font-family:Arial,sans-serif">
            Recibido: ${new Date().toLocaleString('es-ES')}
          </p>
        `
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
    }

    return res.status(200).json({ success: true, id: row.id });
  } catch (err) {
    console.error('Submit error:', err.message || err);
    return res.status(500).json({ error: 'Error al procesar la solicitud. Intente nuevamente.' });
  }
}
