import { NextResponse } from 'next/server';

// Edge Runtime compatible JWT verification
async function verifyTokenEdge(token) {
  try {
    if (!process.env.JWT_SECRET || !token) {
      return null;
    }

    // Split JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;
    
    // Decode header and payload
    const decodedHeader = JSON.parse(atob(header));
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      console.log('Token has expired');
      return null;
    }

    // For Edge Runtime, we'll do a simplified verification
    // You can implement full HMAC verification using Web Crypto API if needed
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${payload}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(process.env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Decode the signature from base64url
    const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      data
    );
    
    if (!isValid) {
      console.log('Invalid token signature');
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('Edge token verification failed:', error.message);
    return null;
  }
}

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protected admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const decoded = await verifyTokenEdge(token);
    if (!decoded) {
      // Clear the invalid token
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (pathname === '/admin/login' && token) {
    const decoded = await verifyTokenEdge(token);
    if (decoded) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};