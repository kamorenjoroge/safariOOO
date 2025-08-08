// components/Forms/InvestorForm.tsx
"use client";
import Image from "next/image";
import { useState, useRef, ChangeEvent, FormEvent, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {  RefreshCcwIcon, SaveAllIcon, UserIcon, Search, X } from "lucide-react";

interface Car {
  _id: string;
  model: string;
  registrationNumber: string;
  image: string;
  type: {
    _id: string;
    title: string;
  };
}

interface InvestorFormProps {
  type: "create" | "update";
  investorData?: {
    name: string;
    email: string;
    phone: string;
    location: string;
    joinedDate: string;
    cars: string[]; // Array of car IDs
  };
  investorId?: string;
  onSuccess?: () => void;
}

const InvestorForm: React.FC<InvestorFormProps> = ({
  type = "create",
  investorData,
  investorId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    joinedDate: "",
    cars: [] as string[],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Car[]>([]);
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Initialize form data for update mode
  useEffect(() => {
    if (type === "update" && investorData) {
      setFormData({
        name: investorData.name,
        email: investorData.email,
        phone: investorData.phone,
        location: investorData.location,
        joinedDate: investorData.joinedDate,
        cars: investorData.cars,
      });
      
      // Fetch selected cars details for update mode
      if (investorData.cars.length > 0) {
        fetchSelectedCarsDetails(investorData.cars);
      }
    }
  }, [type, investorData]);

  // Fetch details of selected cars (for update mode)
  const fetchSelectedCarsDetails = async (carIds: string[]) => {
    try {
      const promises = carIds.map(id => axios.get(`/api/cars/search/${id}`));
      const responses = await Promise.all(promises);
      const cars = responses.map(res => res.data.data || res.data);
      setSelectedCars(cars);
    } catch (error) {
      console.error("Error fetching selected cars:", error);
    }
  };

  // Debounced search function
  const searchCars = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await axios.get(`/api/cars/search?registration=${encodeURIComponent(query)}`);
        const cars = res.data.data || res.data || [];
        
        // Filter out cars that are already assigned to investors
        const availableCars = cars.filter((car: Car) => 
          !selectedCars.some(selected => selected._id === car._id)
        );
        
        setSearchResults(availableCars);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error searching cars:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedCars]
  );

  // Handle search input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchCars(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCars]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const selectCar = (car: Car) => {
    const isAlreadySelected = selectedCars.some(selected => selected._id === car._id);
    
    if (!isAlreadySelected) {
      const updatedSelectedCars = [...selectedCars, car];
      setSelectedCars(updatedSelectedCars);
      setFormData({
        ...formData,
        cars: updatedSelectedCars.map(c => c._id)
      });
    }
    
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const removeCar = (carToRemove: Car) => {
    const updatedSelectedCars = selectedCars.filter(car => car._id !== carToRemove._id);
    setSelectedCars(updatedSelectedCars);
    setFormData({
      ...formData,
      cars: updatedSelectedCars.map(c => c._id)
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    if (!formData.location.trim()) {
      setError("Location is required");
      return;
    }

    if (!formData.joinedDate) {
      setError("Joined date is required");
      return;
    }

    if (selectedCars.length === 0) {
      setError("At least one car must be selected");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dataToSend = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        joinedDate: formData.joinedDate,
        cars: formData.cars,
      };

      const url = type === "create" 
        ? "/api/investor" 
        : `/api/investor/${investorId}`;
      const method = type === "create" ? "post" : "put";

      await axios[method](url, dataToSend, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success(`Investor ${type === "create" ? "added" : "updated"} successfully`);
      onSuccess?.();
      if (type === "create") resetForm();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.response?.data?.message || err.message 
        : "An error occurred while saving the investor";
      setError(errorMessage);
      toast.error("Failed to save investor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      location: "",
      joinedDate: "",
      cars: [],
    });
    setSelectedCars([]);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Header - Mobile optimized */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark leading-tight">
              {type === "create" ? "Add New Investor" : "Edit Investor"}
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Name and Email Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., John Doe"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="e.g., john.doe@example.com"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone and Location Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="e.g., +254 700 123 456"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Nairobi, Kenya"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Joined Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joined Date *
              </label>
              <input
                type="date"
                name="joinedDate"
                value={formData.joinedDate}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                disabled={loading}
              />
            </div>

            {/* Car Search Section - Mobile optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Cars *
              </label>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Search cars by registration number (minimum 3 characters)
              </p>
              
              <div className="relative">
                <div className="flex items-center">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Search by registration number..."
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-3 text-center text-gray-500">
                        <div className="animate-pulse">Searching...</div>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">
                        {searchQuery.length < 3 
                          ? "Type at least 3 characters to search"
                          : "No available cars found"
                        }
                      </div>
                    ) : (
                      searchResults.map((car) => (
                        <div
                          key={car._id}
                          onClick={() => selectCar(car)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            {car.image && (
                              <Image
                                src={car.image}
                                alt={car.model}
                                width={60}
                                height={45}
                                className="rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                {car.model}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {car.registrationNumber}
                              </p>
                              {car.type && (
                                <p className="text-xs text-gray-500">
                                  {car.type.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Cars Display - Mobile optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Cars ({selectedCars.length})
              </label>
              
              {selectedCars.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">No cars selected yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedCars.map((car) => (
                    <div 
                      key={car._id} 
                      className="relative bg-gray-50 border rounded-lg p-3"
                    >
                      <button
                        type="button"
                        onClick={() => removeCar(car)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {car.image && (
                          <Image
                            src={car.image}
                            alt={car.model}
                            width={50}
                            height={38}
                            className="rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 pr-6">
                          <p className="font-medium text-sm text-gray-900 truncate">
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 order-2 sm:order-1 text-sm sm:text-base"
              >
                <RefreshCcwIcon className="w-4 h-4" />
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 text-sm sm:text-base font-medium"
              >
                <SaveAllIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                {loading ? "Processing..." : type === "create" ? "Add Investor" : "Update Investor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvestorForm;