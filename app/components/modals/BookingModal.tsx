// components/Modal/BookingModal.tsx
"use client";

import React, { useState } from "react";
import { CheckCircle, Clock, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
type BookingActionType = "confirm" | "cancel" | "complete";

export interface Booking {
  id: string;
  status: BookingStatus;
  // Add other booking properties as needed
  customerName?: string;
  carCategory?: string;
  bookingDate?: string;
}

type BookingModalProps = {
  type: BookingActionType;
  data?: Booking;
  id?: string;
  onSuccess?: () => void;
  children?: React.ReactNode; // For custom trigger button
};

const iconMap = {
  confirm: <CheckCircle className="h-5 w-5 stroke-[2.5]" />,
  cancel: <XCircle className="h-5 w-5 stroke-[2.5]" />,
  complete: <Clock className="h-5 w-5 stroke-[2.5]" />,
};

const buttonClassMap = {
  confirm: "text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-all duration-200",
  cancel: "text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200",
  complete: "text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200",
};

const modalTitleMap = {
  confirm: "Confirm Booking",
  cancel: "Cancel Booking", 
  complete: "Complete Booking",
};

const tooltipMap = {
  confirm: "Confirm booking",
  cancel: "Cancel booking",
  complete: "Mark as completed",
};

const statusMap = {
  confirm: "confirmed",
  cancel: "cancelled", 
  complete: "completed",
};

const actionTextMap = {
  confirm: "confirm",
  cancel: "cancel",
  complete: "complete",
};

// Enhanced icon background colors for the modal
const modalIconBackgroundMap = {
  confirm: "bg-green-100 text-green-600",
  cancel: "bg-red-100 text-red-600",
  complete: "bg-blue-100 text-blue-600",
};

const BookingModal: React.FC<BookingModalProps> = ({ 
  type, 
  data, 
  id, 
  onSuccess,
  children 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Use single endpoint with different body for complete action
      const endpoint = `/api/booking/${id}`;
      const method = "PATCH";
      const body = type === "complete" 
        ? { action: "complete" } // Use action parameter for complete
        : { status: statusMap[type] };
      
      const res = await fetch(endpoint, { 
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(`Booking ${actionTextMap[type]}ed successfully`);
        onSuccess?.();
        setOpen(false);
      } else {
        const result = await res.json();
        toast.error(`Update failed: ${result.error || "Unknown error"}`);
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

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "confirmed": return "text-green-600 bg-green-100";
      case "cancelled": return "text-red-600 bg-red-100";
      case "completed": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getActionButtonColor = (actionType: BookingActionType) => {
    switch (actionType) {
      case "confirm": return "bg-green-600 hover:bg-green-700";
      case "cancel": return "bg-red-600 hover:bg-red-700";
      case "complete": return "bg-blue-600 hover:bg-blue-700";
      default: return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getActionDescription = (actionType: BookingActionType) => {
    switch (actionType) {
      case "confirm": 
        return "This will confirm the booking and notify the customer.";
      case "cancel": 
        return "This will cancel the booking and make the dates available again.";
      case "complete": 
        return "This will mark the booking as completed and update the car's availability schedule.";
      default: 
        return "";
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
            {iconMap[type]}
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
          <div className="bg-secondary rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="text-center flex flex-col items-center gap-6">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${modalIconBackgroundMap[type]}`}>
                  {React.cloneElement(iconMap[type], { className: "h-8 w-8 stroke-[2.5]" })}
                </div>
                
                <div className="space-y-3">
                  <p className="text-lg font-medium text-dark">
                    Are you sure you want to {actionTextMap[type]} this booking?
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    {getActionDescription(type)}
                  </p>
                  
                  {data && (
                    <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                      {data.customerName && (
                        <p>Customer: <strong>{data.customerName}</strong></p>
                      )}
                      {data.carCategory && (
                        <p>Category: <strong>{data.carCategory}</strong></p>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        <span>Current Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(data.status)}`}>
                          {data.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-dark"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isLoading}
                    className={`flex-1 px-6 py-2 text-white rounded-lg disabled:opacity-70 disabled:cursor-not-allowed ${getActionButtonColor(type)}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {type === "complete" ? "Completing..." : "Updating..."}
                      </div>
                    ) : (
                      `${actionTextMap[type].charAt(0).toUpperCase() + actionTextMap[type].slice(1)} Booking`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;