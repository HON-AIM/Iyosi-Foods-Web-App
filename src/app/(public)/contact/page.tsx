import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Iyosiola Group",
  description:
    "Get in touch with Iyosiola Group. Contact us for business inquiries, investment opportunities, product support, or partnership proposals. We're here to help.",
  keywords: [
    "contact Iyosiola Group",
    "Iyosiola customer support",
    "business inquiry Nigeria",
    "investment Nigeria",
    "flour company contact",
  ],
  openGraph: {
    title: "Contact Us | Iyosiola Group",
    description: "Get in touch with Iyosiola Group for business inquiries, investment opportunities, or product support.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
