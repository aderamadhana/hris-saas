import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Cookie,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";

const LAST_UPDATED = "January 1, 2025";

const TABLE_OF_CONTENTS = [
  { href: "#introduction", label: "Introduction" },
  { href: "#information-we-collect", label: "Information we collect" },
  { href: "#how-we-use-information", label: "How we use information" },
  { href: "#sharing", label: "Information sharing" },
  { href: "#security", label: "Data security" },
  { href: "#retention", label: "Data retention" },
  { href: "#rights", label: "Your rights" },
  { href: "#cookies", label: "Cookies" },
  { href: "#children", label: "Children’s privacy" },
  { href: "#international", label: "International transfers" },
  { href: "#changes", label: "Policy changes" },
  { href: "#contact", label: "Contact" },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
              This policy explains how ARSADAYA collects, uses, stores, and
              protects information when you use our HR management system.
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
              This is a product policy template. Review it with legal counsel
              before using it publicly.
            </p>
          </div>
        </aside>

        <article className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="We protect HR data"
                description="Employee, attendance, leave, and payroll data are handled with access controls."
              />

              <SummaryCard
                icon={<LockKeyhole className="h-5 w-5" />}
                title="We do not sell data"
                description="Personal information is not sold to advertisers or external marketers."
              />

              <SummaryCard
                icon={<Mail className="h-5 w-5" />}
                title="You can contact us"
                description="Privacy questions can be sent to the contact listed at the end of this policy."
              />
            </div>
          </div>

          <div className="space-y-10 p-5 sm:p-8">
            <PolicySection
              id="introduction"
              number="1"
              title="Introduction"
              icon={<FileText className="h-5 w-5" />}
            >
              <p>
                At ARSADAYA, “we,” “our,” or “us” refers to the provider of the
                HR management system. This Privacy Policy explains how we
                collect, use, disclose, store, and protect personal information
                when you use our platform, website, applications, and related
                services.
              </p>

              <p>
                By using the service, you acknowledge that your information will
                be handled as described in this policy.
              </p>
            </PolicySection>

            <PolicySection
              id="information-we-collect"
              number="2"
              title="Information we collect"
              icon={<Database className="h-5 w-5" />}
            >
              <h3>Information you provide</h3>
              <p>
                We collect information that you, your employer, or authorized
                administrators provide directly to the service, including:
              </p>

              <ul>
                <li>
                  <strong>Account information:</strong> name, email address,
                  password credentials, and organization details.
                </li>
                <li>
                  <strong>Employee data:</strong> employee names, contact
                  details, job title, department, employment status, salary
                  information, and HR-related records.
                </li>
                <li>
                  <strong>Attendance data:</strong> check-in and check-out time,
                  attendance status, shift details, and location data if enabled
                  by the organization.
                </li>
                <li>
                  <strong>Leave data:</strong> leave requests, leave balances,
                  approvals, documents, notes, and leave history.
                </li>
                <li>
                  <strong>Payroll-related data:</strong> compensation,
                  deductions, benefits, tax settings, payslip information, and
                  related payroll records.
                </li>
              </ul>

              <h3>Information collected automatically</h3>
              <ul>
                <li>
                  <strong>Usage data:</strong> actions taken in the application,
                  pages visited, and product interaction data.
                </li>
                <li>
                  <strong>Device data:</strong> IP address, browser type,
                  operating system, device identifiers, and session information.
                </li>
                <li>
                  <strong>Cookies and similar technologies:</strong> data used
                  to support authentication, security, preferences, and
                  analytics.
                </li>
              </ul>
            </PolicySection>

            <PolicySection
              id="how-we-use-information"
              number="3"
              title="How we use your information"
              icon={<Users className="h-5 w-5" />}
            >
              <p>We use collected information to:</p>

              <ul>
                <li>Provide, operate, maintain, and improve the service.</li>
                <li>Authenticate users and protect accounts.</li>
                <li>
                  Manage employee records, attendance, leave, and payroll
                  workflows.
                </li>
                <li>
                  Process requests, approvals, notifications, and administrative
                  actions.
                </li>
                <li>
                  Respond to support requests and communicate service updates.
                </li>
                <li>
                  Monitor usage, troubleshoot errors, and improve product
                  reliability.
                </li>
                <li>
                  Detect, prevent, and respond to fraud, abuse, or security
                  incidents.
                </li>
                <li>
                  Comply with applicable legal, tax, employment, and regulatory
                  obligations.
                </li>
              </ul>
            </PolicySection>

            <PolicySection
              id="sharing"
              number="4"
              title="Information sharing and disclosure"
              icon={<ArrowUpRight className="h-5 w-5" />}
            >
              <p>
                We do not sell your personal information. We may share
                information only in limited situations, including:
              </p>

              <ul>
                <li>
                  <strong>Within your organization:</strong> employee data may
                  be visible to authorized users based on their role,
                  permissions, and company settings.
                </li>
                <li>
                  <strong>Service providers:</strong> we may use trusted
                  providers for hosting, authentication, analytics,
                  communications, storage, support, or payment processing.
                </li>
                <li>
                  <strong>Legal requirements:</strong> we may disclose
                  information if required by law, regulation, court order, or
                  lawful government request.
                </li>
                <li>
                  <strong>Business transfers:</strong> information may be
                  transferred as part of a merger, acquisition, financing,
                  restructuring, or sale of assets.
                </li>
              </ul>
            </PolicySection>

            <PolicySection
              id="security"
              number="5"
              title="Data security"
              icon={<LockKeyhole className="h-5 w-5" />}
            >
              <p>
                We apply technical and organizational safeguards designed to
                protect personal information. These may include:
              </p>

              <ul>
                <li>Encryption for data in transit.</li>
                <li>Access controls and role-based permissions.</li>
                <li>Authentication and account protection measures.</li>
                <li>Monitoring, logging, and security review processes.</li>
                <li>
                  Regular updates to infrastructure and application security.
                </li>
              </ul>

              <p>
                No system is completely secure. We cannot guarantee absolute
                security, but we work to protect information using reasonable
                safeguards appropriate to the nature of the data.
              </p>
            </PolicySection>

            <PolicySection
              id="retention"
              number="6"
              title="Data retention"
              icon={<Database className="h-5 w-5" />}
            >
              <p>
                We retain personal information for as long as necessary to
                provide the service, support business operations, comply with
                legal obligations, resolve disputes, enforce agreements, and
                maintain accurate HR and payroll records.
              </p>

              <p>
                If an account is deleted or a deletion request is approved, data
                may be deleted, anonymized, or retained where required for
                legal, tax, audit, payroll, employment, or security purposes.
              </p>
            </PolicySection>

            <PolicySection
              id="rights"
              number="7"
              title="Your rights and choices"
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              <p>
                Depending on your location and applicable law, you may have
                rights related to your personal information, including:
              </p>

              <ul>
                <li>Accessing personal data held about you.</li>
                <li>Correcting inaccurate or incomplete data.</li>
                <li>Requesting deletion of certain personal data.</li>
                <li>Requesting a copy of your data in a structured format.</li>
                <li>
                  Objecting to or restricting certain processing activities.
                </li>
                <li>
                  Withdrawing consent where processing is based on consent.
                </li>
              </ul>

              <p>
                Some employee-related requests may need to be handled through
                your employer or organization administrator because they control
                parts of the HR data stored in the service.
              </p>
            </PolicySection>

            <PolicySection
              id="cookies"
              number="8"
              title="Cookies and tracking technologies"
              icon={<Cookie className="h-5 w-5" />}
            >
              <p>
                We use cookies and similar technologies to keep users signed in,
                remember preferences, improve security, understand product
                usage, and improve the user experience.
              </p>

              <p>
                You can control cookies through your browser settings. Disabling
                certain cookies may affect authentication, security, or core
                application functionality.
              </p>
            </PolicySection>

            <PolicySection
              id="children"
              number="9"
              title="Children’s privacy"
              icon={<Users className="h-5 w-5" />}
            >
              <p>
                The service is intended for workplace and business use. It is
                not directed to children under 18. We do not knowingly collect
                personal information from children under 18 through the service.
              </p>
            </PolicySection>

            <PolicySection
              id="international"
              number="10"
              title="International data transfers"
              icon={<Globe2 className="h-5 w-5" />}
            >
              <p>
                Your information may be processed or stored in countries outside
                your country of residence. When this happens, we take reasonable
                steps to protect personal information in accordance with
                applicable privacy and data protection requirements.
              </p>
            </PolicySection>

            <PolicySection
              id="changes"
              number="11"
              title="Changes to this Privacy Policy"
              icon={<FileText className="h-5 w-5" />}
            >
              <p>
                We may update this Privacy Policy from time to time. If we make
                material changes, we may notify users through the service, by
                email, or by updating the “Last updated” date on this page.
              </p>
            </PolicySection>

            <PolicySection
              id="contact"
              number="12"
              title="Contact us"
              icon={<Mail className="h-5 w-5" />}
            >
              <p>
                For privacy-related questions, requests, or concerns, contact us
                using the details below.
              </p>

              <div className="mt-4 rounded-lg border border-[#0B5A43]/15 bg-[#EAF5F0] p-4">
                <div className="grid gap-3 text-sm">
                  <ContactRow
                    label="Privacy email"
                    value="privacy@arsadaya.com"
                  />
                  <ContactRow
                    label="Data protection"
                    value="dpo@arsadaya.com"
                  />
                  <ContactRow
                    label="Address"
                    value="Replace this with your official company address"
                  />
                </div>
              </div>
            </PolicySection>
          </div>

          <div className="border-t border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Need to access your account?
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

function PolicySection({
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

      <div className="space-y-4 text-sm leading-7 text-gray-700 [&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-950 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-gray-950">
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
