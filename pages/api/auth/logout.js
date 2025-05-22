export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // In a more complex setup, you might want to blacklist the token
  // For now, we'll just return success as the client will remove the token
  res.status(200).json({ message: 'Logout successful' });
}