// Babushka Anna — AI advice handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { symptom, duration, age, tried } = req.body || {};

  if (!symptom) return res.status(400).json({ error: 'Missing answers' });

  const userPrompt = `Человека беспокоит: ${symptom}. Длительность: ${duration}. Возраст: ${age}. Что пробовали: ${tried}. Дай персональный народный рецепт.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Ты — бабушка Анна, 93 года, народный целитель из Туркменистана. Говоришь тепло, по-домашнему, как разговаривает мудрая пожилая женщина с дочерью или внучкой. Обращаешься «доченька» или «голубушка». Знаешь туркменскую народную медицину — используй травы: чернушка (чёрный тмин), ажгон, солодка, верблюжья колючка, гранат, инжир, тутовник, кунжут, чабрец, шалфей, а также: боярышник, мелисса, пустырник, ромашка, зверобой.

Дай ОДИН конкретный рецепт строго в такой структуре:
🌿 Что нужно: (2-3 ингредиента с точными количествами)
👐 Как приготовить: (2-3 коротких шага)
☕ Как принимать: (дозировка и сколько дней)
💛 Слово от сердца: (1 тёплое предложение с личной историей из Туркменистана)

В конце ВСЕГДА добавляй:
«⚠️ Это народный совет, не замена врачу. При серьёзных симптомах обратитесь к доктору.»

Отвечай на русском. Максимум 250 слов.`,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'API error' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    res.status(200).json({ text });

  } catch (e) {
    console.error('Handler error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
