import Product from './product.model.js';
import Shop from '../shop/shop.model.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

// Helper: get seller's shop or throw
const getSellerShop = async (userId) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    throw new ApiError(404, 'You need to create a shop before adding products');
  }
  return shop;
};

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const shop = await getSellerShop(req.user._id);

  const product = await Product.create({
    ...req.body,
    shop: shop._id,
  });

  res.status(201).json({ success: true, product });
});

// GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const shop = await getSellerShop(req.user._id);

  const products = await Product.find({ shop: shop._id, isActive: true });

  res.json({ success: true, count: products.length, products });
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const shop = await getSellerShop(req.user._id);

  const product = await Product.findOne({
    _id: req.params.id,
    shop: shop._id,
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({ success: true, product });
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const shop = await getSellerShop(req.user._id);

  const product = await Product.findOne({
    _id: req.params.id,
    shop: shop._id,
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const { name, description, price, priceType, category, image } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (priceType !== undefined) product.priceType = priceType;
  if (category !== undefined) product.category = category;
  if (image !== undefined) product.image = image;

  await product.save();

  res.json({ success: true, product });
});

// DELETE /api/products/:id (soft delete)
export const deleteProduct = asyncHandler(async (req, res) => {
  const shop = await getSellerShop(req.user._id);

  const product = await Product.findOne({
    _id: req.params.id,
    shop: shop._id,
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.isActive = false;
  await product.save();

  res.json({ success: true, message: 'Product removed' });
});
