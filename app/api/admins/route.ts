import {
  apiUser,
  db,
  json,
  errorResponse,
  ApiError,
  ADMIN_EMAIL,
} from '../../../lib/server';
export async function POST(req: Request) {
  try {
    const u = await apiUser(req, true);
    if (!u.owner)
      throw new ApiError('Only the owner can manage admin access.', 403);
    const data = (await req.json()) as { email?: unknown; action?: unknown };
    if (
      typeof data.email !== 'string' ||
      data.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    )
      throw new ApiError('Enter a valid email address.');
    const email = data.email.trim().toLowerCase();
    if (email === ADMIN_EMAIL)
      throw new ApiError('The owner already has permanent admin access.');
    if (data.action === 'remove') {
      await db().prepare('DELETE FROM admins WHERE email=?').bind(email).run();
    } else if (data.action === 'add') {
      await db()
        .prepare(
          'INSERT OR IGNORE INTO admins (email,addedBy,createdAt) VALUES (?,?,?)',
        )
        .bind(email, u.userId, Date.now())
        .run();
    } else throw new ApiError('Invalid action.');
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
