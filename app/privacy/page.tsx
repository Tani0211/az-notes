import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicLegal } from '../../components/public-legal';

export const metadata: Metadata = {
  title: 'Privacy · AZ Notes',
  description: 'How AZ Notes handles learner account and revision data.',
};

export default function PrivacyPage() {
  return (
    <PublicLegal
      eyebrow="PRIVACY"
      title="Your learning data stays yours."
      intro="This page explains what AZ Notes stores and why. It was last updated on 9 September 2026."
    >
      <section>
        <h2>Information we collect</h2>
        <p>
          When you sign in with Google, AZ Notes receives your name, email
          address, and profile picture. We also store your saved notes, revision
          status, last reading page, recent activity, and note open or download
          events.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use this information to sign you in, restore your learning
          progress, show the current online count, protect note access, and
          provide aggregate usage information to site administrators. We do not
          sell your personal information.
        </p>
      </section>
      <section>
        <h2>Services that support AZ Notes</h2>
        <p>
          The site uses Google for sign-in, Vercel for hosting and private file
          storage, Neon for the application database, and Vercel Speed Insights
          for performance measurement. Some older note files are delivered from
          Google Drive.
        </p>
      </section>
      <section>
        <h2>Choices and deletion</h2>
        <p>
          You can stop using the service at any time and remove its Google
          account connection from your Google Account settings. To request
          deletion of your AZ Notes account or learning data, email{' '}
          <Link href="mailto:singhalrashmi0211@gmail.com">
            singhalrashmi0211@gmail.com
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>
          For privacy questions, contact{' '}
          <Link href="mailto:singhalrashmi0211@gmail.com">
            singhalrashmi0211@gmail.com
          </Link>
          .
        </p>
      </section>
    </PublicLegal>
  );
}
