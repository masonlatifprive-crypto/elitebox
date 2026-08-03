import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function FAQ() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">What is EliteBoxMovies?</h3>
            <p className="text-muted-foreground">EliteBoxMovies is a premium streaming interface for legal addons and content providers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">How do I use it?</h3>
            <p className="text-muted-foreground">Simply browse through our catalog and connect your legal streaming providers to start watching.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
