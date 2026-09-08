import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
export const metadata: Metadata = {
  title: 'AZ Notes · The DSA notebook',
  icons: { icon: '/favicon.svg' },
  description:
    'A structured digital DSA notes library for students everywhere. Read notes, save your place, and track your revision.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('az-notes-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch{}",
          }}
        />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
