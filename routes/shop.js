const express = require('express');
const router = express.Router();

// Lấy danh sách tất cả các shop
router.get('/', async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query('SELECT * FROM shops ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error retrieving shops:', error);
    res.status(500).json({ error: 'Error retrieving shops' });
  }
});

// Tạo mới 1 shop
router.post('/', async (req, res) => {
  const { name, owner_id } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'INSERT INTO shops (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, owner_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ error: 'Error creating shop' });
  }
});

// Cập nhật thông tin 1 shop
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, owner_id } = req.body;
  console.log(req.body);
  const pool = req.pool;
  try {
    const result = await pool.query(
      'UPDATE shops SET name = $1, owner_id = $2 WHERE id = $3 RETURNING *',
      [name, owner_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ error: 'Error updating shop' });
  }
});

// Xóa 1 shop
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'DELETE FROM shops WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ error: 'Error deleting shop' });
  }
});

module.exports = router;
