import { getMandiPrices, getAvailableOptions } from '../services/mandiService.js';
import db from '../db/index.js';

export const getPrices = async (req, res, next) => {
  try {
    const { state, district, market, commodity } = req.query;
    if (!state || !district || !commodity) {
      return res.status(400).json({ error: 'Missing required parameters (state, district, commodity)' });
    }

    const data = await getMandiPrices(state, district, commodity);
    
    // Log search to DB
    try {
      if (data.records && data.records.length > 0) {
          const record = data.records[0];
          await db.query(
            `INSERT INTO mandi_searches (state, district, market, commodity, modal_price, min_price, max_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [state, district, record.market, commodity, record.modal_price || 0, record.min_price || 0, record.max_price || 0]
          );
      }
    } catch (dbError) {
      console.error('Failed to log mandi search:', dbError);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getStates = async (req, res, next) => {
    try {
        const options = await getAvailableOptions();
        res.json({ states: options.states });
    } catch (error) {
        next(error);
    }
};

export const getDistricts = async (req, res, next) => {
    try {
        const options = await getAvailableOptions();
        const { state } = req.query;
        if (state && options.stateDistrictMap[state]) {
            res.json({ districts: options.stateDistrictMap[state] });
        } else {
            const allDistricts = [...new Set(Object.values(options.stateDistrictMap).flat())].sort();
            res.json({ districts: allDistricts });
        }
    } catch (error) {
        next(error);
    }
};

export const getCommodities = async (req, res, next) => {
    try {
        const options = await getAvailableOptions();
        res.json({ commodities: options.commodities });
    } catch (error) {
        next(error);
    }
};
