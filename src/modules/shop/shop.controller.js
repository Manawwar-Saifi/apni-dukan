import Shop from './shop.model.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/upload.js';

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const computeLiveStatus = (shop) => {
  const shopObj = shop.toObject();

  if (shopObj.status !== 'asp' || !shopObj.schedule?.length) {
    return { ...shopObj, isOpenNow: shopObj.status === 'open', liveMessage: null };
  }

  const now = new Date();
  const today = DAY_MAP[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEntry = shopObj.schedule.find((s) => s.day === today);

  if (todayEntry) {
    const [openH, openM] = todayEntry.open.split(':').map(Number);
    const [closeH, closeM] = todayEntry.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      return { ...shopObj, isOpenNow: true, liveMessage: `Closes at ${formatTime12h(todayEntry.close)}` };
    }

    if (currentMinutes < openMin) {
      return { ...shopObj, isOpenNow: false, liveMessage: `Opens today at ${formatTime12h(todayEntry.open)}` };
    }
  }

  // Find next open day
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (now.getDay() + i) % 7;
    const entry = shopObj.schedule.find((s) => s.day === DAY_MAP[dayIndex]);
    if (entry) {
      const dayLabel = i === 1 ? 'tomorrow' : DAY_MAP[dayIndex].charAt(0).toUpperCase() + DAY_MAP[dayIndex].slice(1);
      return { ...shopObj, isOpenNow: false, liveMessage: `Opens ${dayLabel} at ${formatTime12h(entry.open)}` };
    }
  }

  return { ...shopObj, isOpenNow: false, liveMessage: null };
};

const formatTime12h = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

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

  res.status(201).json({ success: true, shop: computeLiveStatus(shop) });
});

// GET /api/shop
export const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    throw new ApiError(404, 'Shop not found. Create one first.');
  }

  res.json({ success: true, shop: computeLiveStatus(shop) });
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

  res.json({ success: true, shop: computeLiveStatus(shop) });
});
