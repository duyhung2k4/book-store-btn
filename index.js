const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');    // nếu bạn vẫn muốn dùng API REST
const adminRoutes = require('./routes/admin'); // router cho giao diện quản lý
const shopRoutes = require('./routes/shop');
const userRoutes = require('./routes/user');
const employeeRoutes = require('./routes/employee');
const bookRoutes = require('./routes/book');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/order');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3000;

const hbs = require('hbs');
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Thiết lập view engine sử dụng hbs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Cho phép sử dụng pool trong req
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// API routes (nếu cần)
app.use('/api', apiRoutes);

// Admin routes cho giao diện quản lý
app.use('/admin', adminRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
