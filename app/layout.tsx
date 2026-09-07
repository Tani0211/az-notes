import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
export const metadata: Metadata = {
  title: 'B15 Notes · The DSA notebook',
  icons: { icon: '/favicon.svg' },
  description:
    'A lecture notes and revision companion for AlgoZenith B15. Read DSA notes, revisit code, and track your learning.',
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
              "try{document.documentElement.dataset.theme=localStorage.getItem('b15-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch{}",
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
