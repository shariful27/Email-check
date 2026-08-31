// api/check-email.js
import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS হেডার সেট করা যাতে Blogger থেকে রিকোয়েস্ট এক্সেপ্ট হয়
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emails } = req.body;
  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Invalid emails array' });
  }

  const results = await Promise.all(
    emails.map(async (email) => {
      const cleanEmail = email.trim().toLowerCase();
      const hash = crypto.createHash('md5').update(cleanEmail).digest('hex');
      
      // Gravatar 404 চেক
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
      
      try {
        const response = await fetch(gravatarUrl, { method: 'HEAD' });
        const hasPhoto = response.status === 200;
        return {
          email: cleanEmail,
          hasPhoto: hasPhoto,
          avatarUrl: hasPhoto ? `https://www.gravatar.com/avatar/${hash}?s=150` : null
        };
      } catch (err) {
        return { email: cleanEmail, hasPhoto: false, avatarUrl: null };
      }
    })
  );

  return res.status(200).json({ results });
}
