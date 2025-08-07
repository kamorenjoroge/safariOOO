import { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true
  },
  image: { 
    type: String, 
    required: [true, 'Image URL is required'],
    trim: true
  },
  priceFrom: { 
    type: String, 
    required: [true, 'Price is required'],
    trim: true
  },
  features: { 
    type: [String], 
    required: [true, 'Features are required'],
    validate: {
      validator: (features: string[]) => features.length > 0,
      message: 'At least one feature is required'
    }
  },
  popular: { 
    type: Boolean, 
    default: false 
  },
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    
  },
  toObject: {
    virtuals: true
  }
});

export const Category = models.Category || model('Category', CategorySchema);