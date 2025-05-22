import { Admin } from '../../../models/Admin';
import { generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Verify credentials
    const isValid = await Admin.verifyPassword(email, password);
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
      console.log('Invalid credentials for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get admin details
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      console.log('Admin not found after password verification');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Admin found:', admin.email);

    // Generate token
    const token = generateToken({
      adminId: admin._id,
      email: admin.email
    });

    console.log('Token generated successfully');

    const response = {
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name || admin.email
      }
    };

    console.log('Sending successful response');
    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
}