"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import InvestorModal from "@/app/components/modals/InvestorModal";
import { 
  User, 
  Edit2, 
  FilterIcon, 
  Loader2, 
  PlusIcon, 
  SearchIcon, 
  Trash2Icon,
  MapPin,
  Calendar,
  Car,
  Mail,
  Phone,
  ChevronDown,
  Users,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export interface Investor {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  cars: {
    _id: string;
    model: string;
    registrationNumber: string;
    image: string;
    type: {
      _id: string;
      title: string;
    };
  }[]; // Populated car data
  createdAt?: string;
  updatedAt?: string;
}

export default function Investors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, joinedDate, carsCount
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // API base URL
  const API_BASE_URL = "/api/investor";

  // Fetch investors from API
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_BASE_URL);

      if (response.data.success) {
        setInvestors(response.data.data);
      } else {
        setError("Failed to fetch investors");
      }
    } catch (err) {
      console.error("Error fetching investors:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "An error occurred while fetching investors"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchInvestors();
  }, []);

  // Function to refresh investors after CRUD operations
  const handleSuccess = () => {
    fetchInvestors();
  };

  // Toggle row expansion
  const toggleRowExpansion = (investorId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(investorId)) {
      newExpanded.delete(investorId);
    } else {
      newExpanded.add(investorId);
    }
    setExpandedRows(newExpanded);
  };

  // Get unique locations from investors
  const uniqueLocations = [...new Set(investors.map(investor => investor.location))].filter(Boolean);

  // Filter and sort investors
  const filteredAndSortedInvestors = investors
    .filter((investor) => {
      const matchesSearch = 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.cars.some(car => 
          car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesLocation = !selectedLocation || investor.location === selectedLocation;
      
      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "joinedDate":
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        case "carsCount":
          return b.cars.length - a.cars.length;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvestors = filteredAndSortedInvestors.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLocation, sortBy]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination component
  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-earth-light">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedInvestors.length)} of{' '}
          {filteredAndSortedInvestors.length} results
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-secondary-dark hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-primary text-light'
                  : 'border border-secondary-dark hover:bg-secondary'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-secondary-dark hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">
            Investors Management
          </h1>
          <p className="text-earth-light">
            {loading ? "Loading..." : `${investors.length} investors registered`}
          </p>
        </div>
        
        <div>
          <InvestorModal type="create" onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && investors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-light p-4 rounded-xl border border-secondary-dark text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {investors.length}
            </div>
            <div className="text-sm text-earth-light">Total Investors</div>
          </div>
          <div className="bg-light p-4 rounded-xl border border-secondary-dark text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {investors.reduce((total, investor) => total + investor.cars.length, 0)}
            </div>
            <div className="text-sm text-earth-light">Total Cars Assigned</div>
          </div>
          <div className="bg-light p-4 rounded-xl border border-secondary-dark text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {uniqueLocations.length}
            </div>
            <div className="text-sm text-earth-light">Active Locations</div>
          </div>
          <div className="bg-light p-4 rounded-xl border border-secondary-dark text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {Math.round(investors.reduce((total, investor) => total + investor.cars.length, 0) / investors.length * 10) / 10}
            </div>
            <div className="text-sm text-earth-light">Avg Cars per Investor</div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-danger/10 border border-danger text-danger p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchInvestors}
              className="px-3 py-1 bg-danger text-white rounded hover:bg-danger/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="bg-light p-4 rounded-xl border border-secondary-dark">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-light w-4 h-4" />
            <input
              placeholder="Search investors by name, email, phone, location, or assigned cars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="appearance-none bg-white border border-secondary-dark rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-earth-light pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-secondary-dark rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="name">Sort by Name</option>
              <option value="joinedDate">Sort by Joined Date</option>
              <option value="carsCount">Sort by Cars Count</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-earth-light pointer-events-none" />
          </div>

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
          <span className="ml-2 text-earth">Loading investors...</span>
        </div>
      )}

      {/* Investors Table */}
      {!loading && (
        <div className="bg-light rounded-xl border border-secondary-dark overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary to-primary-light text-light">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">Investor</th>
                  <th className="text-left py-4 px-6 font-semibold">Contact</th>
                  <th className="text-left py-4 px-6 font-semibold">Location</th>
                  <th className="text-left py-4 px-6 font-semibold">Joined</th>
                  <th className="text-left py-4 px-6 font-semibold">Cars</th>
                  <th className="text-left py-4 px-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-dark">
                {currentInvestors.map((investor) => (
                  <>
                    <tr key={investor._id} className="hover:bg-secondary/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-primary-dark">{investor.name}</div>
                            <div className="text-sm text-earth-light">ID: {investor._id?.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-earth-light" />
                            <span className="truncate max-w-[150px]" title={investor.email}>
                              {investor.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-earth-light" />
                            <span>{investor.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-earth-light" />
                          <span>{investor.location}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-earth-light" />
                          <span>{formatDate(investor.joinedDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-primary">{investor.cars.length}</span>
                          <span className="text-sm text-earth-light">cars</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleRowExpansion(investor._id!)}
                            className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                            title={expandedRows.has(investor._id!) ? "Hide details" : "View details"}
                          >
                            {expandedRows.has(investor._id!) ? (
                              <EyeOff className="w-4 h-4 text-primary" />
                            ) : (
                              <Eye className="w-4 h-4 text-earth-light" />
                            )}
                          </button>

                          <InvestorModal
                            type="update"
                            id={investor._id}
                            data={{
                              name: investor.name,
                              email: investor.email,
                              phone: investor.phone,
                              location: investor.location,
                              joinedDate: investor.joinedDate,
                              cars: investor.cars.map(car => car._id)
                            }}
                            onSuccess={handleSuccess}
                          >
                            <button
                              className="p-2 text-earth hover:text-primary hover:bg-secondary rounded-full transition-colors"
                              title="Edit investor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </InvestorModal>

                          <InvestorModal
                            type="delete"
                            id={investor._id}
                            data={{
                              name: investor.name,
                              email: investor.email,
                              phone: investor.phone,
                              location: investor.location,
                              joinedDate: investor.joinedDate,
                              cars: investor.cars.map(car => car._id)
                            }}
                            onSuccess={handleSuccess}
                          >
                            <button
                              className="p-2 text-earth hover:text-danger hover:bg-secondary rounded-full transition-colors"
                              title="Delete investor"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </InvestorModal>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRows.has(investor._id!) && (
                      <tr>
                        <td colSpan={7} className="py-4 px-6 bg-secondary/30">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-primary-dark flex items-center gap-2">
                              <Car className="w-4 h-4" />
                              Assigned Cars ({investor.cars.length})
                            </h4>
                            
                            {investor.cars.length === 0 ? (
                              <div className="text-center py-8 text-earth-light">
                                <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No cars assigned to this investor</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {investor.cars.map((car) => (
                                  <div key={car._id} className="bg-light p-4 rounded-lg border border-secondary-dark">
                                    <div className="flex items-center gap-3">
                                      {car.image ? (
                                        <Image
                                          src={car.image}
                                          alt={car.model}
                                          width={60}
                                          height={45}
                                          className="rounded object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-15 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                          <Car className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-semibold text-primary-dark truncate">
                                          {car.model}
                                        </h5>
                                        <p className="text-sm text-earth-light">
                                          {car.registrationNumber}
                                        </p>
                                        {car.type && (
                                          <p className="text-xs text-earth bg-secondary px-2 py-1 rounded-full inline-block mt-1">
                                            {car.type.title}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-secondary-dark">
            {currentInvestors.map((investor) => (
              <div key={investor._id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-dark">{investor.name}</h3>
                      <p className="text-sm text-earth-light">{investor.location}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRowExpansion(investor._id!)}
                    className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                  >
                    {expandedRows.has(investor._id!) ? (
                      <EyeOff className="w-4 h-4 text-primary" />
                    ) : (
                      <Eye className="w-4 h-4 text-earth-light" />
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-3 h-3 text-earth-light" />
                      <span className="truncate">{investor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-earth-light" />
                      <span>{formatDate(investor.joinedDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <Car className="w-3 h-3 text-primary" />
                      <span className="font-semibold text-primary">{investor.cars.length} cars</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-earth-light">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[200px]" title={investor.email}>
                      {investor.email}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRowExpansion(investor._id!)}
                      className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                      title={expandedRows.has(investor._id!) ? "Hide details" : "View details"}
                    >
                      {expandedRows.has(investor._id!) ? (
                        <EyeOff className="w-4 h-4 text-primary" />
                      ) : (
                        <Eye className="w-4 h-4 text-earth-light" />
                      )}
                    </button>

                    <InvestorModal
                      type="update"
                      id={investor._id}
                      data={{
                        name: investor.name,
                        email: investor.email,
                        phone: investor.phone,
                        location: investor.location,
                        joinedDate: investor.joinedDate,
                        cars: investor.cars.map(car => car._id)
                      }}
                      onSuccess={handleSuccess}
                    >
                      <button className="p-2 text-earth hover:text-primary hover:bg-secondary rounded-full transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </InvestorModal>

                    <InvestorModal
                      type="delete"
                      id={investor._id}
                      data={{
                        name: investor.name,
                        email: investor.email,
                        phone: investor.phone,
                        location: investor.location,
                        joinedDate: investor.joinedDate,
                        cars: investor.cars.map(car => car._id)
                      }}
                      onSuccess={handleSuccess}
                    >
                      <button className="p-2 text-earth hover:text-danger hover:bg-secondary rounded-full transition-colors">
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </InvestorModal>
                  </div>
                </div>

                {/* Mobile Expanded Details */}
                {expandedRows.has(investor._id!) && (
                  <div className="mt-4 pt-4 border-t border-secondary-dark">
                    <h4 className="font-semibold text-primary-dark flex items-center gap-2 mb-3">
                      <Car className="w-4 h-4" />
                      Assigned Cars ({investor.cars.length})
                    </h4>
                    
                    {investor.cars.length === 0 ? (
                      <div className="text-center py-6 text-earth-light">
                        <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No cars assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {investor.cars.map((car) => (
                          <div key={car._id} className="bg-secondary/50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              {car.image ? (
                                <Image
                                  src={car.image}
                                  alt={car.model}
                                  width={50}
                                  height={40}
                                  className="rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                  <Car className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-primary-dark truncate">
                                  {car.model}
                                </h5>
                                <p className="text-sm text-earth-light">
                                  {car.registrationNumber}
                                </p>
                                {car.type && (
                                  <p className="text-xs text-earth bg-light px-2 py-1 rounded-full inline-block mt-1">
                                    {car.type.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredAndSortedInvestors.length > 0 && <PaginationControls />}

      {/* Empty state */}
      {!loading && filteredAndSortedInvestors.length === 0 && (
        <div className="bg-light p-12 text-center rounded-xl border border-secondary-dark">
          <div className="w-12 h-12 mx-auto bg-primary-light rounded-full flex items-center justify-center text-primary mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-primary-dark mb-2">
            No investors found
          </h3>
          <p className="text-earth mb-4">
            {searchTerm || selectedLocation
              ? "Try adjusting your search or filters"
              : "You haven't added any investors yet"}
          </p>
          <InvestorModal type="create" onSuccess={handleSuccess}>
            <button className="flex items-center gap-2 bg-primary text-light px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors mx-auto">
              <PlusIcon />
              Add New Investor
            </button>
          </InvestorModal>
        </div>
      )}
    </div>
  );
}