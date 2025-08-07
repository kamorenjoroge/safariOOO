import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/dbConnect';
import { Category } from '@/models/categories';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const formData = await request.formData();

    // Extract text fields
    const title = formData.get('title')?.toString() || '';
    const description = formData.get('description')?.toString() || '';
    const priceFrom = formData.get('priceFrom')?.toString() || '';
    const popular = formData.get('popular') === 'true';
    const imageFile = formData.get('image') as File | null;

    // Handle features - get ALL feature entries from FormData
    const features: string[] = [];
    
    // Method 1: Get all entries with key 'features' (for multiple append calls)
    const allEntries = Array.from(formData.entries());
    const featureEntries = allEntries.filter(([key]) => key === 'features');
    
    // Extract all feature values
    featureEntries.forEach(([, value]) => {
      const featureValue = value.toString().trim();
      if (featureValue && !features.includes(featureValue)) {
        features.push(featureValue);
      }
    });

    // Method 2: Fallback to check for JSON string (if sent as single JSON)
    if (features.length === 0) {
      const featuresJson = formData.get('featuresJson')?.toString();
      if (featuresJson) {
        try {
          const parsedFeatures = JSON.parse(featuresJson) as string[];
          features.push(...parsedFeatures);
        } catch (e) {
          console.error('Failed to parse features JSON:', e);
        }
      }
    }

    console.log('Processed features:', features); // Debug log

    // Validate required fields
    if (!title || !description || !priceFrom || features.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields. Title, description, price, and at least one feature are required.',
          debug: { title: !!title, description: !!description, priceFrom: !!priceFrom, featuresCount: features.length } 
        },
        { status: 400 }
      );
    }

    // Handle image upload
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Image is required' },
        { status: 400 }
      );
    }

    const buffer = await imageFile.arrayBuffer();
    const array = new Uint8Array(buffer);

    const imageUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'car_categories',
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

    // Create new Car Category
    const category = await Category.create({
      title,
      description,
      priceFrom,
      features,
      popular,
      image: imageUrl,
    });

    return NextResponse.json({ 
      success: true, 
      data: category 
    }, { 
      status: 201 
    });

  } catch (error: unknown) {
    console.error('Error creating car category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { 
      status: 500 
    });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      data: categories 
    }, { 
      status: 200 
    });
  } catch (error: unknown) {
    console.error('Error fetching car categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { 
      status: 500 
    });
  }
}

