import { jwtVerify } from 'jose';
import type { FastifyReply, FastifyRequest } from 'fastify';

let jwtSecret: Uint8Array | undefined;

function getJwtSecret(): Uint8Array {
  if (!jwtSecret) {
    const secret = process.env['SUPABASE_JWT_SECRET'];
    if (!secret) {
      throw new Error('Missing SUPABASE_JWT_SECRET environment variable');
    }
    jwtSecret = new TextEncoder().encode(secret);
  }
  return jwtSecret;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    request.user = {
      id: payload.sub ?? '',
      email: (payload.email as string | undefined) ?? '',
      role: (payload.role as string | undefined) ?? 'authenticated',
    };
  } catch {
    return reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}
