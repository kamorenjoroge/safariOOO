// app/d/not-found.tsx
import Link from 'next/link';
import { Settings, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
          <Settings className="h-6 w-6 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Resource Not Found</h1>
        <p className="text-gray-600 mb-6">
          The dashboard resource you requested doesnt exist or isnt available.
        </p>
        <div className="flex flex-col space-y-3">
          <Link
            href="/d"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to main dashboard
          </Link>
          <p className="text-sm text-gray-500">
            Contact support if you believe this is an error
          </p>
        </div>
      </div>
    </div>
  );
}