// api/check-email.js
import dns from 'dns/promises';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emails } = req.body;
  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const results = await Promise.all(
    emails.map(async (email) => {
      const cleanEmail = email.trim().toLowerCase();
      
      // ১. ইমেইল ফরম্যাট চেক
      if (!emailRegex.test(cleanEmail)) {
        return { 
          email: cleanEmail, 
          isValid: false, 
          hasPhoto: false, 
          reason: 'ভুল ফরম্যাট' 
        };
      }

      const domain = cleanEmail.split('@')[1];
      let isValid = false;

      // ২. ডোমেইন/মেইল সার্ভার চেক (MX Record)
      try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
          isValid = true;
        }
      } catch (error) {
        isValid = false;
      }

      if (!isValid) {
        return { 
          email: cleanEmail, 
          isValid: false, 
          hasPhoto: false, 
          reason: 'মেইল সার্ভার পাওয়া যায়নি' 
        };
      }

      // ৩. প্রোফাইল পিকচার চেক (Gravatar Check)
      const hash = crypto.createHash('md5').update(cleanEmail).digest('hex');
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
      let hasPhoto = false;
      let avatarUrl = null;

      try {
        const photoRes = await fetch(gravatarUrl, { method: 'HEAD' });
        if (photoRes.status === 200) {
          hasPhoto = true;
          avatarUrl = `https://www.gravatar.com/avatar/${hash}?s=80`;
        }
      } catch (err) {
        hasPhoto = false;
      }

      return {
        email: cleanEmail,
        isValid: true,
        hasPhoto: hasPhoto,
        avatarUrl: avatarUrl
      };
    })
  );

  return res.status(200).json({ results });
}
