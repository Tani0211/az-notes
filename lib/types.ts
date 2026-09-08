export type Note = {
  id: string;
  title: string;
  topic: string;
  date: string;
  week: number;
  phase: number;
  summary: string;
  driveUrl: string;
  fileKey: string;
  status: 'published' | 'draft';
  updatedAt?: number;
};
export type ReadingState = {
  noteId: string;
  saved: number;
  completed: number;
  lastPage: number;
};
export type Viewer = {
  userId: string;
  email: string;
  displayName: string;
  admin: boolean;
  owner: boolean;
  signOutPath: string;
};
