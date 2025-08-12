// app/api/booking/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Booking } from '@/models/booking';
import { Car } from '@/models/cars';

export async function GET() {
  try {
    // Connect to database
    await dbConnect();

    // Fetch bookings and populate car details
    const bookings = await Booking.find()
      .populate({
        path: 'carId',
        model: Car,
        select: 'model registrationNumber pricePerDay image',
      })
      .sort({ createdAt: -1 }) // newest first
    
      // limit to 1 document  .limit(1);

    return NextResponse.json(bookings, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch bookings';
    console.error('Booking GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
