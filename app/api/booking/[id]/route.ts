// File path: app/api/booking/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Booking } from "@/models/booking";
import { Car } from "@/models/cars";
import mongoose from "mongoose";

// PATCH - Update booking by ID
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Await params before accessing
    const { id } = await context.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, action } = body;

    // Handle complete action with transaction
    if (action === "complete" || status === "completed") {
      return await handleCompleteBooking(id);
    }

    // Handle regular status updates (confirm/cancel)
    return await handleRegularUpdate(id, body);

  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// Function to handle booking completion with transaction
async function handleCompleteBooking(id: string) {
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();

    // Step 1: Get the booking with schedule and carId
    const booking = await Booking.findById(id)
      .select('schedule carId status customerInfo')
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking can be completed
    if (booking.status === "completed") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Booking is already completed" },
        { status: 400 }
      );
    }

    if (booking.status === "cancelled") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Cannot complete a cancelled booking" },
        { status: 400 }
      );
    }

    // Step 2: Update booking status to completed
    await Booking.findByIdAndUpdate(
      booking._id,
      { $set: { status: "completed" } },
      { session }
    );

    // Step 3: Update car's schedule based on your Car schema
    if (booking.schedule && booking.schedule.date && booking.schedule.date.length > 0) {
      
      // Method 1: Add blocked dates to car's schedule
      // Each date from the booking is marked as unavailable
      const scheduleEntries = booking.schedule.date.map((bookingDate: Date) => ({
        date: [bookingDate],
        available: null // Set to null since car is not available on these dates
      }));

      await Car.updateOne(
        { _id: booking.carId },
        { $push: { schedule: { $each: scheduleEntries } } },
        { session }
      );

      // Alternative Method 2: Remove availability for these dates
      // If you prefer to remove existing availability instead of adding new entries:
      /*
      await Car.updateOne(
        { _id: booking.carId },
        { 
          $pull: { 
            schedule: { 
              date: { $in: booking.schedule.date },
              available: { $ne: null }
            } 
          } 
        },
        { session }
      );
      */
    }

    // Step 4: Commit the transaction
    await session.commitTransaction();

    // Fetch the updated booking with populated data
    const updatedBooking = await Booking.findById(id)
      .populate("carId");

    return NextResponse.json(
      {
        message: "Booking completed successfully",
        booking: updatedBooking
      },
      { status: 200 }
    );

  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    console.error("Error completing booking:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? `Failed to complete booking: ${error.message}`
          : "Failed to complete booking"
      },
      { status: 500 }
    );
  } finally {
    // Always end the session
    session.endSession();
  }
}

// Function to handle regular status updates
interface BookingUpdateBody {
  status?: "pending" | "confirmed" | "cancelled";
  action?: string;
  [key: string]: unknown;
}

async function handleRegularUpdate(id: string, body: BookingUpdateBody) {
  const { status } = body;

  // Validate status
  const validStatuses = ["pending", "confirmed", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Use action: 'complete' for completing bookings." },
      { status: 400 }
    );
  }

  // Check if booking exists
  const existingBooking = await Booking.findById(id);
  if (!existingBooking) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  // Prevent status changes on completed bookings
  if (existingBooking.status === "completed" && status) {
    return NextResponse.json(
      { error: "Cannot modify a completed booking" },
      { status: 400 }
    );
  }

  // Handle cancellation - free up the dates
  if (status === "cancelled" && existingBooking.status !== "cancelled") {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      // Update booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { ...body, status: "cancelled" },
        { new: true, runValidators: true, session }
      ).populate("carId");

      // Remove the booking dates from car's blocked schedule
      if (existingBooking.schedule && existingBooking.schedule.date) {
        await Car.updateOne(
          { _id: existingBooking.carId },
          { 
            $pull: { 
              schedule: { 
                date: { $in: existingBooking.schedule.date },
                available: null // Remove entries where available is null (blocked dates)
              } 
            } 
          },
          { session }
        );
      }

      await session.commitTransaction();
      
      return NextResponse.json({
        message: "Booking cancelled successfully",
        booking: updatedBooking
      }, { status: 200 });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Regular update for confirm and other status changes
  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    body,
    { new: true, runValidators: true }
  ).populate("carId");

  if (!updatedBooking) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: `Booking ${status ? status : 'updated'} successfully`,
    booking: updatedBooking
  }, { status: 200 });
}