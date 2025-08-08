// components/Modal/InvestorModal.tsx
"use client";
import { Edit2Icon, PlusIcon, Trash2Icon, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import toast from "react-hot-toast";

// Dynamically import form component
const InvestorForm = dynamic(() => import("../forms/InvestorForm"), {
  loading: () => <p className="text-dark">Loading form...</p>,
});

type InvestorActionType = "create" | "update" | "delete";

export interface Investor {
  name: string;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  cars: string[]; // Array of car IDs
  id?: string;
}

type InvestorModalProps = {
  type: InvestorActionType;
  data?: Investor;
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
  create: "Add New Investor",
  update: "Edit Investor",
  delete: "Delete Investor",
};

const tooltipMap = {
  create: "Add a new investor",
  update: "Edit investor",
  delete: "Delete investor",
};

const InvestorModal: React.FC<InvestorModalProps> = ({ 
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
      const res = await fetch(`/api/investor/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Investor deleted successfully");
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
          <InvestorForm
            type="create"
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
            }}
          />
        );
      case "update":
        return id ? (
          <InvestorForm
            type="update"
            investorId={id}
            investorData={data ? {
              name: data.name,
              email: data.email,
              phone: data.phone,
              location: data.location,
              joinedDate: data.joinedDate,
              cars: data.cars
            } : undefined}
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
            }}
          />
        ) : (
          <p className="text-dark">No investor ID provided for update</p>
        );
      case "delete":
        return (
          <div className="text-center flex flex-col items-center gap-6 p-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Trash2Icon className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Investor
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this investor? This action cannot be undone.
              </p>
            </div>
            {data && (
              <div className="bg-gray-50 rounded-lg p-4 w-full max-w-md">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span className="text-gray-900">{data.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-gray-900">{data.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span className="text-gray-900">{data.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span className="text-gray-900">{data.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cars:</span>
                    <span className="text-gray-900">{data.cars.length} assigned</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70 font-medium transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete Investor"
                )}
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
        <div onClick={() => setOpen(true)} className="cursor-pointer">
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
                Add Investor
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-200 p-4 sm:p-6 sticky top-0 bg-white rounded-t-xl">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {modalTitleMap[type]}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className={type === "delete" ? "p-4 sm:p-6" : ""}>
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvestorModal;