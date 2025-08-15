'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw, Search, Clock, XCircle, CheckCircleIcon } from 'lucide-react';
import axios from 'axios';

import BookingModal from '@/app/components/modals/BookingModal'; // Updated path for page component

// Type definitions
interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
}

interface Schedule {
  available: boolean;
  date: string[]; // ISO date strings
}

interface CarId {
  _id: string;
  model: string;
  registrationNumber: string;
  pricePerDay: number;
  image: string;
  id: string;
}

interface Booking {
  customerInfo: CustomerInfo;
  schedule: Schedule;
  _id: string;
  carId: CarId;
  totalAmount: number;
  status: string;
  bookingId: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingsTableProps {
  data?: Booking[]; // Made optional since we'll fetch data internally
  apiUrl?: string; // Optional custom API URL
  refreshInterval?: number; // Optional auto-refresh interval in milliseconds
}

// Utility functions
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('en-GB', options);
};

const getBookedDays = (dates: string[]): number => {
  const uniqueDates = new Set(dates.map(date => date.split('T')[0]));
  return uniqueDates.size;
};

const formatCurrency = (amount: number): string => {
  return `KES ${amount.toLocaleString()}`;
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'text-light bg-accent rounded-full px-2 py-1';
    case 'confirmed':
      return 'text-light bg-success rounded-full px-2 py-1';
    case 'cancelled':
      return 'text-light bg-danger rounded-full px-2 py-1';
    case 'completed':
      return 'text-light bg-maintenance rounded-full px-2 py-1';
    default:
      return 'text-light bg-danger rounded-full px-2 py-1';
  }
};

// Action buttons component for cleaner code
const ActionButtons: React.FC<{ booking: Booking; onRefresh: () => void }> = ({ booking, onRefresh }) => {
  const status = booking.status.toLowerCase();
  
  // Convert your booking structure to match BookingModal expectations
  const modalBookingData = {
    id: booking._id,
    status: status as "pending" | "confirmed" | "cancelled" | "completed",
    customerName: booking.customerInfo.fullName,
    carCategory: booking.carId.model,
    bookingDate: booking.createdAt,
  };

  return (
    <div className="flex items-center gap-2">
      {/* Show different actions based on current status */}
      {status === 'pending' && (
        <>
          <BookingModal
            type="confirm"
            data={modalBookingData}
            id={booking._id}
            onSuccess={onRefresh}
          >
            <div className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-all duration-200 cursor-pointer">
              <CheckCircleIcon className="h-5 w-5 stroke-[2.5]" />
            </div>
          </BookingModal>
          
          <BookingModal
            type="cancel"
            data={modalBookingData}
            id={booking._id}
            onSuccess={onRefresh}
          >
            <div className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 cursor-pointer">
              <XCircle className="h-5 w-5 stroke-[2.5]" />
            </div>
          </BookingModal>
        </>
      )}
      
      {status === 'confirmed' && (
        <>
          <BookingModal
            type="complete"
            data={modalBookingData}
            id={booking._id}
            onSuccess={onRefresh}
          >
            <div className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 cursor-pointer">
              <Clock className="h-5 w-5 stroke-[2.5]" />
            </div>
          </BookingModal>
          
          <BookingModal
            type="cancel"
            data={modalBookingData}
            id={booking._id}
            onSuccess={onRefresh}
          >
            <div className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 cursor-pointer">
              <XCircle className="h-5 w-5 stroke-[2.5]" />
            </div>
          </BookingModal>
        </>
      )}
      
      {/* For cancelled or completed bookings, show view details only */}
      {(status === 'cancelled' || status === 'completed') && (
        <div className="text-gray-400 p-2">
          <span className="text-xs">No actions</span>
        </div>
      )}
    </div>
  );
};

