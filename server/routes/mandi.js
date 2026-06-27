import express from 'express';
import { getPrices, getStates, getDistricts, getCommodities } from '../controllers/mandiController.js';

const router = express.Router();

router.get('/prices', getPrices);
router.get('/states', getStates);
router.get('/districts', getDistricts);
router.get('/commodities', getCommodities);

export default router;
