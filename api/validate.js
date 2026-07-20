
// Vercel Serverless Function
// Calls the Anthropic API using a server-side API key (never exposed to the browser).
// Set ANTHROPIC_API_KEY in your Vercel project's Environment Variables.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable set nahi hai. Vercel project settings me add karo.' });
    return;
  }

  try {
    const { base64Image, mediaType, prompt } = req.body;

    if (!base64Image || !mediaType || !prompt) {
      res.status(400).json({ error: 'base64Image, mediaType, prompt required hai' });
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
              { type: 'text', text: prompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
