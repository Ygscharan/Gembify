import { Router } from 'express';
import {
  analyzeReport,
  listReports,
  getReportById,
  chatAboutReport,
  deleteReport,
} from '../controllers/reportController.js';

const router = Router();

router.post('/analyze', analyzeReport);
router.get('/', listReports);
router.get('/:id', getReportById);
router.post('/:id/chat', chatAboutReport);
router.delete('/:id', deleteReport);

export default router;
