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

export type ContentStatus = 'published' | 'draft';

export type Flashcard = {
  id: string;
  setId: string;
  question: string;
  answer: string;
  position: number;
  createdAt: number;
  updatedAt: number;
};

export type FlashcardSet = {
  id: string;
  name: string;
  topic: string;
  phase: number;
  tag: string;
  source: string;
  status: ContentStatus;
  fileName: string;
  cardCount: number;
  createdAt: number;
  updatedAt: number;
  cards: Flashcard[];
};

export type FlashcardView = Flashcard & {
  setName: string;
  topic: string;
  phase: number;
  tag: string;
  source: string;
};

export type ShortNote = {
  id: string;
  title: string;
  topic: string;
  phase: number;
  tag: string;
  source: string;
  body: string;
  code: string;
  language: string;
  imageKey: string;
  status: ContentStatus;
  createdAt: number;
  updatedAt: number;
};
