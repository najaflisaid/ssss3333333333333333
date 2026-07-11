const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-12 max-w-5xl mx-auto">
      <h1 className="text-4xl font-serif font-semibold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-muted-foreground">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
          <p>
            Welcome to epagesaz.com ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">2. Information We Collect</h2>
          <p>We collect information that you provide directly to us when you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Register for an account</li>
            <li>Upload books or content</li>
            <li>Make purchases or transactions</li>
            <li>Contact us for support</li>
            <li>Subscribe to our newsletter</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-4">Information collected may include:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number</li>
            <li><strong>Account Information:</strong> Username, password, profile information</li>
            <li><strong>Business Information:</strong> Store name, business type (for business accounts)</li>
            <li><strong>Payment Information:</strong> Transaction details (payment processing handled by third parties)</li>
            <li><strong>Content:</strong> Books, PDFs, images, and other content you upload</li>
            <li><strong>Usage Data:</strong> Device information, IP address, browser type, pages visited</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process your transactions and manage your account</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Communicate with you about products, services, offers, and events</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and fraudulent activity</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">4. Information Sharing and Disclosure</h2>
          <p>We may share your information in the following situations:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            <li><strong>Service Providers:</strong> Third-party companies that help us operate our platform (e.g., hosting, analytics, payment processing)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
            <li><strong>Public Information:</strong> Book listings, reviews, and profile information you choose to make public</li>
          </ul>
          <p className="mt-4">
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. When we no longer need your information, we will securely delete or anonymize it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">7. Children's Privacy</h2>
          <p>
            Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">8. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Restriction:</strong> Request restriction of processing your information</li>
            <li><strong>Portability:</strong> Request transfer of your information to another service</li>
            <li><strong>Objection:</strong> Object to our processing of your information</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at <a href="mailto:epagesaz@gmail.com" className="text-primary hover:underline">epagesaz@gmail.com</a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">9. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to collect and track information about your activity on our website. Cookies are small data files stored on your device. You can control cookies through your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">10. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read the privacy policies of any third-party sites you visit.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">11. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. By using our services, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">13. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <div className="pl-6">
            <p><strong>Email:</strong> <a href="mailto:epagesaz@gmail.com" className="text-primary hover:underline">epagesaz@gmail.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+994773770383" className="text-primary hover:underline">+994 77 377 03 83</a></p>
            <p><strong>Website:</strong> <a href="https://epagesaz.com" className="text-primary hover:underline">https://epagesaz.com</a></p>
          </div>
        </section>

        <section className="space-y-4 mt-12 pt-8 border-t">
          <h2 className="text-2xl font-semibold">14. GDPR Compliance (For European Users)</h2>
          <p>
            If you are located in the European Economic Area (EEA), you have certain rights under the General Data Protection Regulation (GDPR):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to be informed about data collection</li>
            <li>Right of access to your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Rights related to automated decision-making</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, please contact us at <a href="mailto:epagesaz@gmail.com" className="text-primary hover:underline">epagesaz@gmail.com</a>
          </p>
        </section>

        <div className="mt-12 p-6 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Consent:</strong> By using our website and services, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
