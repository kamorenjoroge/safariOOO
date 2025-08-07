"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import CarCategoryModal from "@/app/components/modals/CarCategoryModal";
import { Car, Check, Edit2, FilterIcon, Loader2,  PlusIcon, SearchCheckIcon, Star, StarIcon, Trash2Icon } from "lucide-react";

export interface CarCategory {
  _id?: string;
  title: string;
  description: string;
  image: string;
  priceFrom: string;
  features: string[];
  popular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [categories, setCategories] = useState<CarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API base URL - adjust this to match your API endpoint
  const API_BASE_URL = "/api/category"; // Adjust this path as needed

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_BASE_URL);

      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "An error occurred while fetching categories"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function to refresh categories after CRUD operations
  const handleSuccess = () => {
    fetchCategories(); // Refetch from API
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPopular = !showPopularOnly || category.popular;
    return matchesSearch && matchesPopular;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">
            Car Categories
          </h1>
          <p className="text-earth-light">
            {loading ? "Loading..." : `${categories.length} categories`}
          </p>
        </div>
        <div>
          <CarCategoryModal type="create" onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-danger/10 border border-danger text-danger p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchCategories}
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
              placeholder="Search categories by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          <label className="flex items-center gap-2 px-4 py-2 border border-secondary-dark rounded-lg hover:bg-secondary transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={showPopularOnly}
              onChange={(e) => setShowPopularOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
              disabled={loading}
            />
            <span className="flex items-center gap-1">
              <StarIcon className="text-warning" />
              Popular Only
            </span>
          </label>

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
          <span className="ml-2 text-earth">Loading categories...</span>
        </div>
      )}

      {/* Categories grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-light rounded-xl border border-secondary-dark overflow-hidden hover:shadow-primary transition-all duration-200 group"
            >
              {/* Category image */}
              <div className="h-48 relative overflow-hidden">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary-light to-primary-dark flex items-center justify-center">
                    <Car className="text-6xl text-light opacity-50" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center p-4 text-center text-light opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                  <p>{category.description}</p>
                </div>

                {category.popular && (
                  <div className="absolute top-4 left-4 bg-warning text-dark px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star />
                    Popular
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-earth mb-2">
                    {category.title}
                  </h3>
                  <p className="text-earth/70 text-sm">
                    {category.description}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">
                    KES {category.priceFrom}
                    <span className="text-sm font-normal text-earth/70">
                      /day
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  {category.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm text-earth/70">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end border-t border-secondary pt-4">
                  <div className="flex gap-2">
                    <CarCategoryModal
                      type="update"
                      id={category._id}
                      data={category}
                      onSuccess={handleSuccess}
                      
                    >
                      <button
                        className="p-2 text-earth hover:text-primary hover:bg-secondary rounded-full transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </CarCategoryModal>

                    <CarCategoryModal
                      type="delete"
                      id={category._id}
                      data={category}
                      onSuccess={handleSuccess}
                    >
                      <button
                        className="p-2 text-earth hover:text-danger hover:bg-secondary rounded-full transition-colors"
                        title="Delete category"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </CarCategoryModal>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredCategories.length === 0 && (
        <div className="bg-light p-12 text-center rounded-xl border border-secondary-dark">
          <div className="w-12 h-12 mx-auto bg-primary-light rounded-full flex items-center justify-center text-primary mb-4">
            <PlusIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-primary-dark mb-2">
            No categories found
          </h3>
          <p className="text-earth mb-4">
            {searchTerm || showPopularOnly
              ? "Try adjusting your search or filters"
              : "You haven't created any categories yet"}
          </p>
          <CarCategoryModal type="create" onSuccess={handleSuccess}>
            <button className="flex items-center gap-2 bg-primary text-light px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors mx-auto">
              <PlusIcon />
              Add New Category
            </button>
          </CarCategoryModal>
        </div>
      )}
    </div>
  );
}