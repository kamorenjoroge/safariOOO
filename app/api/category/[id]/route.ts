import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/dbConnect';
import { Category } from '@/models/categories';

// PUT - Update a car category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params; // Await params in Next.js 15

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Extract text fields
    const title = formData.get('title')?.toString() || '';
    const description = formData.get('description')?.toString() || '';
    const priceFrom = formData.get('priceFrom')?.toString() || '';
    const popular = formData.get('popular') === 'true';
    const imageFile = formData.get('image') as File | null;
    const existingImage = formData.get('existingImage')?.toString() || '';

    // Handle features - get ALL feature entries from FormData
    const features: string[] = [];
    
    // Get all entries with key 'features'
    const allEntries = Array.from(formData.entries());
    const featureEntries = allEntries.filter(([key]) => key === 'features');
    
    // Extract all feature values
    featureEntries.forEach(([, value]) => {
      const featureValue = value.toString().trim();
      if (featureValue && !features.includes(featureValue)) {
        features.push(featureValue);
      }
    });

    console.log('Processed features for update:', features); // Debug log
    console.log('Category ID:', id); // Debug log

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

    // Find existing category
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    let imageUrl = existingCategory.image;

    // Handle image upload if new image is provided
    if (imageFile && imageFile.size > 0) {
      const buffer = await imageFile.arrayBuffer();
      const array = new Uint8Array(buffer);

      imageUrl = await new Promise<string>((resolve, reject) => {
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
    } else if (existingImage) {
      // Keep existing image if no new image is uploaded
      imageUrl = existingImage;
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        title,
        description,
        priceFrom,
        features,
        popular,
        image: imageUrl,
      },
      { new: true }
    );

    return NextResponse.json({ 
      success: true, 
      data: updatedCategory 
    });

  } catch (error: unknown) {
    console.error('Error updating car category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { 
      status: 500 
    });
  }
}

// DELETE - Delete a car category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params; // Await params in Next.js 15

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting category with ID:', id); // Debug log

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Optional: Delete image from Cloudinary
    // You would need to extract the public_id from the image URL and call:
    // await cloudinary.uploader.destroy(public_id);

    return NextResponse.json({ 
      success: true, 
      data: deletedCategory 
    });

  } catch (error: unknown) {
    console.error('Error deleting car category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { 
      status: 500 
    });
  }
}

// GET - Get a single car category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params; // Await params in Next.js 15

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: category 
    });

  } catch (error: unknown) {
    console.error('Error fetching car category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { 
      status: 500 
    });
  }
}