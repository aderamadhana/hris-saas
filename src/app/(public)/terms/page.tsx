import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            Terms of Service
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
                Welcome to HRIS ("we," "our," or "us"). These Terms of Service
                ("Terms") govern your access to and use of our Human Resource
                Information System platform, including our website,
                applications, and related services (collectively, the
                "Service").
              </p>
              <p className="text-gray-700 mb-4">
                By accessing or using our Service, you agree to be bound by
                these Terms. If you disagree with any part of these Terms, you
                may not access the Service.
              </p>
            </section>

            {/* Accounts */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Accounts and Registration
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>2.1 Account Creation:</strong> To use certain features
                of our Service, you must register for an account. You agree to
                provide accurate, current, and complete information during
                registration.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>2.2 Account Security:</strong> You are responsible for
                maintaining the confidentiality of your account credentials and
                for all activities that occur under your account.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>2.3 Organization Accounts:</strong> If you are
                registering on behalf of an organization, you represent that you
                have authority to bind that organization to these Terms.
              </p>
            </section>

            {/* Use of Service */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Use of Service
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>3.1 License:</strong> Subject to these Terms, we grant
                you a limited, non-exclusive, non-transferable license to access
                and use the Service for your internal business purposes.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>3.2 Prohibited Uses:</strong> You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>
                  Attempt to gain unauthorized access to any portion of the
                  Service
                </li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Transmit any viruses, malware, or harmful code</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Remove or alter any proprietary notices</li>
              </ul>
            </section>

            {/* Data and Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Data and Privacy
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>4.1 Your Data:</strong> You retain all rights to the
                data you submit to the Service ("Your Data"). By using the
                Service, you grant us a license to use Your Data solely to
                provide and improve the Service.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>4.2 Privacy:</strong> Our collection and use of personal
                information is described in our{" "}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-gray-700 mb-4">
                <strong>4.3 Data Security:</strong> We implement reasonable
                security measures to protect Your Data, but cannot guarantee
                absolute security.
              </p>
            </section>

            {/* Subscription and Payment */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Subscription and Payment
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>5.1 Subscription Plans:</strong> We offer various
                subscription plans with different features and pricing. Details
                are available on our pricing page.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>5.2 Billing:</strong> Subscription fees are billed in
                advance on a recurring basis. You authorize us to charge your
                payment method automatically.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>5.3 Cancellation:</strong> You may cancel your
                subscription at any time. Cancellation will be effective at the
                end of the current billing period.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>5.4 Refunds:</strong> Fees are non-refundable except as
                required by law or as expressly stated in these Terms.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and
                functionality are owned by HRIS and are protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Termination
              </h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to the
                Service immediately, without prior notice, if you breach these
                Terms. Upon termination, your right to use the Service will
                cease immediately.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, HRIS shall not be liable
                for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, or any loss of data, use,
                goodwill, or other intangible losses.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Disclaimer
              </h2>
              <p className="text-gray-700 mb-4">
                The Service is provided "as is" and "as available" without
                warranties of any kind, either express or implied, including but
                not limited to warranties of merchantability, fitness for a
                particular purpose, and non-infringement.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Changes to Terms
              </h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will
                notify you of any changes by posting the new Terms on this page
                and updating the "Last updated" date. Your continued use of the
                Service after such changes constitutes your acceptance of the
                new Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@hris.com
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
