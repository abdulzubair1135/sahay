import { Router, Request, Response } from 'express';
import { CitizenReport } from '../models/CitizenReport.js';
import { broadcastEvent } from '../sockets/socket.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const filter: any = {};
    if (status) filter.verificationStatus = status;
    if (type) filter.type = type;

    const reports = await CitizenReport.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, description, latitude, longitude, mediaUrl } = req.body;
    if (!type || !description || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Type, description and location are required.' } });
      return;
    }

    const report = await CitizenReport.create({
      userId: req.user?._id,
      userName: req.user?.name,
      userPhone: req.user?.phone,
      type,
      description,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      mediaUrl,
      verificationStatus: 'SUBMITTED'
    });

    broadcastEvent('report:new', report, 'gov');
    res.status(201).json({ success: true, message: 'Citizen hazard report submitted.', data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
});

router.patch('/:id/verify', requireAuth, requireRole(['GOVERNMENT', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED, REJECTED, ACTION_TAKEN

    const report = await CitizenReport.findById(id);
    if (!report) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      return;
    }

    report.verificationStatus = status || 'VERIFIED';
    report.verifiedBy = req.user?._id;
    report.verifiedAt = new Date();
    await report.save();

    broadcastEvent('report:verified', report);
    res.json({ success: true, message: `Report marked as ${report.verificationStatus}.`, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
});

export default router;
