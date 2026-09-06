import { viewer, findNote, listNotes, readingState } from '../../../lib/server';
import { notFound } from 'next/navigation';
import { Reader } from '../../../components/reader';
export const dynamic = 'force-dynamic';
async function NoteContent({ id }: { id: string }) {
  const user = await viewer(true, '/notes/' + encodeURIComponent(id));
  const note = await findNote(id, user!.admin);
  if (!note) notFound();
  const state = await readingState(user!.userId);
  const others = (await listNotes()).filter((n) => n.id !== id);
  const related = [
    ...others.filter((n) => n.topic === note.topic),
    ...others.filter((n) => n.topic !== note.topic),
  ]
    .slice(0, 3)
    .map(({ id, title }) => ({ id, title }));
  return (
    <Reader
      user={user!}
      note={note}
      initialState={state.find((s) => s.noteId === id) || null}
      related={related}
    />
  );
}
export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteContent id={id} />;
}
