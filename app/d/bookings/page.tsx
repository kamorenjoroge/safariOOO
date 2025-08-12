"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import BookingModal from "@/app/components/modals/BookingModal";
import { 
  Car, 
  FilterIcon, 
  Loader2, 
  SearchCheckIcon, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  XCircle,
  CheckSquare,
  Eye,
  EyeOff,
  FileText
} from "lucide-react";

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
}

export interface CarInfo {
  _id: string;
  model: string;
  registrationNumber: string;
  pricePerDay: number;
  image: string;
  id: string;
}

export interface Schedule {
  _id: string;
  available: boolean;
  date: string[];
  id: string;
}

export interface Booking {
  _id?: string;
  customerInfo: CustomerInfo;
  carId: CarInfo;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  specialRequests?: string;
  schedule: Schedule[];
  bookingId: string;
  createdAt?: string;
  updatedAt?: string;
  id: string;
}

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (bookingId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(bookingId)) {
      newExpandedRows.delete(bookingId);
    } else {
      newExpandedRows.add(bookingId);
    }
    setExpandedRows(newExpandedRows);
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/booking");

      // If the response is an array
      if (Array.isArray(response.data)) {
        setBookings(response.data);
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        // For future-proofing if you change the API format
        setBookings(response.data.data);
      } else {
        setError("Invalid data format from server");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "An error occurred while fetching bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Function to refresh bookings after CRUD operations
  const handleSuccess = () => {
    fetchBookings(); // Refetch from API
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.carId.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.carId.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Format date range for schedule
  const formatScheduleDate = (dateArray: string[]) => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length === 0) return "No dates";
    
    // Sort dates to ensure proper order
    const sortedDates = dateArray.map(date => new Date(date)).sort((a, b) => a.getTime() - b.getTime());
    
    if (dateArray.length === 1) {
      // Single date booking
      return sortedDates[0].toLocaleDateString();
    } else if (dateArray.length === 2) {
      // Two specific dates
      return `${sortedDates[0].toLocaleDateString()}, ${sortedDates[1].toLocaleDateString()}`;
    } else if (dateArray.length <= 5) {
      // Few dates - show them all
      return sortedDates.map(date => date.toLocaleDateString()).join(', ');
    } else {
      // Many dates - show first, last and count
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      return `${firstDate.toLocaleDateString()} ... ${lastDate.toLocaleDateString()} (+${dateArray.length - 2} more)`;
    }
  };

  // Calculate rental duration - simply count the array length
  const calculateRentalDays = (dateArray: string[]) => {
    // The array length IS the number of booking days
    return dateArray && Array.isArray(dateArray) ? dateArray.length : 0;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">
            Bookings Management
          </h1>
          <p className="text-earth-light">
            {loading ? "Loading..." : `${bookings.length} total bookings`}
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-danger/10 border border-danger text-danger p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchBookings}
              className="px-3 py-1 bg-danger text-white rounded hover:bg-danger/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-light p-4 rounded-xl border border-secondary-dark">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-light w-4 h-4" />
            <input
              id="booking-search"
              name="booking-search"
              placeholder="Search by customer name, email, booking ID, or car..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          <select
            id="status-filter"
            name="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            className="flex items-center gap-2 px-4 py-2 border border-secondary-dark rounded-lg hover:bg-secondary transition-colors"
            disabled={loading}
          >
            <FilterIcon />
            More Filters
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
          <span className="ml-2 text-earth">Loading bookings...</span>
        </div>
      )}

      {/* Bookings table */}
      {!loading && (
        <div className="bg-light rounded-xl border border-secondary-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-secondary-dark">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">Booking ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-dark">
                {currentBookings.map((booking) => (
                  <React.Fragment key={booking._id || booking.id}>
                    {/* Main row */}
                    <tr className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-primary">{booking.bookingId}</div>
                        <div className="text-xs text-earth/70">
                          {new Date(booking.createdAt!).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-earth">{booking.customerInfo.fullName}</div>
                            <div className="text-sm text-earth/70">{booking.customerInfo.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 relative rounded-lg overflow-hidden">
                            {booking.carId.image ? (
                              <Image
                                src={booking.carId.image}
                                alt={booking.carId.model}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary-light flex items-center justify-center">
                                <Car className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-earth">{booking.carId.model}</div>
                            <div className="text-sm text-earth/70">{booking.carId.registrationNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-primary">
                          KES {booking.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-earth/70">
                          {booking.schedule && booking.schedule.length > 0 && Array.isArray(booking.schedule[0].date) && booking.schedule[0].date.length > 0
                            ? `${calculateRentalDays(booking.schedule[0].date)} days`
                            : 'Duration N/A'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {/* View Details Button */}
                          <button
                            onClick={() => toggleRowExpansion(booking._id!)}
                            className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                            title="View details"
                          >
                            {expandedRows.has(booking._id!) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          {/* Status Action Buttons */}
                          {booking.status === 'pending' && (
                            <>
                              <BookingModal 
                                type="confirm" 
                                id={booking._id} 
                                data={booking} 
                                onSuccess={handleSuccess}
                              >
                                <button
                                  className="p-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                                  title="Confirm booking"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </BookingModal>

                              <BookingModal 
                                type="cancel" 
                                id={booking._id} 
                                data={booking} 
                                onSuccess={handleSuccess}
                              >
                                <button
                                  className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                                  title="Cancel booking"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </BookingModal>
                            </>
                          )}

                          {booking.status === 'confirmed' && (
                            <BookingModal 
                              type="complete" 
                              id={booking._id} 
                              data={booking} 
                              onSuccess={handleSuccess}
                            >
                              <button
                                className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                                title="Complete booking"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </button>
                            </BookingModal>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {expandedRows.has(booking._id!) && (
                      <tr className="bg-secondary/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Customer Details */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-primary-dark flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Customer Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-earth">
                                  <Mail className="w-3 h-3" />
                                  {booking.customerInfo.email}
                                </div>
                                <div className="flex items-center gap-2 text-earth">
                                  <Phone className="w-3 h-3" />
                                  {booking.customerInfo.phone}
                                </div>
                                <div className="flex items-center gap-2 text-earth">
                                  <FileText className="w-3 h-3" />
                                  ID: {booking.customerInfo.idNumber}
                                </div>
                              </div>
                            </div>

                            {/* Schedule Details */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-primary-dark flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Schedule Details
                              </h4>
                              <div className="space-y-2">
                                {booking.schedule && Array.isArray(booking.schedule) 
                                  ? booking.schedule.map((schedule, index) => (
                                      <div key={schedule._id || schedule.id || `schedule-${index}`} className="p-3 bg-light rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-earth">
                                            Schedule {index + 1}
                                          </span>
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            schedule.available 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {schedule.available ? 'Available' : 'Unavailable'}
                                          </span>
                                        </div>
                                        <div className="text-sm text-earth/70">
                                          <strong>Booking dates:</strong> {formatScheduleDate(schedule.date)}
                                        </div>
                                        <div className="text-xs text-earth/60 mt-1">
                                          Total days: {calculateRentalDays(schedule.date)} days
                                        </div>
                                      </div>
                                    ))
                                  : (
                                      <div className="p-3 bg-light rounded-lg border">
                                        <div className="text-sm text-earth/70">
                                          No schedule information available
                                        </div>
                                      </div>
                                    )
                                }
                              </div>
                            </div>

                            {/* Booking Summary */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-primary-dark flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Booking Summary
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-earth">Daily Rate:</span>
                                  <span className="font-medium">KES {booking.carId.pricePerDay.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-earth">Total Amount:</span>
                                  <span className="font-semibold text-primary">KES {booking.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-earth">Created:</span>
                                  <span>{new Date(booking.createdAt!).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-earth">Updated:</span>
                                  <span>{new Date(booking.updatedAt!).toLocaleString()}</span>
                                </div>
                                {booking.specialRequests && (
                                  <div className="pt-2 border-t">
                                    <span className="text-earth font-medium">Special Requests:</span>
                                    <p className="text-earth/70 mt-1">{booking.specialRequests}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-secondary-dark bg-secondary/30">
              <div className="flex items-center justify-between">
                <div className="text-sm text-earth">
                  Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, filteredBookings.length)} of {filteredBookings.length} bookings
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-earth hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-primary text-light'
                            : 'text-earth hover:text-primary hover:bg-primary/10'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-earth hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredBookings.length === 0 && (
        <div className="bg-light p-12 text-center rounded-xl border border-secondary-dark">
          <div className="w-12 h-12 mx-auto bg-primary-light rounded-full flex items-center justify-center text-primary mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-primary-dark mb-2">
            No bookings found
          </h3>
          <p className="text-earth mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No bookings have been made yet"}
          </p>
        </div>
      )}
    </div>
  );
}