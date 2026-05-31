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

    // Enviar email a admin vía SendGrid
    const adminHtml = [
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff;border-radius:8px;overflow:hidden">',
      '<tr><td style="background:#0A0E1A;padding:24px 24px 20px;text-align:center">',
      '<span style="color:#D4AF37;font-size:22px;font-weight:700;font-family:Georgia,serif">&#9670;  SEB_PROYECT  &#9670;</span><br>',
      '<span style="color:#888;font-size:12px;letter-spacing:0.5px">AI Marketing Intelligence</span>',
      '</td></tr>',
      '<tr><td style="height:3px;background:#D4AF37;padding:0"></td></tr>',
      '<tr><td style="padding:24px 24px 8px">',
      '<span style="display:inline-block;background:#D4AF37;color:#0A0E1A;padding:6px 16px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">&#9679;  NUEVO LEAD ENTRANTE</span>',
      '</td></tr>',
      '<tr><td style="padding:8px 24px 16px">',
      '<span style="color:#D4AF37;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase">Datos del contacto</span>',
      '</td></tr>',
      '<tr><td style="padding:12px 24px 4px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Nombre</span><br>',
      '<span style="color:#1a1a1a;font-size:15px;line-height:1.5;font-weight:500">' + name.trim() + '</span>',
      '</td></tr>',
      '<tr><td style="padding:0 24px"><hr style="border:0;border-top:1px solid #eee;margin:0"></td></tr>',
      '<tr><td style="padding:12px 24px 4px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Email</span><br>',
      '<a href="mailto:' + email.trim().toLowerCase() + '" style="color:#D4AF37;text-decoration:underline;font-size:15px;line-height:1.5;font-weight:500">' + email.trim().toLowerCase() + '</a>',
      '</td></tr>',
      '<tr><td style="padding:0 24px"><hr style="border:0;border-top:1px solid #eee;margin:0"></td></tr>',
      '<tr><td style="padding:12px 24px 4px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Sitio web</span><br>',
      '<a href="' + (site_url || '') + '" style="color:#D4AF37;text-decoration:underline;font-size:15px;line-height:1.5;font-weight:500;word-break:break-all">' + (site_url || '&mdash;') + '</a>',
      '</td></tr>',
      '<tr><td style="padding:0 24px"><hr style="border:0;border-top:1px solid #eee;margin:0"></td></tr>',
      '<tr><td style="padding:12px 24px 4px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Mensaje</span><br>',
      '<span style="color:#555;font-size:15px;line-height:1.6;white-space:pre-wrap">' + ((message || '').trim() || '&mdash;') + '</span>',
      '</td></tr>',
      '<tr><td style="padding:0 24px"><hr style="border:0;border-top:1px solid #eee;margin:0"></td></tr>',
      '<tr><td style="padding:12px 24px 4px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Recibido</span><br>',
      '<span style="color:#888;font-size:14px">' + new Date().toLocaleString('es-ES') + '</span>',
      '</td></tr>',
      '<tr><td style="padding:28px 24px 32px;text-align:center">',
      '<a href="mailto:' + email.trim().toLowerCase() + '?subject=Respuesta%20desde%20Seb_PROYECT" style="display:inline-block;background:#D4AF37;color:#0A0E1A;font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.3px">Responder a este lead</a>',
      '</td></tr>',
      '<tr><td style="padding:20px 24px;text-align:center;background:#f5f5f5;border-top:1px solid #eee">',
      '<span style="color:#888;font-size:11px;letter-spacing:0.5px">',
      'Seb_PROYECT &middot; AI Marketing Intelligence<br>',
      '<a href="https://sebproyect.vercel.app" style="color:#D4AF37;text-decoration:underline">sebproyect.vercel.app</a>',
      '</span></td></tr></table>'
    ].join('\n');

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
        html: adminHtml
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
    }

    // Email de confirmación al remitente vía SendGrid
    const confirmHtml = [
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff;border-radius:8px;overflow:hidden">',
      '<tr><td style="background:#0A0E1A;padding:24px 24px 20px;text-align:center">',
      '<span style="color:#D4AF37;font-size:22px;font-weight:700;font-family:Georgia,serif">&#9670;  SEB_PROYECT  &#9670;</span><br>',
      '<span style="color:#888;font-size:12px;letter-spacing:0.5px">AI Marketing Intelligence</span>',
      '</td></tr>',
      '<tr><td style="height:3px;background:#D4AF37;padding:0"></td></tr>',
      '<tr><td style="padding:24px 24px 8px">',
      '<span style="display:inline-block;background:#22c55e;color:#fff;padding:6px 16px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">&#10003;  MENSAJE RECIBIDO CON &#201;XITO</span>',
      '</td></tr>',
      '<tr><td style="padding:24px 24px 8px;font-family:Arial,Helvetica,sans-serif;color:#333;font-size:15px;line-height:1.7">',
      'Hola <strong style="color:#1a1a1a">' + name.trim() + '</strong>,',
      '</td></tr>',
      '<tr><td style="padding:8px 24px;font-family:Arial,Helvetica,sans-serif;color:#555;font-size:15px;line-height:1.7">',
      'Hemos recibido su solicitud de <strong>Diagnostic Assessment</strong>.',
      '</td></tr>',
      '<tr><td style="padding:8px 24px;font-family:Arial,Helvetica,sans-serif;color:#555;font-size:15px;line-height:1.7">',
      'Nuestro equipo de <strong>AI Marketing Intelligence</strong> est&aacute; revisando los datos que nos comparti&oacute;. En las pr&oacute;ximas <strong style="color:#D4AF37">24 horas</strong> recibir&aacute; una respuesta personalizada con las observaciones y recomendaciones para su proyecto.',
      '</td></tr>',
      '<tr><td style="padding:8px 24px 16px;font-family:Arial,Helvetica,sans-serif;color:#555;font-size:15px;line-height:1.7">',
      'Mientras tanto, puede conocer m&aacute;s sobre nuestro enfoque en <a href="https://sebproyect.vercel.app" style="color:#D4AF37;text-decoration:underline">sebproyect.vercel.app</a>.',
      '</td></tr>',
      '<tr><td style="padding:16px 24px 0">',
      '<span style="color:#D4AF37;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase">&#9472;&#9472;  Resumen de su solicitud  &#9472;&#9472;</span>',
      '</td></tr>',
      '<tr><td style="padding:12px 24px">',
      '<table role="presentation" style="width:100%;background:#fafafa;border-radius:6px;border:1px solid #eee">',
      '<tr><td style="padding:16px 20px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Sitio web</span><br>',
      '<span style="color:#333;font-size:14px">' + (site_url || '&mdash;') + '</span>',
      '</td></tr>',
      '<tr><td style="padding:0 20px"><hr style="border:0;border-top:1px solid #eee"></td></tr>',
      '<tr><td style="padding:16px 20px">',
      '<span style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Consulta</span><br>',
      '<span style="color:#555;font-size:14px;line-height:1.5">' + ((message || '').trim() || '&mdash;') + '</span>',
      '</td></tr></table></td></tr>',
      '<tr><td style="padding:20px 24px 8px;font-family:Arial,Helvetica,sans-serif;color:#555;font-size:15px;line-height:1.7">',
      'Saludos cordiales,',
      '</td></tr>',
      '<tr><td style="padding:0 24px;font-family:Georgia,serif;color:#D4AF37;font-size:15px;font-weight:700">',
      'Equipo Seb_PROYECT',
      '</td></tr>',
      '<tr><td style="padding:0 24px 24px;font-family:Arial,Helvetica,sans-serif;color:#888;font-size:12px">',
      'AI Marketing Intelligence',
      '</td></tr>',
      '<tr><td style="padding:20px 24px;text-align:center;background:#f5f5f5;border-top:1px solid #eee">',
      '<span style="color:#888;font-size:11px;letter-spacing:0.5px">',
      'Seb_PROYECT &middot; AI Marketing Intelligence<br>',
      '<a href="https://sebproyect.vercel.app" style="color:#D4AF37;text-decoration:underline">sebproyect.vercel.app</a>',
      '</span></td></tr></table>'
    ].join('\n');

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Seb_PROYECT <onboarding@resend.dev>',
          to: email.trim().toLowerCase(),
          subject: `\u2713 Recibimos tu solicitud, ${name.trim()}`,
          html: confirmHtml
        })
      });
    } catch (confirmErr) {
      console.error('Resend confirm error:', confirmErr.message || confirmErr);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submit error:', err.message || err);
    return res.status(500).json({ error: 'Error al procesar la solicitud. Intente nuevamente.' });
  }
}
