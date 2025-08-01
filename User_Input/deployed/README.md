# Railway APIs Documentation

This directory contains the source code for all APIs deployed on Railway for the VepLim system.

## APIs Overview

### 1. **api-users** (Authentication & User Management)
- **Base URL**: https://api-users-production-54ed.up.railway.app
- **Endpoints**:
  - `POST /login` - User authentication
  - `POST /register` - User registration  
  - `GET /me` - Get current user
  - `PUT /me` - Update current user
  - `GET /users` - List all users (admin only)

### 2. **api-customers** (Customers & Suppliers)
- **Base URL**: https://api-customers-production.up.railway.app
- **Customer Endpoints**:
  - `GET /customer` - List all customers
  - `GET /customer/:id` - Get customer by ID
  - `GET /customer/code/:code` - Get customer by code
  - `POST /customer` - Create new customer
  - `PUT /customer/:id` - Update customer
  - `DELETE /customer/:id` - Delete customer (soft delete)
- **Supplier Endpoints**:
  - `GET /supplier` - List all suppliers
  - `GET /supplier/:id` - Get supplier by ID
  - `GET /supplier/code/:code` - Get supplier by code
  - `POST /supplier` - Create new supplier
  - `PUT /supplier/:id` - Update supplier
  - `DELETE /supplier/:id` - Delete supplier (soft delete)

### 3. **api-jornada-produto** (Product Journey)
- **Base URL**: https://api-jornada-produto-production.up.railway.app
- **Endpoints**:
  - `GET /jornada-produto/orders` - List all orders
  - `GET /jornada-produto/orders/:orderId` - Get specific order
  - `GET /jornada-produto/orders/:orderId/items` - Get order items

### 4. **api-delivery** (Delivery Management)
- **Base URL**: https://api-delivery-production-0851.up.railway.app
- **Endpoints**:
  - `GET /delivery` - List all delivery routes
  - `GET /delivery/:id` - Get specific delivery route
  - `GET /delivery/status/:status` - Filter by status
  - `GET /delivery/driver/:driverId` - Filter by driver
  - `GET /delivery/stats` - Delivery statistics
  - `GET /delivery/:routeId/points` - Get route points

### 5. **api-dashboard** (Orders & Dashboard)
- **Base URL**: https://api-dashboard-production-f3c4.up.railway.app
- **Endpoints**: TBD

### 6. **api-vehicles** (Vehicle Management)
- **Base URL**: https://api-vehicles-production.up.railway.app
- **Endpoints**: TBD

### 7. **api-userlogs** (User Activity Logs)
- **Base URL**: https://api-userlog-production.up.railway.app
- **Endpoints**: TBD

### 8. **api-audit** (Audit Logs)
- **Base URL**: https://api-audit-production.up.railway.app
- **Endpoints**:
  - `GET /audit/logs` - List all audit logs
  - `GET /audit/logs/user/:userId` - Filter by user
  - `GET /audit/logs/action/:action` - Filter by action

## Common Features

- **Authentication**: All APIs (except login/register) require JWT Bearer token
- **Database**: PostgreSQL with SSL
- **Framework**: Hono with Bun runtime
- **Response Format**: JSON
- **Error Handling**: Standard HTTP status codes with error messages in Portuguese

## Environment Variables

Each API requires:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)

## Development Notes

- APIs are deployed on Railway with Bun runtime
- All APIs use HTTPS in production
- Internal communication uses `.railway.internal` domains
- External access uses `.up.railway.app` domains