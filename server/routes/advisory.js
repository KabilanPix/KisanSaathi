import express from 'express';
import { askAdvisory } from '../controllers/advisoryController.js';

const router = express.Router();

router.post('/ask', askAdvisory);

export default router;
