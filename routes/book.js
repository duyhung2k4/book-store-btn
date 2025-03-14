const express = require('express');
const router = express.Router();

// Thêm mới sách
router.post('/', async (req, res) => {
  const { name, thumbnail, author, price, shop_id, category_id } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      `INSERT INTO books (name, thumbnail, author, price, shop_id, category_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, thumbnail, author, price, shop_id, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Error creating book' });
  }
});

// Cập nhật sách
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, thumbnail, author, price, shop_id, category_id } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      `UPDATE books SET name = $1, thumbnail = $2, author = $3, price = $4, shop_id = $5, category_id = $6
       WHERE id = $7 RETURNING *`,
      [name, thumbnail, author, price, shop_id, category_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Error updating book' });
  }
});

// Xóa sách
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Error deleting book' });
  }
});

module.exports = router;
