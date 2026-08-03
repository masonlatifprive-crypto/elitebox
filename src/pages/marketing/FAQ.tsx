import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const FAQ = () => {
  const faqs = [
    {
      question: "What is EliteBox Movies?",
      answer: "EliteBox Movies is a premium streaming platform offering high-quality movies and TV shows across multiple devices."
    },
    {
      question: "How do I install the app?",
      answer: "You can download the app for Android, Windows, and Android TV from our official downloads page."
    },
    {
      question: "Is there a subscription fee?",
      answer: "We offer various tiers of service. Check our store for the latest pricing and features."
    }
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      <div className="grid gap-6 max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
