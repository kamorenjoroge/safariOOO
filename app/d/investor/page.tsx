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
  Users
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

      {/* Investors grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedInvestors.map((investor) => (
            <div
              key={investor._id}
              className="bg-light rounded-xl border border-secondary-dark overflow-hidden hover:shadow-primary transition-all duration-200 group"
            >
              {/* Header with investor info */}
              <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {investor.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm opacity-90">
                      <Calendar className="w-3 h-3" />
                      Joined {formatDate(investor.joinedDate)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Contact information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-earth/70">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{investor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-earth/70">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {investor.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-earth/70">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {investor.location}
                  </div>
                </div>

                {/* Cars section */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-earth">
                      Assigned Cars ({investor.cars.length})
                    </span>
                  </div>

                  {investor.cars.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-500">No cars assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {investor.cars.map((car) => (
                        <div 
                          key={car._id} 
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                          {car.image ? (
                            <Image
                              src={car.image}
                              alt={car.model}
                              width={40}
                              height={30}
                              className="rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                              <Car className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {car.model}
                            </p>
                            <p className="text-xs text-gray-600">
                              {car.registrationNumber}
                            </p>
                            {car.type && (
                              <p className="text-xs text-gray-500">
                                {car.type.title}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {investor.cars.length}
                    </div>
                    <div className="text-xs text-gray-600">Cars Owned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {Math.floor((new Date().getTime() - new Date(investor.joinedDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-xs text-gray-600">Days Active</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end border-t border-secondary pt-4">
                  <div className="flex gap-2">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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