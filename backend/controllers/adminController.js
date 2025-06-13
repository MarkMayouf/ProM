import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // Total Sales and Total Orders
  const orders = await Order.find({});
  const totalSales = orders.reduce((acc, order) => acc + (order.isPaid ? order.totalPrice : 0), 0);
  const totalOrders = orders.length;

  // New Customers (e.g., registered in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  // Average Order Value
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Recent Orders (last 5, sorted by creation date)
  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name");

  // Top Selling Products (by quantity sold in orderItems)
  // This is a more complex aggregation. For simplicity, we might need a more optimized query or a separate collection for sales data.
  // Basic approach: iterate through all orders and sum quantities for each product.
  const productSales = {};
  orders.forEach(order => {
    if(order.isPaid){
        order.orderItems.forEach(item => {
            const productId = item.product.toString();
            productSales[productId] = (productSales[productId] || 0) + item.qty;
        });
    }
  });
  
  const productIds = Object.keys(productSales);
  const productsDetails = await Product.find({ _id: { $in: productIds } }).select("name");
  
  const topProducts = productsDetails.map(p => ({
      _id: p._id,
      name: p.name,
      sales: productSales[p._id.toString()] || 0
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);


  // Low Stock Products (e.g., stock less than 10)
  const lowStockProducts = await Product.find({ countInStock: { $lte: 10 } })
    .sort({ countInStock: 1 })
    .limit(5)
    .select("name countInStock");

  res.json({
    totalSales,
    totalOrders,
    newCustomers,
    averageOrderValue,
    recentOrders,
    topProducts,
    lowStockProducts,
  });
});

export { getDashboardStats };

