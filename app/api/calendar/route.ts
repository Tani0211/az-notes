import {
  apiUser,
  db,
  json,
  errorResponse,
  ApiError,
} from '../../../lib/server';
import { validateCalendar } from '../../../lib/calendar';
export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    let calendar;
    try {
      calendar = validateCalendar(await req.json());
    } catch (e) {
      throw new ApiError(
        e instanceof Error ? e.message : 'Invalid phase calendar.',
      );
    }
    await db()
      .prepare(
        'INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      )
      .bind('phase-calendar', JSON.stringify(calendar))
      .run();
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
