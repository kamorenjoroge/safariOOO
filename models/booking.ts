import { Schema, model, models } from 'mongoose';

const BookingSchema = new Schema({
  bookingId: {
    type: String,
    unique: true,
    default: function () {
      return (
        'BK' +
        Date.now() +
        Math.random().toString(36).substr(2, 4).toUpperCase()
      );
    },
  },
  carId: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Car ID is required'],
  },

  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    required: true,
  },

  customerInfo: {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
    },
  },

  specialRequests: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requests cannot exceed 500 characters'],
  },
  schedule: {
    available: {
      type: Boolean,
      default: false,
    },
    date: [
      {
        type: Date,
        required: true,
      },
    ],
  },
},
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export const Booking = models.Booking || model('Booking', BookingSchema);