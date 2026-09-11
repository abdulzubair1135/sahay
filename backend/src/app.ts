import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import sosRoutes from './routes/sos.js';
import syncRoutes from './routes/sync.js';
import alertRoutes from './routes/alerts.js';
import hospitalRoutes from './routes/hospitals.js';
import shelterRoutes from './routes/shelters.js';
import rescueTeamRoutes from './routes/rescueTeams.js';
import reportRoutes from './routes/reports.js';
import volunteerRoutes from './routes/volunteers.js';
import ngoRoutes from './routes/ngos.js';
import resourceRoutes from './routes/resources.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'AapdaSetu Real-Time Emergency Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api', syncRoutes); // provides /api/sync & /api/relay
app.use('/api/alerts', alertRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/rescue-teams', rescueTeamRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error] Unhandled exception:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.'
    }
  });
});

export default app;
