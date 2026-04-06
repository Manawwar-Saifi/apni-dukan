import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      required: true,
    },
    open: {
      type: String,
      required: true,
    },
    close: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'asp'],
      default: 'closed',
    },
    schedule: {
      type: [scheduleSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Validate: schedule required when status is asp
shopSchema.pre('save', function () {
  if (this.status === 'asp' && this.schedule.length === 0) {
    throw new Error('Schedule is required when status is ASP');
  }
});

const Shop = mongoose.model('Shop', shopSchema);

export default Shop;
