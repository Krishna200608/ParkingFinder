import app from '../backend/app.js';
import connectDB from '../backend/db.js';

/**
 * Vercel Serverless Function entrypoint.
 * Dispatches all /api/* requests to the Express application after
 * ensuring a cached MongoDB Atlas connection is active.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Serverless database connection error:', error.message);
    return res.status(503).json({
      message: 'Database service is temporarily unavailable. Please retry shortly.',
    });
  }

  return app(req, res);
}

