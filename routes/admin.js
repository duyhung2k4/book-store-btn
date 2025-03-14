const express = require('express');
const router = express.Router();

// Dashboard (trang tổng quan)
router.get('/', (req, res) => {
  res.render('dashboard');
});

// Quản lý Shops
router.get('/shops', async (req, res) => {
  const pool = req.pool;
  try {
    const shopsResult = await pool.query('SELECT * FROM shops ORDER BY id');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
    res.render('shops', { 
      shops: shopsResult.rows,
      users: usersResult.rows // truyền danh sách users để select owner
    });
  } catch (error) {
    res.status(500).send('Error retrieving shops');
  }
});

// Quản lý Users
router.get('/users', async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.render('users', { users: result.rows });
  } catch (error) {
    res.status(500).send('Error retrieving users');
  }
});

// Quản lý Nhân viên
router.get('/employees', async (req, res) => {
  const pool = req.pool;
  try {
    const employeesResult = await pool.query('SELECT * FROM employees ORDER BY id');
    const shopsResult = await pool.query('SELECT * FROM shops ORDER BY id');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
    res.render('employees', { 
      employees: employeesResult.rows, 
      shops: shopsResult.rows, 
      users: usersResult.rows 
    });
  } catch (error) {
    res.status(500).send('Error retrieving employees');
  }
});

// Quản lý Sách
router.get('/books', async (req, res) => {
  const pool = req.pool;
  try {
    const booksResult = await pool.query(`
      SELECT b.*, 
             (COALESCE(i.stock, 0) - COALESCE(o.order_total, 0)) AS stock
      FROM books b
      LEFT JOIN (
        SELECT book_id, 
               SUM(CASE WHEN type = 'import' THEN quantity ELSE 0 END) -
               SUM(CASE WHEN type = 'export' THEN quantity ELSE 0 END) AS stock
        FROM inventories
        GROUP BY book_id
      ) i ON b.id = i.book_id
      LEFT JOIN (
        SELECT book_id, SUM(quantity) AS order_total
        FROM orders
        GROUP BY book_id
      ) o ON b.id = o.book_id
      ORDER BY b.id
    `);
    const shopsResult = await pool.query('SELECT * FROM shops ORDER BY id');
    const categoriesResult = await pool.query('SELECT * FROM categories ORDER BY id');
    res.render('books', { 
      books: booksResult.rows, 
      shops: shopsResult.rows,
      categories: categoriesResult.rows 
    });
  } catch (error) {
    console.error('Error retrieving books:', error);
    res.status(500).send('Error retrieving books');
  }
});




// Quản lý Nhập/Xuất hàng (Inventory)
router.get('/inventory', async (req, res) => {
  const pool = req.pool;
  try {
    const inventoryResult = await pool.query('SELECT * FROM inventories ORDER BY id');
    const booksResult = await pool.query('SELECT * FROM books ORDER BY id');
    res.render('inventory', { 
      inventory: inventoryResult.rows,
      books: booksResult.rows
    });
  } catch (error) {
    res.status(500).send('Error retrieving inventory');
  }
});

// Quản lý Order
router.get('/orders', async (req, res) => {
  const pool = req.pool;
  try {
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY id');
    const booksResult = await pool.query('SELECT * FROM books ORDER BY id');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
    const employeesResult = await pool.query(`
      SELECT e.*, u.name AS employee_name, e.shop_id
      FROM employees e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.id
    `);
    
    res.render('orders', {
      orders: ordersResult.rows,
      books: booksResult.rows,
      users: usersResult.rows,
      employees: employeesResult.rows
    });
  } catch (error) {
    res.status(500).send('Error retrieving orders');
  }
});



module.exports = router;
