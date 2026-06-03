export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  const { contact, lang, symptom } = req.body || {};
  if (!contact || contact.length < 3) return res.status(400).json({ error: 'invalid' });

  const botToken   = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID;

  if (botToken && adminChatId) {
    const type = lang === 'ru' ? 'Telegram' : 'Email';
    const text = `🌿 Новый контакт с лендинга\n${type}: ${contact}\nЯзык: ${lang || '?'}\nСимптом: ${symptom || 'не указан'}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text })
    }).catch(() => {});
  }

  res.status(200).json({ ok: true });
}
