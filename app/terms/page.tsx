import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicLegal } from '../../components/public-legal';

export const metadata: Metadata = {
  title: 'Terms · AZ Notes',
  description: 'Terms for using the AZ Notes learning library.',
};

export default function TermsPage() {
  return (
    <PublicLegal
      eyebrow="TERMS"
      title="A shared library for thoughtful learning."
      intro="These terms apply when you use AZ Notes. They were last updated on 9 September 2026."
    >
      <section>
        <h2>Using the library</h2>
        <p>
          AZ Notes provides digital DSA notes for personal learning and
          revision. You may read and download material made available to your
          signed-in account. Do not disrupt the service, bypass access controls,
          or use the site in a way that harms other learners.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <p>
          Google sign-in is required to access the library. You are responsible
          for the activity associated with your Google account. Administrator
          access is granted separately by the site owner.
        </p>
      </section>
      <section>
        <h2>Learning material</h2>
        <p>
          The notes are educational references and may contain mistakes or
          become outdated. Check important details against course material and
          official documentation. Linked services and resources may have their
          own terms.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          Features and content may change as the library develops. Access may be
          limited when needed to protect the service or its users.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          For questions about these terms, email{' '}
          <Link href="mailto:singhalrashmi0211@gmail.com">
            singhalrashmi0211@gmail.com
          </Link>
          .
        </p>
      </section>
    </PublicLegal>
  );
}
