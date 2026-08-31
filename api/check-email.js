// api/check-email.js
export default async function handler(req, res) {
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
      
      // Google Profile Image Endpoint
      const googlePhotoUrl = `https://lh3.googleusercontent.com/a/default-user=s96-c`;
      // Google Public Directory Lookup URL
      const googleAvatarUrl = `https://profiles.google.com/image/p/${cleanEmail}`;

      try {
        const response = await fetch(googleAvatarUrl, { method: 'HEAD', redirect: 'follow' });
        
        // Google যদি ডিফল্ট ছবি না দিয়ে আসল কোনো প্রোফাইল ছবি ডাইরেক্ট করে
        const finalUrl = response.url;
        const hasPhoto = response.ok && !finalUrl.includes('default-user') && !finalUrl.includes('cleardot.gif');

        return {
          email: cleanEmail,
          hasPhoto: hasPhoto,
          avatarUrl: hasPhoto ? finalUrl : null
        };
      } catch (err) {
        return { email: cleanEmail, hasPhoto: false, avatarUrl: null };
      }
    })
  );

  return res.status(200).json({ results });
}
