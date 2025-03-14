const express = require('express');
const router = express.Router();

/*
 * API Sách
 */

// Thêm sách
router.post('/books', async (req, res) => {
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Sửa thông tin sách
router.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { name, thumbnail, author, price, shop_id, category_id } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      `UPDATE books 
       SET name=$1, thumbnail=$2, author=$3, price=$4, shop_id=$5, category_id=$6 
       WHERE id=$7 RETURNING *`,
      [name, thumbnail, author, price, shop_id, category_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Xóa sách
router.delete('/books/:id', async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;
  try {
    const result = await pool.query('DELETE FROM books WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/*
 * API Hàng tồn kho
 */

// Nhập hàng tồn kho (import)
router.post('/inventory/import', async (req, res) => {
  const { book_id, quantity } = req.body;
  const pool = req.pool;
  try {
    const result = await pool.query(
      `INSERT INTO inventories (book_id, type, quantity)
       VALUES ($1, 'import', $2) RETURNING *`,
      [book_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error importing inventory:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Xuất hàng tồn kho (export) với kiểm tra số lượng tồn kho
router.post('/inventory/export', async (req, res) => {
  const { book_id, quantity } = req.body;
  const pool = req.pool;
  try {
    // Tính số lượng hàng tồn kho hiện có (nhập trừ xuất)
    const stockResult = await pool.query(
      `SELECT COALESCE(
          SUM(CASE WHEN type = 'import' THEN quantity ELSE 0 END) -
          SUM(CASE WHEN type = 'export' THEN quantity ELSE 0 END),
          0
       ) AS stock
       FROM inventories
       WHERE book_id = $1`,
       [book_id]
    );
    const stock = parseInt(stockResult.rows[0].stock, 10);
    if (stock < quantity) {
      return res.status(400).json({ error: 'Không đủ hàng tồn kho để xuất' });
    }
    // Ghi nhận giao dịch xuất nếu số lượng tồn kho đủ
    const result = await pool.query(
      `INSERT INTO inventories (book_id, type, quantity)
       VALUES ($1, 'export', $2) RETURNING *`,
      [book_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/*
 * API Order sách với kiểm tra số lượng tồn kho
 */

router.post('/orders', async (req, res) => {
  const { book_id, user_id, employee_id, quantity, total_price } = req.body;
  const pool = req.pool;
  try {
    // Kiểm tra số lượng hàng tồn kho hiện có của sách
    const stockResult = await pool.query(
      `SELECT COALESCE(
          SUM(CASE WHEN type = 'import' THEN quantity ELSE 0 END) -
          SUM(CASE WHEN type = 'export' THEN quantity ELSE 0 END),
          0
       ) AS stock
       FROM inventories
       WHERE book_id = $1`,
       [book_id]
    );
    const stock = parseInt(stockResult.rows[0].stock, 10);
    if (stock < quantity) {
      return res.status(400).json({ error: 'Không đủ hàng tồn kho để tạo order' });
    }
    // Tạo order
    const orderResult = await pool.query(
      `INSERT INTO orders (book_id, user_id, employee_id, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [book_id, user_id, employee_id, quantity, total_price]
    );
    // Ghi nhận giao dịch xuất kho cho order
    await pool.query(
      `INSERT INTO inventories (book_id, type, quantity)
       VALUES ($1, 'export', $2)`,
      [book_id, quantity]
    );
    res.status(201).json(orderResult.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
