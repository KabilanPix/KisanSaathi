import db from '../db/index.js';
import crypto from 'crypto';
import { getCostTrackerAdvice } from '../services/geminiService.js';

export const addCostEntry = async (req, res, next) => {
  try {
    let { session_id, category, item_name, quantity, unit, cost_per_unit, total_cost, crop_season } = req.body;
    
    if (!session_id) session_id = crypto.randomUUID();
    if (!category || total_cost === undefined) {
      return res.status(400).json({ error: 'Category and total_cost are required' });
    }
    if (parseFloat(quantity) < 0 || parseFloat(cost_per_unit) < 0 || parseFloat(total_cost) < 0) {
      return res.status(400).json({ error: 'Values cannot be negative' });
    }

    const result = await db.query(
      `INSERT INTO cost_entries (session_id, category, item_name, quantity, unit, cost_per_unit, total_cost, crop_season)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [session_id, category, item_name, quantity, unit, cost_per_unit, total_cost, crop_season]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getCostEntries = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await db.query(
      `SELECT * FROM cost_entries WHERE session_id = $1 ORDER BY entry_date DESC`,
      [session_id]
    );
    res.json({ entries: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getCostSummary = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await db.query(
      `SELECT category, SUM(total_cost) as total
       FROM cost_entries WHERE session_id = $1
       GROUP BY category`,
      [session_id]
    );
    
    const summary = result.rows.map(row => ({
        category: row.category,
        total: parseFloat(row.total)
    }));

    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

export const deleteCostEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM cost_entries WHERE id = $1`, [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCostAdvice = async (req, res, next) => {
  try {
    const { session_id, language } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await db.query(
      `SELECT category, SUM(total_cost) as total
       FROM cost_entries WHERE session_id = $1
       GROUP BY category`,
      [session_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ advice: "No expenses logged yet. Add some expenses to get AI cost-saving advice." });
    }

    const summary = result.rows.map(row => ({
        category: row.category,
        total: parseFloat(row.total)
    }));

    const advice = await getCostTrackerAdvice(summary, language || 'hi');
    res.json({ advice });
  } catch (error) {
    next(error);
  }
};
