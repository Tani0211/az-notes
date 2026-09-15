import { ShortNotesView } from '../../components/short-notes';
import { listShortNotes, viewer } from '../../lib/server';

export const dynamic = 'force-dynamic';

export default async function ShortNotesPage() {
  const user = await viewer(true, '/short-notes');
  const notes = await listShortNotes();
  return <ShortNotesView user={user!} notes={notes} />;
}
