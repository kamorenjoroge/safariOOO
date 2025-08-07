// components/Forms/CarCategoryForm.tsx
"use client";
import Image from "next/image";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PlusSquare, RefreshCcwIcon, SaveAllIcon, TagIcon, UploadCloudIcon, X } from "lucide-react";

interface CarCategoryFormProps {
  type: "create" | "update";
  categoryData?: {
    title: string;
    description: string;
    image: string;
    priceFrom: string;
    features: string[];
    popular: boolean;
  };
  categoryId?: string;
  onSuccess?: () => void;
}

const CarCategoryForm: React.FC<CarCategoryFormProps> = ({
  type = "create",
  categoryData,
  categoryId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceFrom: "",
    features: [] as string[],
    popular: false,
  });

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newFeature, setNewFeature] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (type === "update" && categoryData) {
      setFormData({
        title: categoryData.title,
        description: categoryData.description,
        priceFrom: categoryData.priceFrom,
        features: categoryData.features,
        popular: categoryData.popular,
      });
      setExistingImage(categoryData.image || "");
    }
  }, [type, categoryData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type: inputType } = e.target;
    
    if (inputType === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
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

    if (!image && !existingImage) {
      setError("Category image is required");
      return;
    }

    if (formData.features.length === 0) {
      setError("At least one feature is required");
      return;
    }

    if (!formData.title.trim()) {
      setError("Category title is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Category description is required");
      return;
    }

    if (!formData.priceFrom || Number(formData.priceFrom) <= 0) {
      setError("Valid price is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("priceFrom", formData.priceFrom);
      formDataToSend.append("popular", formData.popular.toString());
      
      formData.features.forEach((feature) => formDataToSend.append("features", feature.trim()));

      if (image) {
        formDataToSend.append("image", image);
      }
      if (existingImage) {
        formDataToSend.append("existingImage", existingImage);
      }

      const url = type === "create" 
        ? "/api/category" 
        : `/api/category/${categoryId}`;
      const method = type === "create" ? "post" : "put";

      await axios[method](url, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Car category ${type === "create" ? "added" : "updated"} successfully`);
      onSuccess?.();
      if (type === "create") resetForm();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.response?.data?.message || err.message 
        : "An error occurred while saving the category";
      setError(errorMessage);
      toast.error("Failed to save car category");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priceFrom: "",
      features: [],
      popular: false,
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
            <TagIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark leading-tight">
              {type === "create" ? "Add New Car Category" : "Edit Car Category"}
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Title and Price Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Economy Cars, Luxury Vehicles"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price From (KES) *
                </label>
                <input
                  type="number"
                  name="priceFrom"
                  value={formData.priceFrom}
                  onChange={handleChange}
                  required
                  min="100"
                  placeholder="e.g., 2500"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Describe this car category and what makes it special..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base resize-none"
                disabled={loading}
              />
            </div>

            {/* Features Section - Mobile optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features *
              </label>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">Add features one by one</p>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  ref={featureInputRef}
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature (e.g., Air Conditioning, GPS)"
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
                Category Image *
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
                Upload Category Image
              </button>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Accepted formats: JPG, PNG, GIF (Max: 5MB)</p>
              
              <div className="mt-4">
                {existingImage && !preview && (
                  <div className="relative inline-block">
                    <Image
                      src={existingImage}
                      alt="Current category image"
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
                      alt="Category preview"
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

            {/* Popular Category Checkbox - Mobile optimized */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="popular"
                  checked={formData.popular}
                  onChange={handleChange}
                  className="mt-0.5 rounded focus:ring-2 focus:ring-primary text-primary"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 block">
                    Mark as Popular Category
                  </span>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Popular categories will be highlighted and shown prominently to users
                  </p>
                </div>
              </label>
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
                {loading ? "Processing..." : type === "create" ? "Add Category" : "Update Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarCategoryForm;