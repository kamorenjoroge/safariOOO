// components/Modal/CarCategoryModal.tsx
"use client";

import {  Edit2Icon, PlusIcon, Trash2Icon, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import toast from "react-hot-toast";


// Dynamically import form component
const CarCategoryForm = dynamic(() => import("../forms/CarCategoryForm"), {
  loading: () => <p className="text-dark">Loading form...</p>,
});

type CarCategoryActionType = "create" | "update" | "delete";

export interface CarCategory {
  title: string;
  description: string;
  image: string;
  priceFrom: string;
  features: string[];
  popular?: boolean;
  id?: string;
}

type CarCategoryModalProps = {
  type: CarCategoryActionType;
  data?: CarCategory;
  id?: string;
  onSuccess?: () => void;
  children?: React.ReactNode; // For custom trigger button
};

const iconMap = {
  create: <PlusIcon className="h-5 w-5" />,
  update: <Edit2Icon className="h-5 w-5" />,
  delete: <Trash2Icon className="h-5 w-5" />,
};

const buttonClassMap = {
  create: "inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium",
  update: "text-amber-500 hover:text-amber-700",
  delete: "text-red-600 hover:text-red-900",
};

const modalTitleMap = {
  create: "Add New Car Category",
  update: "Edit Car Category",
  delete: "Delete Car Category",
};

const tooltipMap = {
  create: "Add a new car category",
  update: "Edit car category",
  delete: "Delete car category",
};

const CarCategoryModal: React.FC<CarCategoryModalProps> = ({ 
  type, 
  data, 
  id, 
  onSuccess,
  children 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/category/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Car category deleted successfully");
        onSuccess?.();
        setOpen(false);
      } else {
        const result = await res.json();
        toast.error("Delete failed: " + (result.error || "Unknown error"));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Error: " + err.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (type) {
      case "create":
        return (
          <CarCategoryForm
            type="create"
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
            }}
          />
        );
      case "update":
        return id ? (
          <CarCategoryForm
            type="update"
            categoryId={id}
            categoryData={data ? {
              title: data.title,
              description: data.description,
              image: data.image,
              priceFrom: data.priceFrom,
              features: data.features,
              popular: data.popular || false
            } : undefined}
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
            }}
          />
        ) : (
          <p className="text-dark">No car category ID provided for update</p>
        );
      case "delete":
        return (
          <div className="text-center flex flex-col items-center gap-6 p-4">
            <p className="text-lg font-medium text-dark">
              Are you sure you want to delete this car category?
            </p>
            {data && (
              <p className="text-sm text-gray-600">
                Category: <strong>{data.title}</strong>
              </p>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70"
              >
                {isLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        );
      default:
        return <p className="text-dark">Invalid action</p>;
    }
  };

  return (
    <>
      {/* Custom trigger or default button */}
      {children ? (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={() => setOpen(true)}
            className={buttonClassMap[type]}
            aria-label={type}
          >
            {type === 'create' ? (
              <>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Car Category
              </>
            ) : (
              iconMap[type]
            )}
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
            {tooltipMap[type]}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-dark/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-bold text-dark">
                {modalTitleMap[type]}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CarCategoryModal;