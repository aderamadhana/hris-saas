import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HRIS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <div className="prose prose-gray max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 mb-4">
                At HRIS ("we," "our," or "us"), we respect your privacy and are
                committed to protecting your personal data. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our Human Resource Information System
                platform ("Service").
              </p>
              <p className="text-gray-700 mb-4">
                Please read this Privacy Policy carefully. By using our Service,
                you agree to the collection and use of information in accordance
                with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.1 Information You Provide
              </h3>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us,
                including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  password, and organization details
                </li>
                <li>
                  <strong>Employee Data:</strong> Employee names, contact
                  information, job titles, departments, salary information, and
                  other HR-related data
                </li>
                <li>
                  <strong>Attendance Data:</strong> Check-in/check-out times,
                  location data (if enabled), and attendance status
                </li>
                <li>
                  <strong>Leave Data:</strong> Leave requests, leave balances,
                  and leave history
                </li>
                <li>
                  <strong>Payment Information:</strong> Credit card details and
                  billing addresses (processed securely through third-party
                  payment processors)
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.2 Information Collected Automatically
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Usage Data:</strong> Information about how you
                  interact with our Service
                </li>
                <li>
                  <strong>Device Information:</strong> IP address, browser type,
                  operating system, and device identifiers
                </li>
                <li>
                  <strong>Cookies:</strong> We use cookies and similar tracking
                  technologies to track activity on our Service
                </li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">
                We use the collected information for various purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process transactions and send related information</li>
                <li>
                  To send administrative information, updates, and security
                  alerts
                </li>
                <li>
                  To respond to your comments, questions, and support requests
                </li>
                <li>To monitor and analyze usage and trends</li>
                <li>
                  To detect, prevent, and address technical issues and fraud
                </li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Within Your Organization:</strong> Employee data is
                  shared with authorized users in your organization based on
                  their role and permissions
                </li>
                <li>
                  <strong>Service Providers:</strong> We share data with
                  third-party service providers who perform services on our
                  behalf (hosting, analytics, payment processing)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose
                  information if required by law or in response to valid
                  requests by public authorities
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security
                measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-700 mb-4">
                However, no method of transmission over the Internet is 100%
                secure. While we strive to protect your personal information, we
                cannot guarantee its absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Data Retention
              </h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to
                provide our Service and fulfill the purposes described in this
                Privacy Policy. When you delete your account or request data
                deletion, we will delete or anonymize your data within 30 days,
                unless we are required to retain it for legal or regulatory
                purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Your Rights and Choices
              </h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>
                  <strong>Access:</strong> Request access to your personal data
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your data
                </li>
                <li>
                  <strong>Portability:</strong> Request a copy of your data in a
                  structured format
                </li>
                <li>
                  <strong>Objection:</strong> Object to processing of your data
                </li>
                <li>
                  <strong>Restriction:</strong> Request restriction of
                  processing
                </li>
              </ul>
              <p className="text-gray-700 mb-4">
                To exercise these rights, please contact us at privacy@hris.com
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our Service</li>
                <li>Improve our Service and user experience</li>
                <li>Provide security features</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings. However,
                disabling cookies may affect functionality of the Service.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-gray-700 mb-4">
                Our Service is not intended for children under 18 years of age.
                We do not knowingly collect personal information from children
                under 18. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us.
              </p>
            </section>

            {/* International Users */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. International Data Transfers
              </h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and maintained on servers
                located outside of your country. By using our Service, you
                consent to the transfer of your information to countries that
                may have different data protection laws than your country.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date. We encourage you
                to review this Privacy Policy periodically.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@hris.com
                </p>
                <p className="text-gray-700">
                  <strong>Data Protection Officer:</strong> dpo@hris.com
                </p>
                <p className="text-gray-700">
                  <strong>Address:</strong> 123 Business Street, Suite 100,
                  City, State 12345
                </p>
              </div>
            </section>
          </div>

          {/* Back to Login */}
          <div className="mt-12 pt-8 border-t">
            <Link href="/login">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
