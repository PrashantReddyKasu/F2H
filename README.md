# Farm-to-Home (F2H) Application

Farm-to-Home (F2H) is a platform that connects farmers directly with customers, with delivery partners facilitating the logistics. This application features real-time bargaining, bundle deals, and price matching to create a dynamic marketplace for agricultural products.

## Core Features

### 1. Gain (Bargain System)
- Customers can select a product from two farmers at the same price and send a bargain request to both
- Each farmer has 1 hour to respond with a better price
- The better offer wins the order
- If no one responds, the request is auto-cancelled and the customer is notified

### 2. Bundle Deal
- When a customer adds a large quantity of a product, they can request a better price
- The farmer has 1 hour to respond with approval, rejection, or a new price
- If no response, the request is auto-cancelled and the customer is notified

### 3. Price Matching
- Customers can ask a farmer to match a lower price offered by another
- The farmer has 1 hour to respond
- If no response, the request is auto-cancelled and the customer is notified

## Technology Stack

- **Frontend**: React.js with Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Scheduling**: node-cron for request expiry handling
- **Database**: MongoDB Atlas

## Project Structure

\`\`\`
F2H/
│
├── frontend/             # React + Vite (TypeScript)
│   ├── src/              # Source code
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # Context providers (Auth, Socket)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.tsx       # Main application component
│
├── backend/              # Node.js + Express + Mongoose
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── jobs/             # Cron jobs for request expiry
│   ├── socket.js         # Socket.IO configuration
│   └── server.js         # Entry point
│
├── .env.example          # Example environment variables
├── Dockerfile            # Docker configuration
└── README.md             # Project documentation
\`\`\`

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Git

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/PrashantReddyKasu/F2H
   cd f2h
   \`\`\`

2. Set up the backend:
   \`\`\`bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   npm install
   \`\`\`

3. Set up the frontend:
   \`\`\`bash
   cd frontend
   cp .env.example .env
   npm install
   \`\`\`

### Running the Application

1. Start the backend server:
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

2. Start the frontend development server:
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

3. Access the application at `http://localhost:5173`

## User Roles

### Customer
- Browse products
- Send bargain requests, bundle deal requests, and price match requests
- Place orders
- Track order status

### Farmer
- Manage products (add, edit, delete)
- Respond to customer requests
- Process orders

### Delivery Partner
- View assigned deliveries
- Update delivery status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/similar/:id` - Get similar products
- `GET /api/products/farmer` - Get products by farmer
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Requests
- `POST /api/requests/bargain` - Create a bargain request
- `POST /api/requests/bundle` - Create a bundle deal request
- `POST /api/requests/price-match` - Create a price match request
- `GET /api/requests/farmer` - Get requests for a farmer
- `GET /api/requests/customer` - Get requests for a customer
- `POST /api/requests/bargain/accept` - Accept a bargain request
- `POST /api/requests/bargain/reject` - Reject a bargain request
- `POST /api/requests/bundle/accept` - Accept a bundle deal request
- `POST /api/requests/bundle/reject` - Reject a bundle deal request
- `POST /api/requests/bundle/counter` - Make counter offer for a bundle deal
- `POST /api/requests/price-match/accept` - Accept a price match request
- `POST /api/requests/price-match/reject` - Reject a price match request

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/customer` - Get orders for a customer
- `GET /api/orders/farmer` - Get orders for a farmer
- `GET /api/orders/partner` - Get orders for a delivery partner
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status

## Socket.IO Events

### Server to Client
- `new_request` - New request created
- `request_update` - Request status updated
- `bargain_update` - Bargain request updated
- `bundle_update` - Bundle deal request updated
- `price_match_update` - Price match request updated
- `new_order` - New order created
- `order_update` - Order status updated

## Deployment

### Using Docker

1. Build the Docker image:
   \`\`\`bash
   docker build -t f2h-app .
   \`\`\`

2. Run the container:
   \`\`\`bash
   docker run -p 5000:5000 -d f2h-app
   \`\`\`

### Manual Deployment

1. Build the frontend:
   \`\`\`bash
   cd frontend
   npm run build
   \`\`\`

2. Start the backend server:
   \`\`\`bash
   cd backend
   npm start
   \`\`\`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped with the development of this application.
- Special thanks to the farming community for their input and feedback
