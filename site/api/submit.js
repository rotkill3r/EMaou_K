// Vercel Serverless Function — Node.js 18+
// Valida, envía email con Resend

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let { name, email, site_url, message } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nombre inválido' });
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

    const adminHtml = '<h2 style="color:#D4AF37">Nuevo lead: ' + name.trim() + '</h2><p><b>Email:</b> ' + email.trim().toLowerCase() + '</p><p><b>Sitio:</b> ' + (site_url || '—') + '</p><p><b>Mensaje:</b> ' + ((message || '').trim() || '—') + '</p><p style="color:#888;font-size:12px">Recibido: ' + new Date().toLocaleString('es-ES') + '</p>';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Seb_PROYECT <onboarding@resend.dev>',
        to: 'sebpowerop@hotmail.com',
        subject: 'Nuevo contacto: ' + name.trim(),
        html: adminHtml
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error('Resend admin error: ' + errText);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error desconocido' });
  }
}