const BookingsTable: React.FC<BookingsTableProps> = ({ 
  data: propData, 
  apiUrl = '/api/booking',
  refreshInterval 
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [bookings, setBookings] = useState<Booking[]>(propData || []);
  const [loading, setLoading] = useState<boolean>(!propData);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch bookings from API
  const fetchBookings = React.useCallback(async () => {
    try {
      setError(null);
      if (!propData) setLoading(true); // Only show loading if not using prop data
      
      const response = await axios.get<Booking[]>(apiUrl);
      setBookings(response.data);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || err.message 
        : 'Failed to fetch bookings';
      setError(errorMessage);
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, propData]);

  // Initial fetch and setup refresh interval
  useEffect(() => {
    // If prop data is provided, use it instead of fetching
    if (propData) {
      setBookings(propData);
      setLoading(false);
      return;
    }

    // Fetch data initially
    fetchBookings();

    // Setup auto-refresh if specified
    let intervalId: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchBookings, refreshInterval);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [propData, apiUrl, refreshInterval, fetchBookings]);

  // Update bookings when prop data changes
  useEffect(() => {
    if (propData) {
      setBookings(propData);
    }
  }, [propData]);

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customerInfo.fullName.toLowerCase().includes(term) ||
        booking.carId.model.toLowerCase().includes(term) ||
        booking.carId.registrationNumber.toLowerCase().includes(term) ||
        booking.bookingId.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key as keyof Booking] < b[sortConfig.key as keyof Booking]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key as keyof Booking] > b[sortConfig.key as keyof Booking]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [bookings, searchTerm, statusFilter, sortConfig]);

  // Handle sort request
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const toggleRowExpansion = (bookingId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full p-8 text-center bg-secondary rounded-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full p-8 text-center bg-secondary rounded-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-8 h-8 text-danger" />
          <p className="text-danger font-medium">Error loading bookings</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={fetchBookings}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-secondary rounded-lg">
        <p className="text-gray-500">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-dark">
          Bookings ({filteredBookings.length} of {bookings.length})
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bookings..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status filter dropdown */}
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {/* Refresh button */}
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-default">
          <thead>
            <tr className="bg-secondary-dark text-dark">
              <th 
                className="text-left p-4 font-semibold cursor-pointer hover:bg-earth-light/90"
                onClick={() => requestSort('customerInfo.fullName')}
              >
                Customer Name
                {sortConfig?.key === 'customerInfo.fullName' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="text-left p-4 font-semibold cursor-pointer hover:bg-earth-light/90"
                onClick={() => requestSort('carId.model')}
              >
                Car Model
                {sortConfig?.key === 'carId.model' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="text-left p-4 font-semibold cursor-pointer hover:bg-earth-light/90"
                onClick={() => requestSort('totalAmount')}
              >
                Total Amount
                {sortConfig?.key === 'totalAmount' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="text-left p-4 font-semibold cursor-pointer hover:bg-earth-light/90"
                onClick={() => requestSort('status')}
              >
                Status
                {sortConfig?.key === 'status' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="text-left p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <tr className="bg-light text-dark border-b border-gray-200 hover:bg-earth/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{booking.customerInfo.fullName}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{booking.carId.model}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-primary font-bold">
                        {formatCurrency(booking.totalAmount)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                       
                        {/* Expand/Collapse button */}
                        <button
                          onClick={() => toggleRowExpansion(booking.bookingId)}
                          className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-md transition-colors ml-2"
                          aria-label={expandedRows.has(booking.bookingId) ? 'Collapse details' : 'Expand details'}
                        >
                          {expandedRows.has(booking.bookingId) ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                         {/* Action buttons */}
                        <ActionButtons booking={booking} onRefresh={fetchBookings} />
                        
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(booking.bookingId) && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div className="bg-light p-4 rounded-lg mt-2 mx-4 mb-4 shadow-default">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-dark mb-2">Booking Details</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Booking ID:</span>
                                  <span className="ml-2 text-gray-700">{booking.bookingId}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span>
                                  <span className="ml-2 text-gray-700">{booking.customerInfo.email}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Phone:</span>
                                  <span className="ml-2 text-gray-700">{booking.customerInfo.phone}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-dark mb-2">Vehicle Details</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Registration:</span>
                                  <span className="ml-2 text-gray-700">{booking.carId.registrationNumber}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Booked Days:</span>
                                  <span className="ml-2 text-gray-700">{getBookedDays(booking.schedule.date)} days</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-dark mb-2">Schedule Dates</h4>
                              <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                                {booking.schedule.date.map((date, index) => (
                                  <div key={index} className="text-gray-700">
                                    {formatDate(date)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No bookings match your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// This is the actual page component that Next.js expects
const BookingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <BookingsTable />
    </div>
  );
};

export default BookingsPage;