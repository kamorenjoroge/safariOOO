import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Investors } from '@/models/investors';
import { Car } from '@/models/cars';
import mongoose from 'mongoose';

// GET investor by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid investor ID format'
      }, { status: 400 });
    }

    const investor = await Investors.findById(id)
      .populate('cars', 'model registrationNumber image')
      .lean();

    if (!investor) {
      return NextResponse.json({
        success: false,
        error: 'Investor not found'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: investor }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching investor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT - Update full investor by ID (Fixed to use JSON instead of FormData)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid investor ID format'
      }, { status: 400 });
    }

    // Parse JSON data instead of FormData
    const body = await request.json();
    const { name, email, phone, location, joinedDate, cars = [] } = body;

    // Validation for required fields
    if (!name || !email || !phone || !location || !joinedDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, phone, location, and joinedDate are required'
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

    // Validate car references if provided
    if (cars.length > 0) {
      const validCars = await Car.find({ _id: { $in: cars } });
      if (validCars.length !== cars.length) {
        return NextResponse.json({
          success: false,
          error: 'One or more car references are invalid'
        }, { status: 400 });
      }
    }

    // Check if investor exists first
    const existingInvestor = await Investors.findById(id);
    if (!existingInvestor) {
      return NextResponse.json({ 
        success: false, 
        error: 'Investor not found' 
      }, { status: 404 });
    }

    // Check for email conflicts (exclude current investor)
    const emailConflict = await Investors.findOne({ 
      email: email.trim().toLowerCase(), 
      _id: { $ne: id } 
    });
    
    if (emailConflict) {
      return NextResponse.json({
        success: false,
        error: 'Email already exists for another investor'
      }, { status: 400 });
    }

    const updatedInvestor = await Investors.findByIdAndUpdate(
      id,
      { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        phone: phone.trim(), 
        location: location.trim(), 
        joinedDate: joinedDate.trim(), 
        cars 
      },
      { new: true, runValidators: true }
    ).populate('cars', 'model registrationNumber image');

    return NextResponse.json({
      success: true,
      data: updatedInvestor,
      message: 'Investor updated successfully'
    });

  } catch (error: unknown) {
    console.error('Error updating investor:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 });
    }

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email already exists' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE investor by ID (Enhanced with better error handling)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid investor ID format'
      }, { status: 400 });
    }

    // Check if investor exists and get their data before deletion
    const investor = await Investors.findById(id);
    
    if (!investor) {
      return NextResponse.json({
        success: false,
        error: 'Investor not found'
      }, { status: 404 });
    }

    // Optional: Check if investor has associated cars and handle accordingly
    if (investor.cars && investor.cars.length > 0) {
      // You might want to add logic here to handle car assignments
      // For example: reassign cars, or prevent deletion if cars are assigned
      console.log(`Deleting investor with ${investor.cars.length} associated cars`);
    }

    // Delete the investor
    await Investors.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Investor deleted successfully',
      data: { 
        id: investor._id,
        name: investor.name,
        carsCount: investor.cars?.length || 0
      }
    });

  } catch (error: unknown) {
    console.error('Error deleting investor:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while deleting investor'
    }, { status: 500 });
  }
}

// PATCH - Partial update (Enhanced with better validation)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid investor ID format'
      }, { status: 400 });
    }

    const body = await request.json();

    const allowedFields = ['name', 'email', 'phone', 'location', 'joinedDate', 'cars'];

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        // Trim string values
        if (typeof value === 'string' && key !== 'cars') {
          updateData[key] = value.trim();
        } else {
          updateData[key] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields provided for update'
      }, { status: 400 });
    }

    // Check if investor exists
    const existingInvestor = await Investors.findById(id);
    if (!existingInvestor) {
      return NextResponse.json({
        success: false,
        error: 'Investor not found'
      }, { status: 404 });
    }

    // If email is being updated, check for conflicts
    if (updateData.email) {
      const emailConflict = await Investors.findOne({ 
        email: (updateData.email as string).toLowerCase(), 
        _id: { $ne: id } 
      });
      
      if (emailConflict) {
        return NextResponse.json({
          success: false,
          error: 'Email already exists for another investor'
        }, { status: 400 });
      }
      
      // Ensure email is lowercase
      updateData.email = (updateData.email as string).toLowerCase();
    }

    // If email is provided, validate format
    if (updateData.email && typeof updateData.email === 'string') {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid email format'
        }, { status: 400 });
      }
    }

    // Validate car references if cars are being updated
    if (updateData.cars && Array.isArray(updateData.cars) && updateData.cars.length > 0) {
      const validCars = await Car.find({ _id: { $in: updateData.cars } });
      if (validCars.length !== updateData.cars.length) {
        return NextResponse.json({
          success: false,
          error: 'One or more car references are invalid'
        }, { status: 400 });
      }
    }

    const updatedInvestor = await Investors.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('cars', 'model registrationNumber image');

    return NextResponse.json({
      success: true,
      data: updatedInvestor,
      message: 'Investor updated successfully'
    });

  } catch (error: unknown) {
    console.error('Error updating investor:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 });
    }

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email already exists' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}