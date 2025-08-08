import { NextResponse } from 'next/server';
import { Car } from '@/models/cars';
import { Investors } from '@/models/investors';
import connectDB from '@/lib/dbConnect';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const registration = searchParams.get('registration');

    // Validate the registration parameter
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration parameter is required' },
        { status: 400 }
      );
    }
    if (registration.length < 3) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Get all car IDs assigned to investors
    const assignedCars = await Investors.distinct('cars');

    // Find cars matching registration but not in investor's cars
    const cars = await Car.find({
      registrationNumber: {
        $regex: registration,
        $options: 'i',
      },
      _id: { $nin: assignedCars }, // exclude assigned cars
    })
      .select('_id registrationNumber image model')
      .limit(20)
      .lean();

    return NextResponse.json(
      {
        data: cars,
        count: cars.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error searching cars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
