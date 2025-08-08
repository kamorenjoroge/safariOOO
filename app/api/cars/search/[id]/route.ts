import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
async function ensureModelsRegistered() {
  try {
    const { Car } = await import('@/models/cars');
    const { Category } = await import('@/models/categories');
    return { Car, Category };
  } catch (error) {
    console.error('Error importing models:', error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Ensure all models are registered
    const { Car } = await ensureModelsRegistered();
    
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid car ID format'
      }, { status: 400 });
    }

    const car = await Car.findById(id)
      .populate('type', 'title')
      .lean();

    if (!car) {
      return NextResponse.json({
        success: false,
        error: 'Car not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: car
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching car:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}