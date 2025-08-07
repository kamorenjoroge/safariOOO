// components/Forms/CarForm.tsx
"use client";
import Image from "next/image";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PlusSquare, RefreshCcwIcon, SaveAllIcon, CarIcon, UploadCloudIcon, X, ChevronDown } from "lucide-react";

interface Category {
  _id: string;
  title: string;
}

interface CarFormProps {
  type: "create" | "update";
  carData?: {
    model: string;
    type: string; // Category ID
    registrationNumber: string;
    location: string;
    pricePerDay: string;
    image: string;
    year: string;
    transmission: string;
    fuel: string;
    seats: string;
    features: string[];
  };
  carId?: string;
  onSuccess?: () => void;
}

const CarForm: React.FC<CarFormProps> = ({
  type = "create",
  carData,
  carId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    model: "",
    type: "", // Category ID
    registrationNumber: "",
    location: "",
    pricePerDay: "",
    year: "",
    transmission: "",
    fuel: "",
    seats: "",
    features: [] as string[],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [newFeature, setNewFeature] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);

    // Fetch categories on mount
useEffect(() => {
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await axios.get("/api/category");
      const { data } = res;

      const categoriesData =
        data?.data && Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
          ? data.categories
          : [];

      if (categoriesData.length === 0) {
        setError("Invalid response format from API");
      }

      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching car categories:", error);
      setError("Failed to load car categories");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  fetchCategories();
}, []);


  useEffect(() => {
    if (type === "update" && carData) {
      setFormData({
        model: carData.model,
        type: carData.type,
        registrationNumber: carData.registrationNumber,
        location: carData.location,
        pricePerDay: carData.pricePerDay,
        year: carData.year,
        transmission: carData.transmission,
        fuel: carData.fuel,
        seats: carData.seats,
        features: carData.features,
      });
      setExistingImage(carData.image || "");
    }
  }, [type, carData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB");
      return;
    }
    
    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingImage = () => {
    setExistingImage("");
  };

  const addFeature = () => {
    const trimmedFeature = newFeature.trim();
    if (trimmedFeature && !formData.features.includes(trimmedFeature)) {
      setFormData({
        ...formData,
        features: [...formData.features, trimmedFeature],
      });
      setNewFeature("");
      if (featureInputRef.current) {
        featureInputRef.current.focus();
      }
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((feature) => feature !== featureToRemove),
    });
  };

  const handleFeatureKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!image && !existingImage) {
      setError("Car image is required");
      return;
    }

    if (!formData.model.trim()) {
      setError("Car model is required");
      return;
    }

    if (!formData.type) {
      setError("Car category is required");
      return;
    }

    if (!formData.registrationNumber.trim()) {
      setError("Registration number is required");
      return;
    }

    if (!formData.location.trim()) {
      setError("Location is required");
      return;
    }

    if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
      setError("Valid price per day is required");
      return;
    }

    if (!formData.year || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1) {
      setError("Valid year is required");
      return;
    }

    if (!formData.transmission.trim()) {
      setError("Transmission type is required");
      return;
    }

    if (!formData.fuel.trim()) {
      setError("Fuel type is required");
      return;
    }

    if (!formData.seats || Number(formData.seats) < 1) {
      setError("Valid number of seats is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("model", formData.model.trim());
      formDataToSend.append("type", formData.type);
      formDataToSend.append("registrationNumber", formData.registrationNumber.trim());
      formDataToSend.append("location", formData.location.trim());
      formDataToSend.append("pricePerDay", formData.pricePerDay);
      formDataToSend.append("year", formData.year);
      formDataToSend.append("transmission", formData.transmission.trim());
      formDataToSend.append("fuel", formData.fuel.trim());
      formDataToSend.append("seats", formData.seats);
      
      formData.features.forEach((feature) => formDataToSend.append("features", feature.trim()));

      if (image) {
        formDataToSend.append("image", image);
      }
      if (existingImage) {
        formDataToSend.append("existingImage", existingImage);
      }

      const url = type === "create" 
        ? "/api/cars" 
        : `/api/cars/${carId}`;
      const method = type === "create" ? "post" : "put";

      await axios[method](url, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Car ${type === "create" ? "added" : "updated"} successfully`);
      onSuccess?.();
      if (type === "create") resetForm();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.response?.data?.message || err.message 
        : "An error occurred while saving the car";
      setError(errorMessage);
      toast.error("Failed to save car");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      model: "",
      type: "",
      registrationNumber: "",
      location: "",
      pricePerDay: "",
      year: "",
      transmission: "",
      fuel: "",
      seats: "",
      features: [],
    });
    setImage(null);
    setExistingImage("");
    setNewFeature("");
    setError("");
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Header - Mobile optimized */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <CarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark leading-tight">
              {type === "create" ? "Add New Car" : "Edit Car"}
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Model and Category Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Toyota Camry, BMW X5"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Category *
                </label>
                <div className="relative">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    disabled={loading || loadingCategories}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base appearance-none bg-white"
                  >
                    <option value="">
                      {loadingCategories ? "Loading categories..." : "Select Category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Registration Number and Location Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., KAB 123A"
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
                  placeholder="e.g., Nairobi, Mombasa"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Price and Year Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Day (KES) *
                </label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  required
                  min="100"
                  placeholder="e.g., 5000"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="e.g., 2020"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Transmission, Fuel, and Seats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transmission *
                </label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base appearance-none bg-white"
                >
                  <option value="">Select Transmission</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type *
                </label>
                <select
                  name="fuel"
                  value={formData.fuel}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base appearance-none bg-white"
                >
                  <option value="">Select Fuel Type</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Seats *
                </label>
                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  required
                  min="1"
                  max="50"
                  placeholder="e.g., 5"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Features Section - Mobile optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">Add features one by one (optional)</p>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  ref={featureInputRef}
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature (e.g., Air Conditioning, GPS, Bluetooth)"
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  onKeyPress={handleFeatureKeyPress}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  disabled={loading || !newFeature.trim()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[42px] sm:min-h-[48px]"
                >
                  <PlusSquare className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              {/* Display Features - Mobile optimized */}
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
                  >
                    <span className="text-xs sm:text-sm break-words">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                      disabled={loading}
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.features.length === 0 && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2">No features added yet</p>
              )}
            </div>

            {/* Image Upload - Mobile optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Image *
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
              >
                <UploadCloudIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Upload Car Image
              </button>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Accepted formats: JPG, PNG, GIF (Max: 5MB)</p>
              
              <div className="mt-4">
                {existingImage && !preview && (
                  <div className="relative inline-block">
                    <Image
                      src={existingImage}
                      alt="Current car image"
                      width={200}
                      height={150}
                      className="rounded-lg object-cover border w-full max-w-[200px] h-auto"
                    />
                    <button
                      type="button"
                      onClick={removeExistingImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Current image</p>
                  </div>
                )}

                {preview && (
                  <div className="relative inline-block">
                    <Image
                      src={preview}
                      alt="Car preview"
                      width={200}
                      height={150}
                      className="rounded-lg object-cover border w-full max-w-[200px] h-auto"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">New image preview</p>
                  </div>
                )}
              </div>
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
                {loading ? "Processing..." : type === "create" ? "Add Car" : "Update Car"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarForm;