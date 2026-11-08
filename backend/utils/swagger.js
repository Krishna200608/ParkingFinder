import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ParkingFinder REST API',
    version: '1.0.0',
    description:
      'High-reliability urban parking marketplace API featuring geospatial spot discovery, atomic concurrency locking for reservations, Stripe test mode & simulation payments, and role-based access control.',
    contact: {
      name: 'ParkingFinder Engineering',
      url: 'https://github.com/Krishna200608/ParkingFinder',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Server',
    },
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
    {
      url: 'https://parkingfinder-three.vercel.app/api',
      description: 'Vercel Production Deployment',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'jwt',
        description: 'Secure HTTP-only session cookie containing signed JWT claim',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token header for programmatic API clients',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed' },
          errors: { type: 'array', items: { type: 'object' } },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6af01928374a8b9c0d1e2f3a' },
          username: { type: 'string', example: 'rahul_driver' },
          email: { type: 'string', example: 'rahul@example.com' },
          role: { type: 'string', enum: ['driver', 'host', 'admin'], example: 'driver' },
          phone: { type: 'string', example: '+1 (555) 234-5678' },
          vehicleInfo: {
            type: 'object',
            properties: {
              make: { type: 'string', example: 'Tesla' },
              model: { type: 'string', example: 'Model 3' },
              licensePlate: { type: 'string', example: '7XYZ123' },
            },
          },
        },
      },
      ParkingSpot: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6af01928374a8b9c0d1e2f3b' },
          title: { type: 'string', example: 'Connaught Place Central Bay' },
          spotType: { type: 'string', enum: ['p2p', 'operator'], example: 'operator' },
          address: { type: 'string', example: 'Connaught Place, New Delhi' },
          pricePerHour: { type: 'number', example: 15.0 },
          location: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'Point' },
              coordinates: { type: 'array', items: { type: 'number' }, example: [77.2195, 28.6328] },
            },
          },
          vehicleSize: { type: 'string', enum: ['any', 'compact', 'sedan', 'suv'], example: 'any' },
          amenities: { type: 'array', items: { type: 'string' }, example: ['covered', 'ev_charging', 'cctv'] },
          isAvailable: { type: 'boolean', example: true },
          rating: { type: 'number', example: 4.8 },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6af01928374a8b9c0d1e2f3c' },
          user: { type: 'string' },
          spot: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          durationHours: { type: 'number', example: 2.5 },
          totalCost: { type: 'number', example: 37.5 },
          status: { type: 'string', enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'] },
          paymentStatus: { type: 'string', enum: ['unpaid_demo', 'pending', 'paid', 'refunded'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health and database readiness check',
        responses: {
          200: {
            description: 'API is running and database connection is established',
          },
        },
      },
    },
    '/spots': {
      get: {
        summary: 'Discover parking spots with multi-criteria geospatial filtering and pagination',
        parameters: [
          { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'Latitude coordinate' },
          { name: 'lng', in: 'query', schema: { type: 'number' }, description: 'Longitude coordinate' },
          { name: 'radius', in: 'query', schema: { type: 'integer' }, description: 'Discovery radius in meters (default: 50,000)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page (max 50)' },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'spotType', in: 'query', schema: { type: 'string', enum: ['all', 'p2p', 'operator'] } },
          { name: 'vehicleSize', in: 'query', schema: { type: 'string' } },
          { name: 'amenities', in: 'query', schema: { type: 'string' }, description: 'Comma-separated amenities (e.g. covered,ev_charging)' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['distance', 'price_asc', 'price_desc', 'rating_desc'] } },
        ],
        responses: {
          200: {
            description: 'Paginated parking spots array with envelope metadata',
          },
        },
      },
    },
    '/spots/{id}': {
      get: {
        summary: 'Fetch detailed parking spot specifications by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Parking spot details with populated host' },
          404: { description: 'Spot not found' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new driver or space host account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['driver', 'host'], default: 'driver' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account registered successfully with secure HTTP-only cookie' },
          400: { description: 'Validation error or email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user credentials and issue secure session cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/profile': {
      get: {
        summary: 'Retrieve authenticated user session profile',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'User profile object' },
          401: { description: 'Not authorized' },
        },
      },
      put: {
        summary: 'Update authenticated user phone and vehicle details',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Profile updated' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Reserve a parking bay with atomic collision write-lock protection',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['spotId', 'startTime', 'endTime'],
                properties: {
                  spotId: { type: 'string' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Reservation confirmed without overlap' },
          409: { description: 'Time window collides with existing reservation' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };

