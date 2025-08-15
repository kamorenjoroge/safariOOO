// app/api/booking/[id]/complete/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Booking } from "@/models/booking";
import { Car } from "@/models/cars";
import mongoose from "mongoose";

// PATCH - Complete booking by ID with transaction
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  
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

    // Start transaction
    session.startTransaction();

    // Step 1: Get the booking with schedule and carId
    const booking = await Booking.findById(id)
      .select('schedule carId status')
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

    // Step 3: Build new schedule entries for the car
    if (booking.schedule && booking.schedule.date && booking.schedule.date.length > 0) {
      const newScheduleEntries = booking.schedule.date.map((d: Date) => ({
        date: [d],
        available: false
      }));

      // Step 4: Push schedule entries to car's schedule
      await Car.updateOne(
        { _id: booking.carId },
        { $push: { schedule: { $each: newScheduleEntries } } },
        { session }
      );
    }

    // Step 5: Commit the transaction
    await session.commitTransaction();

    // Fetch the updated booking with populated data
    const updatedBooking = await Booking.findById(id)
      .populate("carId")
      .populate("customerId");

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