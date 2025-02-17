'use client';

import { BusinessCaseForm } from '@/components/BusinessCaseForm';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Business Case Generator
        </h1>
        <BusinessCaseForm />
      </div>
    </main>
  );
}
