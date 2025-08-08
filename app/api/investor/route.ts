import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Investors } from '@/models/investors';
import { Car } from '@/models/cars';

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Parse JSON data instead of FormData
    const body = await request.json();
    
    const { name, email, phone, location, joinedDate, cars = [] } = body;

    // Validation
    if (!name || !email || !phone || !location || !joinedDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Optional: Validate car IDs if provided
    if (cars.length > 0) {
      const validCars = await Car.find({ _id: { $in: cars } });
      if (validCars.length !== cars.length) {
        return NextResponse.json({
          success: false,
          error: 'One or more car references are invalid'
        }, { status: 400 });
      }
    }

    // Save investor to DB
    const investor = await Investors.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: location.trim(),
      joinedDate: joinedDate.trim(),
      cars,
    });

    return NextResponse.json({
      success: true,
      data: investor
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating investor:', error);
    
    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email already exists' 
      }, { status: 400 });
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    const investors = await Investors.find()
      .populate('cars', 'model registrationNumber image') // show car details
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: investors
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching investors:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}