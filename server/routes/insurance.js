import express from 'express';
import { adviseInsurance } from '../controllers/insuranceController.js';

const router = express.Router();

router.post('/advise', adviseInsurance);

export default router;
