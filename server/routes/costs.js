import express from 'express';
import { addCostEntry, getCostEntries, getCostSummary, deleteCostEntry, getCostAdvice } from '../controllers/costsController.js';

const router = express.Router();

router.post('/entry', addCostEntry);
router.get('/entries', getCostEntries);
router.get('/summary', getCostSummary);
router.get('/ai-advice', getCostAdvice);
router.delete('/entry/:id', deleteCostEntry);

export default router;
