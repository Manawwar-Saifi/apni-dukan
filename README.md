# Apni Dukaan - Backend API

A Node.js + MongoDB marketplace backend where sellers can manage their shop and list products.

## Tech Stack

- **Runtime:** Node.js (ES6 Modules)
- **Framework:** Express.js v5
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator
- **Testing:** Jest + Supertest

## Project Structure

```
apni-dukan/
├── seed.js                                # Admin user seeder
├── server.js                              # Entry point
├── app.js                                 # Express app config & route registration
├── src/
│   ├── config/db.js                       # MongoDB connection
│   ├── modules/
│   │   ├── auth/                          # Signup, Login, GetMe
│   │   │   ├── auth.model.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validator.js
│   │   ├── shop/                          # Shop CRUD (seller only)
│   │   │   ├── shop.model.js
│   │   │   ├── shop.controller.js
│   │   │   ├── shop.routes.js
│   │   │   └── shop.validator.js
│   │   └── product/                       # Product CRUD (seller only)
│   │       ├── product.model.js
│   │       ├── product.controller.js
│   │       ├── product.routes.js
│   │       └── product.validator.js
│   ├── middleware/
│   │   ├── auth.js                        # JWT verification
│   │   ├── roleCheck.js                   # Role-based access control
│   │   ├── validate.js                    # Request validation runner
│   │   └── errorHandler.js                # Global error handler
│   └── utils/
│       ├── ApiError.js                    # Custom error class
│       └── asyncHandler.js                # Async try-catch wrapper
└── tests/
    ├── setup.js                           # Test DB setup/teardown
    ├── auth.test.js
    ├── shop.test.js
    └── product.test.js
```

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### Installation

```bash
git clone <repo-url>
cd apni-dukan
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/apni-dukan
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### Seed Admin User

```bash
npm run seed
```

This creates a default admin user (skips if already exists):

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@apnidukan.com`  |
| Password | `admin123`             |
| Role     | `admin`                |

### Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Tests
npm test
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint           | Auth | Description                  |
|--------|--------------------|------|------------------------------|
| POST   | `/api/auth/signup`  | No   | Register a new user          |
| POST   | `/api/auth/login`   | No   | Login and get JWT token      |
| GET    | `/api/auth/me`      | Yes  | Get current logged-in user   |

### Shop (`/api/shop`) - Seller only

| Method | Endpoint     | Auth   | Description                    |
|--------|-------------|--------|--------------------------------|
| POST   | `/api/shop`  | Seller | Create shop profile            |
| GET    | `/api/shop`  | Seller | Get own shop details           |
| PUT    | `/api/shop`  | Seller | Update shop details / status   |

### Products (`/api/products`) - Seller only

| Method | Endpoint              | Auth   | Description                       |
|--------|-----------------------|--------|-----------------------------------|
| POST   | `/api/products`        | Seller | Add a new product                 |
| GET    | `/api/products`        | Seller | List own products                 |
| GET    | `/api/products/:id`    | Seller | Get a single product              |
| PUT    | `/api/products/:id`    | Seller | Update a product                  |
| DELETE | `/api/products/:id`    | Seller | Soft-delete a product             |

## API Usage Examples

### 1. Register a Seller

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul",
    "email": "rahul@example.com",
    "password": "123456",
    "role": "seller"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUz...",
  "user": { "id": "...", "name": "Rahul", "email": "rahul@example.com", "role": "seller" }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "rahul@example.com", "password": "123456" }'
```

### 3. Create Shop

```bash
curl -X POST http://localhost:5000/api/shop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Rahul Ki Dukaan",
    "description": "Fresh groceries daily",
    "address": { "street": "MG Road", "city": "Delhi", "state": "Delhi", "pincode": "110001" },
    "status": "open"
  }'
```

### 4. Update Shop Status to ASP (Scheduled)

```bash
curl -X PUT http://localhost:5000/api/shop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "asp",
    "schedule": [
      { "day": "mon", "open": "09:00", "close": "21:00" },
      { "day": "tue", "open": "09:00", "close": "21:00" },
      { "day": "wed", "open": "10:00", "close": "18:00" }
    ]
  }'
```

### 5. Add a Product

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Basmati Rice (5kg)",
    "description": "Premium quality basmati",
    "price": 450,
    "priceType": "fixed",
    "category": "Grocery"
  }'
```

### 6. Add a Negotiable Product

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Handmade Pottery Set",
    "price": 2500,
    "priceType": "negotiable",
    "category": "Handicraft"
  }'
```

## Data Models

### User
| Field      | Type    | Notes                              |
|------------|---------|-------------------------------------|
| name       | String  | Required                            |
| email      | String  | Required, unique                    |
| password   | String  | Hashed with bcrypt, min 6 chars     |
| role       | String  | `admin` / `seller` / `buyer` / `delivery` |
| isActive   | Boolean | Default: true                       |

### Shop
| Field       | Type     | Notes                              |
|-------------|----------|-------------------------------------|
| owner       | ObjectId | Ref: User, unique (one shop/seller) |
| name        | String   | Required                            |
| description | String   | Optional                            |
| address     | Object   | { street, city, state, pincode }    |
| status      | String   | `open` / `closed` / `asp`           |
| schedule    | Array    | Required when status = `asp`        |

### Product
| Field       | Type     | Notes                              |
|-------------|----------|-------------------------------------|
| shop        | ObjectId | Ref: Shop                           |
| name        | String   | Required                            |
| description | String   | Optional                            |
| price       | Number   | Required, min: 0                    |
| priceType   | String   | `fixed` / `negotiable`              |
| category    | String   | Required (free-form)                |
| image       | String   | Optional (URL)                      |
| isActive    | Boolean  | Default: true (soft-delete flag)    |

## Roles

| Role     | Status       |
|----------|-------------|
| Admin    | Active       |
| Seller   | Active       |
| Buyer    | Coming soon  |
| Delivery | Coming soon  |

## Shop Status Types

| Status   | Description                              |
|----------|------------------------------------------|
| `open`   | Shop is currently open                   |
| `closed` | Shop is currently closed                 |
| `asp`    | As Per Schedule - opens on set schedule  |

## Tests

44 test cases covering:
- **Auth (14 tests):** signup validation, duplicate email, login, wrong password, token auth
- **Shop (12 tests):** create, get, update, ASP with schedule, role check, duplicate prevention
- **Product (18 tests):** CRUD, price types, seller isolation, soft-delete, validation

```bash
npm test
```

## Adding New Modules

To add a new feature (e.g., orders):

1. Create `src/modules/order/` with `order.model.js`, `order.controller.js`, `order.routes.js`, `order.validator.js`
2. Import and register routes in `app.js`:
   ```js
   import orderRoutes from './src/modules/order/order.routes.js';
   app.use('/api/orders', orderRoutes);
   ```
3. Add tests in `tests/order.test.js`
