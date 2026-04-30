import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  Briefcase,
  CreditCard,
  FileText,
  Gavel,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  RefreshCcw,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

const LAST_UPDATED = "January 1, 2025";

const TABLE_OF_CONTENTS = [
  { href: "#acceptance", label: "Acceptance of terms" },
  { href: "#eligibility", label: "Eligibility" },
  { href: "#accounts", label: "Accounts and security" },
  { href: "#organization", label: "Organization responsibilities" },
  { href: "#acceptable-use", label: "Acceptable use" },
  { href: "#subscription", label: "Subscription and billing" },
  { href: "#data", label: "Data and privacy" },
  { href: "#availability", label: "Service availability" },
  { href: "#intellectual-property", label: "Intellectual property" },
  { href: "#third-party", label: "Third-party services" },
  { href: "#termination", label: "Termination" },
  { href: "#disclaimer", label: "Disclaimer" },
  { href: "#liability", label: "Limitation of liability" },
  { href: "#changes", label: "Changes to terms" },
  { href: "#contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FBF8]">
      <header className="border-b border-[#0B5A43]/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5A43] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <Brand />
        </div>
      </header>

      <section className="border-b border-[#0B5A43]/10 bg-[#0B5A43]">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-5 py-12 text-white sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F7A81B]/25" />
          <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
              Legal information
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Terms of Service
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
              These terms explain the rules, responsibilities, and conditions
              for using the ARSADAYA HR management system.
            </p>

            <div className="mt-6 inline-flex rounded-md border border-[#F7A81B]/40 bg-[#F7A81B]/15 px-4 py-2 text-sm font-medium text-[#F7A81B]">
              Last updated: {LAST_UPDATED}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit lg:sticky lg:top-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              On this page
            </p>

            <nav className="mt-3 grid gap-1">
              {TABLE_OF_CONTENTS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-4 rounded-lg border border-[#F7A81B]/40 bg-[#FFF4D9] p-4">
            <p className="text-sm font-semibold text-[#0B5A43]">
              Important note
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#7A5A00]">
              This is a terms template. Review it with legal counsel before
              publishing it for real customers.
            </p>
          </div>
        </aside>

        <article className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<UserCheck className="h-5 w-5" />}
                title="Use responsibly"
                description="Users must follow company policy, applicable laws, and platform rules."
              />

              <SummaryCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Protect your account"
                description="Keep login credentials secure and report suspicious activity immediately."
              />

              <SummaryCard
                icon={<Briefcase className="h-5 w-5" />}
                title="Business use"
                description="ARSADAYA is intended for HR, attendance, leave, payroll, and workforce operations."
              />
            </div>
          </div>

          <div className="space-y-10 p-5 sm:p-8">
            <TermsSection
              id="acceptance"
              number="1"
              title="Acceptance of terms"
              icon={<BadgeCheck className="h-5 w-5" />}
            >
              <p>
                These Terms of Service govern your access to and use of
                ARSADAYA, including our website, application, platform, and
                related services. “ARSADAYA,” “we,” “our,” or “us” refers to the
                provider of the service.
              </p>

              <p>
                By creating an account, accessing the service, or using any part
                of the platform, you agree to be bound by these terms. If you do
                not agree, you must not access or use the service.
              </p>
            </TermsSection>

            <TermsSection
              id="eligibility"
              number="2"
              title="Eligibility"
              icon={<UserCheck className="h-5 w-5" />}
            >
              <p>
                The service is intended for workplace and business use. You must
                be legally able to enter into these terms and authorized to use
                the service on behalf of your organization where applicable.
              </p>

              <ul>
                <li>
                  You must provide accurate account and organization
                  information.
                </li>
                <li>
                  You must use the service only for lawful business purposes.
                </li>
                <li>
                  You must not use the service if you are prohibited by law from
                  doing so.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id="accounts"
              number="3"
              title="Accounts and security"
              icon={<KeyRound className="h-5 w-5" />}
            >
              <p>
                You are responsible for maintaining the confidentiality of your
                login credentials and for all activity that occurs under your
                account.
              </p>

              <ul>
                <li>Use a strong and unique password.</li>
                <li>Do not share your account with another person.</li>
                <li>
                  Notify your administrator or ARSADAYA if you suspect
                  unauthorized access.
                </li>
                <li>Keep your account information accurate and up to date.</li>
              </ul>

              <p>
                We may suspend or restrict access if we believe an account has
                been compromised, misused, or used in violation of these terms.
              </p>
            </TermsSection>

            <TermsSection
              id="organization"
              number="4"
              title="Organization responsibilities"
              icon={<Briefcase className="h-5 w-5" />}
            >
              <p>
                Organizations using ARSADAYA are responsible for managing their
                users, employee data, internal policies, payroll settings, leave
                rules, attendance rules, and access permissions.
              </p>

              <ul>
                <li>
                  Ensure employee information entered into the service is
                  accurate.
                </li>
                <li>Assign appropriate user roles and permissions.</li>
                <li>
                  Maintain internal HR, payroll, tax, and employment compliance.
                </li>
                <li>
                  Obtain any required consent before uploading employee data.
                </li>
                <li>
                  Review payroll, tax, leave, and attendance outputs before
                  relying on them.
                </li>
              </ul>

              <p>
                ARSADAYA provides tools to support HR operations, but the
                organization remains responsible for its employment decisions,
                payroll decisions, tax compliance, and legal obligations.
              </p>
            </TermsSection>

            <TermsSection
              id="acceptable-use"
              number="5"
              title="Acceptable use"
              icon={<Ban className="h-5 w-5" />}
            >
              <p>
                You agree not to misuse the service. Prohibited activities
                include:
              </p>

              <ul>
                <li>
                  Using the service for unlawful, fraudulent, or harmful
                  purposes.
                </li>
                <li>
                  Uploading malicious code, malware, or unauthorized scripts.
                </li>
                <li>
                  Attempting to bypass security, authentication, or access
                  controls.
                </li>
                <li>
                  Accessing, modifying, or extracting data without
                  authorization.
                </li>
                <li>
                  Interfering with service performance, stability, or
                  availability.
                </li>
                <li>
                  Using the service to violate privacy, employment, tax, or
                  labor laws.
                </li>
                <li>
                  Reverse engineering or copying the service except where
                  allowed by law.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id="subscription"
              number="6"
              title="Subscription, billing, and payment"
              icon={<CreditCard className="h-5 w-5" />}
            >
              <p>
                Some features may require a paid subscription. Subscription
                terms, pricing, billing cycles, renewal rules, and payment
                methods may be shown during sign-up, in an order form, or inside
                the application.
              </p>

              <ul>
                <li>
                  Fees are due according to the selected plan or agreement.
                </li>
                <li>
                  Subscriptions may renew automatically unless cancelled
                  according to the applicable plan terms.
                </li>
                <li>
                  Taxes, bank fees, and payment processing fees may apply.
                </li>
                <li>
                  Access may be suspended for late payment, failed payment, or
                  billing disputes.
                </li>
              </ul>

              <p>
                Unless required by law or stated in a separate written
                agreement, fees are non-refundable.
              </p>
            </TermsSection>

            <TermsSection
              id="data"
              number="7"
              title="Data and privacy"
              icon={<LockKeyhole className="h-5 w-5" />}
            >
              <p>
                Our handling of personal information is described in our Privacy
                Policy. By using the service, you acknowledge that information
                may be collected, used, stored, and processed as described in
                that policy.
              </p>

              <p>
                Your organization may control certain HR and employee data
                uploaded to the platform. If you are an employee user, some data
                requests may need to be directed to your employer or
                organization administrator.
              </p>

              <Link
                href="/privacy"
                className="inline-flex items-center rounded-md border border-[#0B5A43]/30 px-3 py-2 text-sm font-semibold text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0]"
              >
                Read Privacy Policy
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Link>
            </TermsSection>

            <TermsSection
              id="availability"
              number="8"
              title="Service availability and changes"
              icon={<RefreshCcw className="h-5 w-5" />}
            >
              <p>
                We aim to provide a reliable service, but we do not guarantee
                uninterrupted or error-free availability. The service may be
                unavailable due to maintenance, updates, infrastructure issues,
                internet disruptions, security events, or factors outside our
                control.
              </p>

              <p>
                We may update, modify, suspend, or discontinue parts of the
                service at any time. We may also introduce, remove, or change
                features to improve security, performance, compliance, or user
                experience.
              </p>
            </TermsSection>

            <TermsSection
              id="intellectual-property"
              number="9"
              title="Intellectual property"
              icon={<FileText className="h-5 w-5" />}
            >
              <p>
                ARSADAYA and its software, design, interface, workflows,
                documentation, branding, and related materials are owned by us
                or our licensors and are protected by intellectual property
                laws.
              </p>

              <p>
                Subject to these terms, we grant you a limited, non-exclusive,
                non-transferable, revocable right to use the service for your
                internal business purposes.
              </p>

              <p>
                You retain ownership of data that you or your organization
                submit to the service, subject to the rights necessary for us to
                provide, secure, maintain, and improve the service.
              </p>
            </TermsSection>

            <TermsSection
              id="third-party"
              number="10"
              title="Third-party services"
              icon={<LifeBuoy className="h-5 w-5" />}
            >
              <p>
                The service may integrate with or rely on third-party services,
                such as authentication providers, hosting providers, payment
                processors, analytics tools, email providers, or external APIs.
              </p>

              <p>
                Third-party services may be governed by their own terms and
                privacy policies. We are not responsible for third-party
                services that we do not control.
              </p>
            </TermsSection>

            <TermsSection
              id="termination"
              number="11"
              title="Suspension and termination"
              icon={<AlertTriangle className="h-5 w-5" />}
            >
              <p>
                We may suspend or terminate access to the service if we believe
                there has been a violation of these terms, a security risk,
                unlawful activity, non-payment, or misuse of the service.
              </p>

              <p>
                You may stop using the service at any time. Organization account
                termination, data export, and deletion may be subject to the
                applicable subscription agreement, legal requirements, and data
                retention obligations.
              </p>
            </TermsSection>

            <TermsSection
              id="disclaimer"
              number="12"
              title="Disclaimer"
              icon={<Gavel className="h-5 w-5" />}
            >
              <p>
                The service is provided on an “as is” and “as available” basis.
                To the maximum extent allowed by law, we disclaim all
                warranties, whether express, implied, statutory, or otherwise,
                including warranties of merchantability, fitness for a
                particular purpose, non-infringement, availability, and
                accuracy.
              </p>

              <p>
                ARSADAYA may provide tools that assist with HR, payroll,
                attendance, leave, or compliance workflows, but the service does
                not replace professional legal, tax, accounting, HR, or payroll
                advice.
              </p>
            </TermsSection>

            <TermsSection
              id="liability"
              number="13"
              title="Limitation of liability"
              icon={<Scale className="h-5 w-5" />}
            >
              <p>
                To the maximum extent permitted by law, ARSADAYA will not be
                liable for indirect, incidental, special, consequential,
                exemplary, or punitive damages, including lost profits, lost
                revenue, lost data, business interruption, or loss of goodwill.
              </p>

              <p>
                Our total liability for any claim related to the service will be
                limited to the amount paid by you or your organization for the
                service during the period stated in the applicable agreement, or
                the minimum amount allowed by law if no amount was paid.
              </p>
            </TermsSection>

            <TermsSection
              id="changes"
              number="14"
              title="Changes to these terms"
              icon={<RefreshCcw className="h-5 w-5" />}
            >
              <p>
                We may update these terms from time to time. If changes are
                material, we may notify users through the service, by email, or
                by updating the “Last updated” date on this page.
              </p>

              <p>
                Continued use of the service after changes become effective
                means you accept the updated terms.
              </p>
            </TermsSection>

            <TermsSection
              id="contact"
              number="15"
              title="Contact us"
              icon={<LifeBuoy className="h-5 w-5" />}
            >
              <p>
                For questions about these Terms of Service, contact us using the
                details below.
              </p>

              <div className="mt-4 rounded-lg border border-[#0B5A43]/15 bg-[#EAF5F0] p-4">
                <div className="grid gap-3 text-sm">
                  <ContactRow label="Legal email" value="legal@arsadaya.com" />
                  <ContactRow
                    label="Support email"
                    value="support@arsadaya.com"
                  />
                  <ContactRow
                    label="Address"
                    value="Replace this with your official company address"
                  />
                </div>
              </div>
            </TermsSection>
          </div>

          <div className="border-t border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Ready to access your workspace?
              </p>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-[#0B5A43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#084735]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <ArsadayaIcon size={36} />
      <div className="hidden sm:block">
        <p className="text-sm font-bold tracking-[0.25em] text-[#0B5A43]">
          ARSADAYA
        </p>
        <p className="mt-0.5 text-xs text-gray-500">HR management system</p>
      </div>
    </div>
  );
}

function ArsadayaIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 rounded-md"
    >
      <rect width="200" height="200" fill="#0B5A43" />
      <line
        x1="100"
        y1="52"
        x2="44"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="52"
        x2="156"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="65"
        y1="122"
        x2="135"
        y2="122"
        stroke="white"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <circle cx="100" cy="38" r="16" fill="#F7A81B" />
    </svg>
  );
}

function SummaryCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EAF5F0] text-[#0B5A43]">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}

function TermsSection({
  id,
  number,
  title,
  icon,
  children,
}: {
  id: string;
  number: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 border-b border-gray-100 pb-10 last:border-b-0 last:pb-0"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EAF5F0] text-[#0B5A43]">
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0B5A43]">
            Section {number}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
            {title}
          </h2>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-7 text-gray-700 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-gray-950">
        {children}
      </div>
    </section>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#0B5A43]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}
