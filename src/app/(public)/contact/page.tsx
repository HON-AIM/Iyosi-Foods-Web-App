import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Iyosi Foods Group",
  description:
    "Get in touch with Iyosi Foods Group. Contact us for business inquiries, investment opportunities, product support, or partnership proposals. We're here to help.",
  keywords: [
    "contact Iyosi Foods Group",
    "Iyosi Foods customer support",
    "business inquiry Nigeria",
    "investment Nigeria",
    "flour company contact",
  ],
  openGraph: {
    title: "Contact Us | Iyosi Foods Group",
    description: "Get in touch with Iyosi Foods Group for business inquiries, investment opportunities, or product support.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
