import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/dbConnect';
import { Car } from '@/models/cars';
import mongoose from 'mongoose';

// GET single car by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
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

// PUT/PATCH - Update car by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid car ID format'
      }, { status: 400 });
    }

    // Check if car exists
    const existingCar = await Car.findById(id).lean();
    if (!existingCar) {
      return NextResponse.json({
        success: false,
        error: 'Car not found'
      }, { status: 404 });
    }

    const formData = await request.formData();
    
    // Extract form fields
    const model = formData.get('model')?.toString().trim() || '';
    const type = formData.get('type')?.toString().trim() || '';
    const registrationNumber = formData.get('registrationNumber')?.toString().trim() || '';
    const location = formData.get('location')?.toString().trim() || '';
    const pricePerDay = parseFloat(formData.get('pricePerDay')?.toString() || '0');
    const year = parseInt(formData.get('year')?.toString() || '0');
    const transmission = formData.get('transmission')?.toString().trim() || '';
    const fuel = formData.get('fuel')?.toString().trim() || '';
    const seats = parseInt(formData.get('seats')?.toString() || '0');
    const imageFile = formData.get('image') as File | null;

    // Handle features array
    const features: string[] = [];
    const featureEntries = Array.from(formData.entries()).filter(([key]) => key === 'features');
    featureEntries.forEach(([, value]) => {
      const feature = value.toString().trim();
      if (feature && !features.includes(feature)) {
        features.push(feature);
      }
    });

    // Fallback to JSON features if no individual features found
    if (features.length === 0) {
      const featuresJson = formData.get('featuresJson')?.toString();
      if (featuresJson) {
        try {
          const parsedFeatures = JSON.parse(featuresJson) as string[];
          if (Array.isArray(parsedFeatures)) {
            features.push(...parsedFeatures.filter(f => typeof f === 'string' && f.trim()));
          }
        } catch (e) {
          console.error('Failed to parse features JSON:', e);
        }
      }
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {};

    // Only include fields that are provided and valid
    if (model) updateData.model = model;
    if (type) updateData.type = type;
    if (registrationNumber) updateData.registrationNumber = registrationNumber;
    if (location) updateData.location = location;
    if (pricePerDay > 0) updateData.pricePerDay = pricePerDay;
    if (year >= 1900) updateData.year = year;
    if (transmission) updateData.transmission = transmission;
    if (fuel) updateData.fuel = fuel;
    if (seats >= 1) updateData.seats = seats;
    if (features.length > 0) updateData.features = features;

    // Handle image upload if new image is provided
    if (imageFile && imageFile.size > 0) {
      try {
        // Upload new image
        const buffer = await imageFile.arrayBuffer();
        const array = new Uint8Array(buffer);
        
        const imageUrl = await new Promise<string>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'cars',
              resource_type: 'auto'
            },
            (error, result) => {
              if (error || !result) {
                console.error('Cloudinary upload error:', error);
                reject(error || new Error('Image upload failed'));
                return;
              }
              resolve(result.secure_url);
            }
          ).end(array);
        });

        updateData.image = imageUrl;
      } catch (imageError) {
        console.error('Image upload error:', imageError);
        return NextResponse.json({
          success: false,
          error: 'Failed to upload new image'
        }, { status: 500 });
      }
    }

    // Ensure we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields provided for update'
      }, { status: 400 });
    }

    // Update the car
    const updatedCar = await Car.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true,
        lean: false
      }
    ).populate('type', 'title');

    if (!updatedCar) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update car'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedCar,
      message: 'Car updated successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating car:', error);
    
    // Handle mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }

    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Registration number already exists'
      }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}

// DELETE car by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid car ID format'
      }, { status: 400 });
    }

    // Find car before deletion to get image URL
    const carToDelete = await Car.findById(id).lean();
    if (!carToDelete) {
      return NextResponse.json({
        success: false,
        error: 'Car not found'
      }, { status: 404 });
    }

    // Delete car from database
    const deletedCar = await Car.findByIdAndDelete(id).lean();

    if (!deletedCar) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete car'
      }, { status: 500 });
    }

    // Note: Manual Cloudinary image deletion as requested

    // Explicitly assert deletedCar as any to access _id
    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully',
      data: { id: (deletedCar as Record<string, unknown>)._id }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting car:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}

// PATCH - Partial update (alternative to PUT)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid car ID format'
      }, { status: 400 });
    }

    // Parse JSON body for PATCH requests
    const body = await request.json();
    
    // Validate that body is not empty
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Request body is required'
      }, { status: 400 });
    }

    // Sanitize and validate update data
    const allowedFields = [
      'model', 'type', 'registrationNumber', 'location', 
      'pricePerDay', 'year', 'transmission', 'fuel', 
      'seats', 'features', 'image'
    ];

    const updateData: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields provided for update'
      }, { status: 400 });
    }

    // Update the car
    const updatedCar = await Car.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true,
        lean: false
      }
    ).populate('type', 'title');

    if (!updatedCar) {
      return NextResponse.json({
        success: false,
        error: 'Car not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedCar,
      message: 'Car updated successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating car:', error);
    
    // Handle mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }

    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Registration number already exists'
      }, { status: 409 });
    }

    // Handle invalid JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}