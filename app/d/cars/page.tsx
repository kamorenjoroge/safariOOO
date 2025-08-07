"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import CarModal from "@/app/components/modals/CarModal";
import { 
  Car, 
  Edit2, 
  FilterIcon, 
  Loader2, 
  PlusIcon, 
  SearchIcon, 
  Trash2Icon,
  MapPin,
  Calendar,
  Users,
  Fuel,
  Settings,
  DollarSign,
  Check,
  ChevronDown
} from "lucide-react";

export interface Car {
  _id?: string;
  model: string;
  type: {
    _id: string;
    title: string;
  }; // Populated category
  registrationNumber: string;
  location: string;
  pricePerDay: number;
  image: string;
  year: number;
  transmission: string;
  fuel: string;
  seats: number;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  title: string;
}

export default function Cars() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [cars, setCars] = useState<Car[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_BASE_URL = "/api/cars";
  const CATEGORIES_API_URL = "/api/category";

  // Fetch cars from API
  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_BASE_URL);

      if (response.data.success) {
        setCars(response.data.data);
      } else {
        setError("Failed to fetch cars");
      }
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "An error occurred while fetching cars"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(CATEGORIES_API_URL);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCars();
    fetchCategories();
  }, []);

  // Function to refresh cars after CRUD operations
  const handleSuccess = () => {
    fetchCars();
  };

  // Get unique locations from cars
  const uniqueLocations = [...new Set(cars.map(car => car.location))].filter(Boolean);

  const filteredCars = cars.filter((car) => {
    const matchesSearch = 
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.type?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || car.type?._id === selectedCategory;
    const matchesLocation = !selectedLocation || car.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">
            Cars Management
          </h1>
          <p className="text-earth-light">
            {loading ? "Loading..." : `${cars.length} cars available`}
          </p>
        </div>
        <div>
          <CarModal type="create" onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-danger/10 border border-danger text-danger p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchCars}
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
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-light w-4 h-4" />
            <input
              placeholder="Search cars by model, registration, location, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-secondary-dark rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading || loadingCategories}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-earth-light pointer-events-none" />
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
          <span className="ml-2 text-earth">Loading cars...</span>
        </div>
      )}

      {/* Cars grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div
              key={car._id}
              className="bg-light rounded-xl border border-secondary-dark overflow-hidden hover:shadow-primary transition-all duration-200 group"
            >
              {/* Car image */}
              <div className="h-48 relative overflow-hidden">
                {car.image ? (
                  <Image
                    src={car.image}
                    alt={`${car.model} - ${car.registrationNumber}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary-light to-primary-dark flex items-center justify-center">
                    <Car className="text-6xl text-light opacity-50" />
                  </div>
                )}

                {/* Category badge */}
                {car.type && (
                  <div className="absolute top-4 left-4 bg-primary text-light px-3 py-1 rounded-full text-xs font-semibold">
                    {car.type.title}
                  </div>
                )}

                {/* Registration number badge */}
                <div className="absolute top-4 right-4 bg-dark/80 text-light px-3 py-1 rounded-full text-xs font-semibold">
                  {car.registrationNumber}
                </div>

                {/* Overlay with quick specs */}
                <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center p-4 text-center text-light opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-xl font-bold mb-2">{car.model}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {car.year}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {car.seats} seats
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {car.transmission}
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                      {car.fuel}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-earth mb-2">
                    {car.model}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-earth/70 mb-2">
                    <MapPin className="w-4 h-4" />
                    {car.location}
                  </div>
                  <div className="text-xs text-earth/60">
                    Registration: {car.registrationNumber}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <DollarSign className="w-5 h-5" />
                    KES {car.pricePerDay.toLocaleString()}
                    <span className="text-sm font-normal text-earth/70">
                      /day
                    </span>
                  </div>
                </div>

                {/* Car specs */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-earth/70">
                    <Calendar className="w-3 h-3" />
                    {car.year}
                  </div>
                  <div className="flex items-center gap-1 text-earth/70">
                    <Users className="w-3 h-3" />
                    {car.seats} seats
                  </div>
                  <div className="flex items-center gap-1 text-earth/70">
                    <Settings className="w-3 h-3" />
                    {car.transmission}
                  </div>
                  <div className="flex items-center gap-1 text-earth/70">
                    <Fuel className="w-3 h-3" />
                    {car.fuel}
                  </div>
                </div>

                {/* Features */}
                {car.features && car.features.length > 0 && (
                  <div className="space-y-1 mb-6">
                    {car.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-3 w-3 text-primary" />
                        <span className="text-xs text-earth/70">{feature}</span>
                      </div>
                    ))}
                    {car.features.length > 3 && (
                      <div className="text-xs text-earth/60">
                        +{car.features.length - 3} more features
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end border-t border-secondary pt-4">
                  <div className="flex gap-2">
                    <CarModal
                      type="update"
                      id={car._id}
                      data={{
                        model: car.model,
                        type: car.type._id,
                        registrationNumber: car.registrationNumber,
                        location: car.location,
                        pricePerDay: car.pricePerDay.toString(),
                        image: car.image,
                        year: car.year.toString(),
                        transmission: car.transmission,
                        fuel: car.fuel,
                        seats: car.seats.toString(),
                        features: car.features
                      }}
                      onSuccess={handleSuccess}
                    >
                      <button
                        className="p-2 text-earth hover:text-primary hover:bg-secondary rounded-full transition-colors"
                        title="Edit car"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </CarModal>

                    <CarModal
                      type="delete"
                      id={car._id}
                      data={{
                        model: car.model,
                        type: car.type._id,
                        registrationNumber: car.registrationNumber,
                        location: car.location,
                        pricePerDay: car.pricePerDay.toString(),
                        image: car.image,
                        year: car.year.toString(),
                        transmission: car.transmission,
                        fuel: car.fuel,
                        seats: car.seats.toString(),
                        features: car.features
                      }}
                      onSuccess={handleSuccess}
                    >
                      <button
                        className="p-2 text-earth hover:text-danger hover:bg-secondary rounded-full transition-colors"
                        title="Delete car"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </CarModal>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredCars.length === 0 && (
        <div className="bg-light p-12 text-center rounded-xl border border-secondary-dark">
          <div className="w-12 h-12 mx-auto bg-primary-light rounded-full flex items-center justify-center text-primary mb-4">
            <PlusIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-primary-dark mb-2">
            No cars found
          </h3>
          <p className="text-earth mb-4">
            {searchTerm || selectedCategory || selectedLocation
              ? "Try adjusting your search or filters"
              : "You haven't added any cars yet"}
          </p>
          <CarModal type="create" onSuccess={handleSuccess}>
            <button className="flex items-center gap-2 bg-primary text-light px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors mx-auto">
              <PlusIcon />
              Add New Car
            </button>
          </CarModal>
        </div>
      )}
    </div>
  );
}