const express = require('express');
const router = express.Router();

// Thêm mới nhân viên
router.post('/', async (req, res) => {
  const { shop_id, user_id } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'INSERT INTO employees (shop_id, user_id) VALUES ($1, $2) RETURNING *',
      [shop_id, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Error creating employee' });
  }
});

// Cập nhật nhân viên
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { shop_id, user_id } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'UPDATE employees SET shop_id = $1, user_id = $2 WHERE id = $3 RETURNING *',
      [shop_id, user_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Error updating employee' });
  }
});

// Xóa nhân viên
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Error deleting employee' });
  }
});

module.exports = router;
