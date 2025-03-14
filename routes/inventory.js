const express = require('express');
const router = express.Router();

// Hàm trợ giúp tính tồn kho hiện tại của một cuốn sách
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

// Thêm mới giao dịch nhập/xuất
router.post('/', async (req, res) => {
  const { book_id, type, quantity } = req.body;
  const pool = req.pool;
  try {
    // Nếu là giao dịch xuất, kiểm tra tồn kho trước
    if (type === 'export') {
      const availableStock = await getAvailableStock(pool, book_id);
      if (availableStock < quantity) {
        return res.status(400).json({ error: 'Insufficient inventory for export' });
      }
    }
    const result = await pool.query(
      'INSERT INTO inventories (book_id, type, quantity) VALUES ($1, $2, $3) RETURNING *',
      [book_id, type, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating inventory record:', error);
    res.status(500).json({ error: 'Error creating inventory record' });
  }
});

// Cập nhật giao dịch nhập/xuất
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { book_id, type, quantity } = req.body;
  const pool = req.pool;
  try {
    // Lấy record cũ
    const oldResult = await pool.query('SELECT * FROM inventories WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    const oldRecord = oldResult.rows[0];
    
    // Xác định effective book_id (nếu cập nhật, nếu không thì dùng giá trị cũ)
    const effectiveBookId = book_id || oldRecord.book_id;
    
    if (type === 'export') {
      let availableStock = await getAvailableStock(pool, effectiveBookId);
      // Nếu record cũ cũng là export và book_id không thay đổi, ta cộng lại số lượng cũ
      if (oldRecord.type === 'export' && oldRecord.book_id == effectiveBookId) {
        availableStock += parseInt(oldRecord.quantity, 10);
      }
      if (availableStock < quantity) {
        return res.status(400).json({ error: 'Insufficient inventory for export update' });
      }
    }
    
    const result = await pool.query(
      'UPDATE inventories SET book_id = $1, type = $2, quantity = $3 WHERE id = $4 RETURNING *',
      [book_id, type, quantity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory record:', error);
    res.status(500).json({ error: 'Error updating inventory record' });
  }
});

// Xóa giao dịch nhập/xuất
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;
  try {
    const result = await pool.query(
      'DELETE FROM inventories WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.json({ message: 'Inventory record deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory record:', error);
    res.status(500).json({ error: 'Error deleting inventory record' });
  }
});

module.exports = router;
