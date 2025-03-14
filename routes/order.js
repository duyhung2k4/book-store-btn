const express = require('express');
const router = express.Router();

// Hàm tính tồn kho hiện tại của một cuốn sách
async function getAvailableStock(pool, book_id) {
  const stockResult = await pool.query(
    `SELECT COALESCE(
      SUM(CASE WHEN type = 'import' THEN quantity ELSE 0 END) -
      SUM(CASE WHEN type = 'export' THEN quantity ELSE 0 END), 0
    ) AS stock
    FROM inventories
    WHERE book_id = $1`,
    [book_id]
  );
  return parseInt(stockResult.rows[0].stock, 10);
}

// Thêm mới Order
router.post('/', async (req, res) => {
  const { book_id, user_id, employee_id, quantity, total_price } = req.body;
  const pool = req.pool;
  try {
    // Kiểm tra tồn kho của sách
    const availableStock = await getAvailableStock(pool, book_id);
    if (availableStock < quantity) {
      return res.status(400).json({ error: 'Insufficient inventory for this order' });
    }
    const result = await pool.query(
      `INSERT INTO orders (book_id, user_id, employee_id, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [book_id, user_id, employee_id, quantity, total_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
});

// Cập nhật Order
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { book_id, user_id, employee_id, quantity, total_price } = req.body;
  const pool = req.pool;
  try {
    // Lấy order cũ để biết số lượng ban đầu
    const orderQuery = await pool.query('SELECT quantity, book_id FROM orders WHERE id = $1', [id]);
    if (orderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const oldOrder = orderQuery.rows[0];
    
    // Nếu cập nhật sách (book_id) thì cần kiểm tra tồn kho riêng cho sách mới
    // Nếu không, ta dùng book_id cũ
    const effectiveBookId = book_id || oldOrder.book_id;
    
    // Tính số lượng bổ sung cần đặt (chỉ khi số lượng mới > số lượng cũ)
    let additionalNeeded = 0;
    if (quantity > oldOrder.quantity) {
      additionalNeeded = quantity - oldOrder.quantity;
    }
    
    // Kiểm tra tồn kho cho sách đã chọn
    const availableStock = await getAvailableStock(pool, effectiveBookId);
    if (additionalNeeded > availableStock) {
      return res.status(400).json({ error: 'Insufficient inventory for this order update' });
    }
    
    const result = await pool.query(
      `UPDATE orders 
       SET book_id = $1, user_id = $2, employee_id = $3, quantity = $4, total_price = $5
       WHERE id = $6 RETURNING *`,
      [book_id, user_id, employee_id, quantity, total_price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Error updating order' });
  }
});

// Xóa Order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Error deleting order' });
  }
});

module.exports = router;
