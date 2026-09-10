import { viewer, listNotes, readingState } from '../../lib/server';
import { LibraryView } from '../../components/library';
export const dynamic = 'force-dynamic';
export default async function Library({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await viewer(true, '/library');
  const notes = await listNotes();
  const state = await readingState(user!.userId);
  const { view } = await searchParams;
  const initialView = view === 'saved' || view === 'completed' ? view : 'all';
  return (
    <LibraryView
      key={initialView}
      user={user!}
      notes={notes}
      initialState={state}
      initialView={initialView}
    />
  );
}
