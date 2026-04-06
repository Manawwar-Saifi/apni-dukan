import Shop from './shop.model.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/upload.js';

// POST /api/shop
export const createShop = asyncHandler(async (req, res) => {
  const existing = await Shop.findOne({ owner: req.user._id });
  if (existing) {
    throw new ApiError(400, 'You already have a shop. Use update instead.');
  }

  const shopData = { ...req.body, owner: req.user._id };

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'shops');
    shopData.image = { url: result.secure_url, publicId: result.public_id };
  }

  const shop = await Shop.create(shopData);

  res.status(201).json({ success: true, shop });
});

// GET /api/shop
export const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    throw new ApiError(404, 'Shop not found. Create one first.');
  }

  res.json({ success: true, shop });
});

// PUT /api/shop
export const updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    throw new ApiError(404, 'Shop not found. Create one first.');
  }

  // Update fields
  const { name, description, address, status, schedule } = req.body;

  if (name !== undefined) shop.name = name;
  if (description !== undefined) shop.description = description;
  if (address !== undefined) {
    shop.address = { ...shop.address.toObject(), ...address };
  }
  if (status !== undefined) shop.status = status;
  if (schedule !== undefined) shop.schedule = schedule;

  if (req.file) {
    // Delete old image if exists
    if (shop.image?.publicId) {
      await deleteFromCloudinary(shop.image.publicId);
    }
    const result = await uploadToCloudinary(req.file.buffer, 'shops');
    shop.image = { url: result.secure_url, publicId: result.public_id };
  }

  await shop.save();

  res.json({ success: true, shop });
});
