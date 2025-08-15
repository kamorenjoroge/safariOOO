// api/dashboard/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Category } from '@/models/categories';
import { Car } from '@/models/cars';
import { Investors } from '@/models/investors';
import { availableMemory } from 'process';
//import { Booking } from '@/models/booking';

export async function GET() {
  try {
    await dbConnect();

    // Count all
    const totalCars = await Car.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalOwners = await Investors.countDocuments();

    // Example booked cars count — adjust query based on your schema
   // const bookedCars = await Car.countDocuments({ status: 'booked' });
    // OR if bookings are in Booking model:
    // const bookedCars = await Booking.countDocuments({ status: 'booked' });

    const summaryData = {
      totalCars,
      totalCategories,
      totalOwners,
    bookedCars: 18, // Placeholder value, replace with actual query
    availableCars: 42, // Placeholder value, replace with actual query
    };

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
