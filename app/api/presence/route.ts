import { apiUser, db, touch, json, errorResponse } from '../../../lib/server';
export async function POST(req: Request) {
  try {
    const user = await apiUser(req);
    await touch(user);
    const count = await db()
      .prepare('SELECT COUNT(*) AS total FROM members WHERE lastSeen >= ?')
      .bind(Date.now() - 120000)
      .first<{ total: number }>();
    return json({ online: count?.total || 0 });
  } catch (e) {
    return errorResponse(e);
  }
}
