
import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGINS: string[] = [
  'http://localhost:4597',
  'http://localhost:5173'
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // No origin = Postman / mobile / server-to-server → always allow
    if (!origin) return callback(null, true);

    // Dev: allow everything
    if (process.env.NODE_ENV === 'development') return callback(null, true);

    // Prod: whitelist only
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    return callback(
      Object.assign(
        new Error(`CORS policy: Origin '${origin}' is not allowed.`),
        { code: 'CORS_ORIGIN_NOT_ALLOWED' }
      )
    );
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  credentials: true,   // allows cookies / Auth headers
  maxAge: 86400,       // browser caches preflight for 24h
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);

// ─── CORS error: runs when origin is rejected ─────────────────────────────────
export const corsErrorHandler = (
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.code === 'CORS_ORIGIN_NOT_ALLOWED') {
    res.status(403).json({
      success: false,
      message: err.message,
      error: 'CORS_ORIGIN_NOT_ALLOWED',
    });
    return;
  }
  next(err); // not a CORS error → pass to globalErrorHandler
};

// ─── Preflight: handles browser OPTIONS before actual request ─────────────────
export const preflightHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.header('Origin') ?? '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
    return;
  }
  next();
};