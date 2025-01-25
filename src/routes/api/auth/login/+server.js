import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const db = new Database('database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST({ request }) {
  try {
    const { username, password } = await request.json();
    
    console.log('Login attempt for username:', username); // Debug log

    const stmt = db.prepare(`
      SELECT 
        ba.business_id,
        ba.password_hash,
        u.property_name
      FROM business_auth ba
      JOIN users u ON u.id = ba.business_id
      WHERE ba.username = ?
    `);

    const business = stmt.get(username);
    
    if (!business) {
      console.log('Business not found'); // Debug log
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, business.password_hash);
    console.log('Password valid:', isValid); // Debug log

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { 
        businessId: business.business_id,
        propertyName: business.property_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful, sending response'); // Debug log

    return new Response(
      JSON.stringify({
        success: true,
        businessId: business.business_id,
        propertyName: business.property_name
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': `businessToken=${token}; Path=/; HttpOnly; SameSite=Strict`
        } 
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Login failed' }),
      { status: 500 }
    );
  }
}