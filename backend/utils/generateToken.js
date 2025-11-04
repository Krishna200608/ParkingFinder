import jwt from 'jsonwebtoken';

// This function generates a signed JWT
// We put the userId in the token's payload
const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId }, // Payload
    process.env.JWT_SECRET, // Secret key from .env
    { expiresIn: '30d' } // Token expires in 30 days
  );

  // We are sending the token as an http-only cookie
  // This is MORE SECURE than storing it in localStorage on the frontend
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  });

  return token; // We also return it in case the client wants to use it directly
};

export default generateToken;
