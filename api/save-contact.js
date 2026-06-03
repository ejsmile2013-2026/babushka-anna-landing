export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  const { contact, lang, symptom, recipe } = req.body || {};
  if (!contact || contact.length < 3) return res.status(400).json({ error: 'invalid' });

  const botToken    = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID;
  const resendKey   = process.env.RESEND_API_KEY;
  const isEmail     = lang !== 'ru';

  // Notify admin via Telegram
  let tgDebug = { botToken: !!botToken, adminChatId: adminChatId || 'NOT SET' };
  if (botToken && adminChatId) {
    const type = isEmail ? 'Email' : 'Telegram';
    const text = `🌿 Новый контакт с лендинга\n${type}: ${contact}\nЯзык: ${lang || '?'}\nСимптом: ${symptom || 'не указан'}`;
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: adminChatId, text })
      });
      const tgData = await tgRes.json();
      tgDebug.tgResponse = tgData;
      console.log('Telegram response:', JSON.stringify(tgData));
    } catch (e) {
      tgDebug.error = e.message;
      console.log('Telegram error:', e.message);
    }
  } else {
    console.log('Telegram skipped: botToken=' + !!botToken + ' adminChatId=' + adminChatId);
  }

  // Send recipe by email (EN/DE) if Resend key is configured
  if (isEmail && resendKey && recipe) {
    const subject = lang === 'de' ? 'Dein Rezept von Oma Anna 🌿' : 'Your recipe from Grandma Anna 🌿';
    const greeting = lang === 'de'
      ? 'Hallo! Hier ist dein persönliches Volksrezept von Oma Anna:'
      : 'Hello! Here is your personal folk remedy from Grandma Anna:';
    const disclaimer = lang === 'de'
      ? 'Diese Ratschläge ersetzen keinen Arztbesuch.'
      : 'This advice does not replace professional medical advice.';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Бабушка Анна <noreply@babushka-anna.com>',
        to: [contact],
        subject,
        text: `${greeting}\n\n${recipe}\n\n---\n${disclaimer}\n\nБабушка Анна · babushka-anna-landing.vercel.app`
      })
    }).catch(() => {});
  }

  res.status(200).json({ ok: true, debug: tgDebug });
}
