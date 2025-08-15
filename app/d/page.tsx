"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Car, 
  Users, 
  Bookmark, 
  CheckCircle, 
  Settings,
  Loader2
} from 'lucide-react';

type SummaryData = {
  totalCars: number;
  totalCategories: number;
  totalOwners: number;
  bookedCars: number;
  availableCars: number;
};

const Dashboard = () => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/dashboard');
        setSummaryData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  type SummaryCardProps = {
    title: string;
    value: number;
    icon: React.ReactNode;
    bgColor: string;
  };

  const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, bgColor }) => (
    <div className={`${bgColor} p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-2 bg-white rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-2 rounded-lg shadow-sm max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return null; // Shouldn't reach here due to loading/error states
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Car Hiring Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your fleet, bookings, and owners</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            title="Total Cars"
            value={summaryData.totalCars}
            icon={<Car className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <SummaryCard
            title="Categories"
            value={summaryData.totalCategories}
            icon={<Settings className="w-6 h-6 text-purple-600" />}
            bgColor="bg-purple-50"
          />
          <SummaryCard
            title="Car Owners"
            value={summaryData.totalOwners}
            icon={<Users className="w-6 h-6 text-green-600" />}
            bgColor="bg-green-50"
          />
          <SummaryCard
            title="Booked Cars"
            value={summaryData.bookedCars}
            icon={<Bookmark className="w-6 h-6 text-orange-600" />}
            bgColor="bg-orange-50"
          />
          <SummaryCard
            title="Available Cars"
            value={summaryData.availableCars}
            icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
            bgColor="bg-emerald-50"
          />
        </div>

       
      </div>
    </div>
  );
};

export default Dashboard;