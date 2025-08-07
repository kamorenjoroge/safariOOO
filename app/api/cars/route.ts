import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/dbConnect';
import { Car } from '@/models/cars';
import { Category } from '@/models/categories';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const formData = await request.formData();

    const model = formData.get('model')?.toString() || '';
    const type = formData.get('type')?.toString() || '';
    const registrationNumber = formData.get('registrationNumber')?.toString() || '';
    const location = formData.get('location')?.toString() || '';
    const pricePerDay = parseFloat(formData.get('pricePerDay')?.toString() || '0');
    const year = parseInt(formData.get('year')?.toString() || '0');
    const transmission = formData.get('transmission')?.toString() || '';
    const fuel = formData.get('fuel')?.toString() || '';
    const seats = parseInt(formData.get('seats')?.toString() || '0');
    const imageFile = formData.get('image') as File | null;

    // Handle features (array)
    const features: string[] = [];
    const entries = Array.from(formData.entries()).filter(([key]) => key === 'features');
    entries.forEach(([, value]) => {
      const feature = value.toString().trim();
      if (feature && !features.includes(feature)) features.push(feature);
    });

    // Optional: handle JSON fallback
    if (features.length === 0) {
      const featuresJson = formData.get('featuresJson')?.toString();
      if (featuresJson) {
        try {
          features.push(...(JSON.parse(featuresJson) as string[]));
        } catch (e) {
          console.error('Failed to parse features JSON:', e);
        }
      }
    }

    // Validation
    if (!model || !type || !registrationNumber || !location || !pricePerDay || !year || !transmission || !fuel || !seats || !imageFile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate category exists
    const categoryExists = await Category.findById(type);
    if (!categoryExists) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category selected'
      }, { status: 400 });
    }

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({
        success: false,
        error: 'Image is required'
      }, { status: 400 });
    }

    // Upload image to Cloudinary
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
            console.error('Cloudinary error:', error);
            reject(error || new Error('Upload failed'));
            return;
          }
          resolve(result.secure_url);
        }
      ).end(array);
    });

    // Save car to DB
    const car = await Car.create({
      model,
      type, // Reference ObjectId to Category
      registrationNumber,
      location,
      pricePerDay,
      image: imageUrl,
      year,
      transmission,
      fuel,
      seats,
      features
    });

    return NextResponse.json({
      success: true,
      data: car
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating car:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    const cars = await Car.find()
      .populate('type', 'title') // Populate category title - Category model is used here
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: cars }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching cars:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}