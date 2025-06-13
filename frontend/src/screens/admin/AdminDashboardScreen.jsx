import React, { useEffect, useState, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  ListGroup,
  Table,
  Button,
  Dropdown,
  Alert,
  Badge,
  Container,
  Nav,
  Form,
  ProgressBar,
  Modal,
  InputGroup,
  Image
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaDollarSign,
  FaExclamationTriangle,
  FaPrint,
  FaDownload,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaRegCalendarAlt,
  FaSyncAlt,
  FaArrowUp,
  FaArrowDown,
  FaBoxOpen,
  FaUserPlus,
  FaShoppingBag,
  FaChartArea,
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaClock,
  FaPercentage,
  FaUserCheck,
  FaEdit,
  FaUndo,
  FaClipboardList,
  FaCheckCircle,
  FaTachometerAlt
} from 'react-icons/fa';
import { useGetDashboardStatsQuery } from '../../slices/adminApiSlice';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';
import { useGetProductsQuery } from '../../slices/productsApiSlice';
import { useGetUsersQuery } from '../../slices/usersApiSlice';
import { useGetReturnStatsQuery } from '../../slices/returnApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import AdminSidebar from '../../components/AdminSidebar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useReactToPrint } from 'react-to-print';
import {
  format,
  subDays,
  isWithinInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  getMonth,
  getYear,
  addMonths,
  startOfDay,
  endOfDay,
} from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useScrollToTop } from '../../hooks/useScrollToTop';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Update statsCard styles
const dashboardStyles = {
  container: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: '20px 0',
  },
  dashHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '15px',
    overflow: 'hidden',
    position: 'relative',
  },
  dashHeaderPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    opacity: 0.3,
  },
  card: {
    borderRadius: '15px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    background: 'white',
  },
  statCard: {
    borderRadius: '15px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    background: 'white',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    }
  },
  dashBtn: {
    borderRadius: '25px',
    padding: '8px 20px',
    fontWeight: '500',
    border: 'none',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
      transform: 'translateY(-2px)',
    }
  },
  sectionTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  badge: {
    borderRadius: '20px',
    padding: '5px 12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  chartWrapper: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  },
  metricCard: {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: '15px',
    padding: '25px',
    textAlign: 'center',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    }
  },
  actionCard: {
    borderRadius: '15px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    background: 'white',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    }
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    minHeight: '140px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  statsIcon: {
    borderRadius: '12px',
    padding: '15px',
    fontSize: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    zIndex: 2,
  },
  iconBackground: {
    position: 'absolute',
    right: '-20px',
    bottom: '-20px',
    fontSize: '7rem',
    opacity: '0.07',
    zIndex: 1,
  },
  changeIndicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontWeight: '500',
  },
  navTabs: {
    borderBottom: 'none',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  navTab: {
    borderRadius: '8px',
    padding: '0.7rem 1.5rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    fontSize: '1rem',
  },
  pulseAnimation: {
    animation: 'pulse 2s infinite',
  },
};

// Add pulse keyframes styles to head
const addPulseAnimation = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .pulse {
      animation: pulse 2s infinite;
    }
    
    .animate-pulse {
      animation: pulse 2s infinite;
    }
  `;
  if (!document.head.querySelector('style[data-pulse-animation]')) {
    style.setAttribute('data-pulse-animation', 'true');
    document.head.appendChild(style);
  }
};

const AdminDashboardScreen = () => {
  const componentRef = useRef();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const salesChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const [dataPeriod, setDataPeriod] = useState('monthly');
  const [comparisonMetrics, setComparisonMetrics] = useState({
    sales: { current: 0, previous: 0, percentChange: 0 },
    orders: { current: 0, previous: 0, percentChange: 0 },
    customers: { current: 0, previous: 0, percentChange: 0 },
    avgOrderValue: { current: 0, previous: 0, percentChange: 0 },
  });
  const [hoveredCard, setHoveredCard] = useState(null);

  const {
    data: dashboardStats,
    isLoading: loadingDashboard,
    error: errorDashboard,
    refetch: refetchDashboard,
  } = useGetDashboardStatsQuery();

  const {
    data: orders,
    isLoading: loadingOrders,
    error: errorOrders,
    refetch: refetchOrders,
  } = useGetOrdersQuery();

  const {
    data: products,
    isLoading: loadingProducts,
    error: errorProducts,
  } = useGetProductsQuery({ pageNumber: 1, limit: 1000 });

  const {
    data: users,
    isLoading: loadingUsers,
    error: errorUsers,
  } = useGetUsersQuery();

  const {
    data: returnStats,
    isLoading: loadingReturnStats,
    error: errorReturnStats,
  } = useGetReturnStatsQuery();

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    recentOrders: [],
    salesData: [],
    topProducts: [],
    lowStockProducts: [],
    categoryDistribution: {},
    revenueByCategory: {},
    orderStatusDistribution: {},
    averageOrderValue: 0,
    customerRetentionRate: 0,
    criticalStockProducts: [],
    pendingOrders: [],
    todayRevenue: 0,
    salesTrend: [],
    customerGrowth: [],
    productPerformance: [],
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [analyticsView, setAnalyticsView] = useState('basic'); // 'basic' or 'advanced'
  const [lastPendingCount, setLastPendingCount] = useState(0);

  // Enhanced stats state
  const [enhancedStats, setEnhancedStats] = useState({
    customerLifetimeValue: 0,
    averageOrderFrequency: 0,
    cartAbandonmentRate: 0,
    customerSatisfactionScore: 0,
    topSellingCategories: [],
    geographicalDistribution: {},
    peakOrderTimes: [],
    promotionEffectiveness: [],
    customerSegments: [],
    inventoryTurnoverRate: 0
  });

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Admin Dashboard Report - ${format(new Date(), 'yyyy-MM-dd')}`,
    onBeforePrint: () => toast.info('Preparing dashboard report for printing...'),
    onAfterPrint: () => toast.success('Dashboard report printed successfully'),
  });

  const handleButtonClick = async (action, data = null) => {
    try {
      switch (action) {
        case 'refresh':
          await refetchOrders();
          await refetchDashboard();
          toast.success('Dashboard refreshed successfully');
          break;
          
        case 'export-sales':
          await exportSalesData();
          break;
          
        case 'export-products':
          await exportTopProducts();
          break;
          
        case 'export-all':
          await exportAllData();
          break;
          
        case 'view-orders':
          navigate('/admin/orderlist');
          break;
          
        case 'view-products':
          navigate('/admin/productlist');
          break;
          
        case 'view-users':
          navigate('/admin/userlist');
          break;
          
        case 'view-returns':
          navigate('/admin/returns');
          break;
          
        case 'print-report':
          handlePrint();
          break;
          
        case 'toggle-analytics':
          setAnalyticsView(analyticsView === 'basic' ? 'advanced' : 'basic');
          toast.info(`Switched to ${analyticsView === 'basic' ? 'advanced' : 'basic'} analytics view`);
          break;
          
        default:
          toast.info(`Action: ${action}`);
      }
    } catch (error) {
      toast.error(`Failed to execute ${action}: ${error.message}`);
    }
  };

  const exportToExcel = async (data, fileName) => {
    try {
      setIsExporting(true);
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`${fileName} exported successfully`);
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSalesData = async () => {
    const salesData = orders.map(order => ({
      'Order ID': order._id,
      'Date': format(new Date(order.createdAt), 'yyyy-MM-dd'),
      'Customer': order.user?.name || 'N/A',
      'Email': order.user?.email || 'N/A',
      'Total Amount': order.totalPrice,
      'Payment Method': order.paymentMethod,
      'Status': order.orderStatus || 'Processing',
      'Items Count': order.orderItems?.length || 0,
    }));
    await exportToExcel(salesData, 'Sales_Report');
  };

  const exportTopProducts = async () => {
    const productData = products.map(product => ({
      'Product ID': product._id,
      'Name': product.name,
      'Category': product.category,
      'Price': product.price,
      'Stock': product.countInStock,
      'Rating': product.rating,
      'Reviews': product.numReviews,
    }));
    await exportToExcel(productData, 'Products_Report');
  };

  const exportAllData = async () => {
    try {
      setIsExporting(true);
      
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Sales data
      const salesData = orders.map(order => ({
        'Order ID': order._id,
        'Date': format(new Date(order.createdAt), 'yyyy-MM-dd'),
        'Customer': order.user?.name || 'N/A',
        'Total': order.totalPrice,
        'Status': order.orderStatus || 'Processing',
      }));
      const salesWs = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, salesWs, 'Sales');
      
      // Products data
      const productData = products.map(product => ({
        'Product ID': product._id,
        'Name': product.name,
        'Category': product.category,
        'Price': product.price,
        'Stock': product.countInStock,
      }));
      const productsWs = XLSX.utils.json_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, productsWs, 'Products');
      
      // Summary data
      const stats = calculateStats();
      const summaryData = [
        { Metric: 'Total Revenue', Value: stats.totalRevenue },
        { Metric: 'Total Orders', Value: stats.totalOrders },
        { Metric: 'Total Products', Value: stats.totalProducts },
        { Metric: 'Total Users', Value: stats.totalUsers },
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      XLSX.writeFile(wb, `Complete_Dashboard_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Complete dashboard report exported successfully');
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Add pulse animation styles on component mount
  useEffect(() => {
    addPulseAnimation();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Monitor pending returns for notifications
  useEffect(() => {
    if (returnStats?.pendingReturns !== undefined) {
      const currentPendingCount = returnStats.pendingReturns;
      
      // Only show notification if there's an increase in pending returns
      if (lastPendingCount > 0 && currentPendingCount > lastPendingCount) {
        const newReturns = currentPendingCount - lastPendingCount;
        
        // Show toast notification
        toast.warning(
          `🚨 ${newReturns} new return request${newReturns > 1 ? 's' : ''} received! Click to review.`,
          {
            position: 'top-right',
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: () => {
              window.location.href = '/admin/returns?status=pending';
            },
            style: {
              cursor: 'pointer'
            }
          }
        );

        // Show browser notification if page is not visible
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
          const notification = new Notification('ProMayouf Admin - New Return Request', {
            body: `${newReturns} new return request${newReturns > 1 ? 's' : ''} need${newReturns === 1 ? 's' : ''} your attention`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'return-notification',
            requireInteraction: true
          });

          notification.onclick = () => {
            window.focus();
            window.location.href = '/admin/returns?status=pending';
            notification.close();
          };

          // Auto close after 10 seconds
          setTimeout(() => notification.close(), 10000);
        }
      }
      
      setLastPendingCount(currentPendingCount);
    }
  }, [returnStats?.pendingReturns, lastPendingCount]);

  // Auto-refresh return stats every 30 seconds to check for new returns
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refetch if the user is on the dashboard and the page is visible
      if (document.visibilityState === 'visible') {
        refetchDashboard();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refetchDashboard]);

  useEffect(() => {
    if (dashboardStats) {
      setStats({
        ...stats,
        totalSales: dashboardStats.totalSales,
        totalOrders: dashboardStats.totalOrders,
        totalProducts: products?.length || 0,
        totalUsers: users?.length || 0,
        recentOrders: dashboardStats.recentOrders,
        topProducts: dashboardStats.topProducts,
        lowStockProducts: dashboardStats.lowStockProducts,
        averageOrderValue: dashboardStats.averageOrderValue,
      });
    }
  }, [dashboardStats, products, users]);

  useEffect(() => {
    if (orders && products && users && dashboardStats) {
      calculateStats();
      calculateEnhancedMetrics(orders, users, products);
      
      // Calculate comparison metrics
      const currentDate = new Date();
      const previousPeriodEnd = subDays(currentDate, 30);
      const previousPeriodStart = subDays(previousPeriodEnd, 30);

      const currentPeriodOrders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return false;
        
        return isWithinInterval(orderDate, { 
          start: previousPeriodEnd, 
          end: currentDate 
        });
      });

      const previousPeriodOrders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return false;
        
        return isWithinInterval(orderDate, { 
          start: previousPeriodStart, 
          end: previousPeriodEnd 
        });
      });
      
      // Calculate customer metrics
      const currentCustomers = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        if (isNaN(userDate.getTime())) return false;
        
        return isWithinInterval(userDate, {
          start: previousPeriodEnd,
          end: currentDate
        });
      }).length;

      const previousCustomers = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        if (isNaN(userDate.getTime())) return false;
        
        return isWithinInterval(userDate, {
          start: previousPeriodStart,
          end: previousPeriodEnd
        });
      }).length;

      const customersPercentChange = previousCustomers === 0 ? 100 : 
        ((currentCustomers - previousCustomers) / previousCustomers) * 100;
      
      // Calculate sales metrics
      const currentSales = dashboardStats.totalSales;
      const previousSales = previousPeriodOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const salesPercentChange = previousSales === 0 ? 100 : ((currentSales - previousSales) / previousSales) * 100;

      // Calculate order metrics
      const currentOrderCount = dashboardStats.totalOrders;
      const previousOrderCount = previousPeriodOrders.length;
      const ordersPercentChange = previousOrderCount === 0 ? 100 : ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100;

      // Calculate average order value metrics
      const currentAvgOrder = currentSales / currentOrderCount || 0;
      const previousAvgOrder = previousSales / previousOrderCount || 0;
      const avgOrderPercentChange = previousAvgOrder === 0 ? 100 : 
        ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100;

      setComparisonMetrics({
        sales: {
          current: currentSales,
          previous: previousSales,
          percentChange: salesPercentChange
        },
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          percentChange: ordersPercentChange
        },
        customers: {
          current: currentCustomers,
          previous: previousCustomers,
          percentChange: customersPercentChange
        },
        avgOrderValue: {
          current: currentAvgOrder,
          previous: previousAvgOrder,
          percentChange: avgOrderPercentChange
        }
      });
    }
  }, [orders, products, users, dashboardStats, dateRange]);

  const calculateStats = () => {
    // Add null checks for all required data
    if (!orders || !users || !products) {
      return;
    }

    const filteredOrders = orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return false;
      
      return isWithinInterval(orderDate, {
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    });

    // Calculate total sales
    const totalSales = filteredOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    // Calculate today's revenue
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todayOrders = orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return false;
      
      return isWithinInterval(orderDate, {
        start: todayStart,
        end: todayEnd,
      });
    });
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    // Calculate sales trend
    const salesTrend = calculateSalesTrend(filteredOrders);

    // Calculate customer growth
    const customerGrowth = calculateCustomerGrowth(users);

    // Calculate product performance
    const productPerformance = calculateProductPerformance(filteredOrders);

    setStats(prevStats => ({
      ...prevStats,
      totalSales,
      totalOrders: filteredOrders.length,
      totalProducts: products.length,
      totalUsers: users.length,
      todayRevenue,
      salesTrend,
      customerGrowth,
      productPerformance,
    }));
  };

  const calculateSalesTrend = (orders) => {
    // Group orders by date and calculate daily sales
    const dailySales = {};
    orders.forEach(order => {
      // Check if createdAt exists and is valid
      if (!order.createdAt) return;
      
      const dateObj = new Date(order.createdAt);
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) return;
      
      const date = format(dateObj, 'yyyy-MM-dd');
      dailySales[date] = (dailySales[date] || 0) + (order.totalPrice || 0);
    });

    return Object.entries(dailySales).map(([date, amount]) => ({
      date,
      amount,
    }));
  };

  const calculateCustomerGrowth = (users) => {
    // Group users by registration date
    const usersByDate = {};
    users.forEach(user => {
      // Check if createdAt exists and is valid
      if (!user.createdAt) return;
      
      const dateObj = new Date(user.createdAt);
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) return;
      
      const date = format(dateObj, 'yyyy-MM-dd');
      usersByDate[date] = (usersByDate[date] || 0) + 1;
    });

    return Object.entries(usersByDate).map(([date, count]) => ({
      date,
      count,
    }));
  };

  const calculateProductPerformance = (orders) => {
    // Calculate product sales and revenue
    const productStats = {};
    
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    
    orders.forEach(order => {
      if (!order.orderItems || !Array.isArray(order.orderItems)) {
        return;
      }
      
      order.orderItems.forEach(item => {
        if (!item.name) return;
        
        if (!productStats[item.name]) {
          productStats[item.name] = {
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.name].quantity += item.qty || 0;
        productStats[item.name].revenue += (item.price || 0) * (item.qty || 0);
      });
    });

    return Object.entries(productStats).map(([name, stats]) => ({
      name,
      ...stats,
    }));
  };

  const calculateEnhancedMetrics = (orders = [], users = [], products = []) => {
    // Only proceed if we have all required data
    if (!orders.length || !products?.length) {
      return {
        customerLifetimeValue: 0,
        averageOrderFrequency: 0,
        cartAbandonmentRate: 0,
        customerSatisfactionScore: 0,
        topSellingCategories: [],
        geographicalDistribution: {},
        peakOrderTimes: {},
        promotionEffectiveness: [],
        customerSegments: [],
        inventoryTurnoverRate: 0
      };
    }

    // Calculate Customer Lifetime Value (CLV)
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const customerLifetimeValue = users.length > 0 ? totalRevenue / users.length : 0;

    // Calculate Average Order Frequency
    const ordersByUser = orders.reduce((acc, order) => {
      acc[order.user] = (acc[order.user] || 0) + 1;
      return acc;
    }, {});
    const averageOrderFrequency = users.length > 0 ? 
      Object.values(ordersByUser).reduce((sum, count) => sum + count, 0) / users.length : 0;

    // Mock data for metrics that need real implementation
    const cartAbandonmentRate = 25; // Example: 25%
    const customerSatisfactionScore = 4.2; // Example: 4.2/5

    // Calculate Top Selling Categories with safety checks
    const categorySales = orders.reduce((acc, order) => {
      if (!order.orderItems) return acc;
      
      order.orderItems.forEach(item => {
        if (!item.product) return;
        
        const product = products.find(p => p._id === item.product);
        if (product?.category) {
          acc[product.category] = (acc[product.category] || 0) + (item.qty || 0);
        }
      });
      return acc;
    }, {});

    const topSellingCategories = Object.entries(categorySales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Mock geographical distribution data
    const geographicalDistribution = {
      'North America': 45,
      'Europe': 30,
      'Asia': 15,
      'Others': 10
    };

    // Mock peak order times data
    const peakOrderTimes = {
      '9': 15,
      '12': 25,
      '15': 20,
      '18': 30,
      '21': 10
    };

    // Mock promotion effectiveness data
    const promotionEffectiveness = [
      { name: 'Summer Sale', conversionRate: 28, revenue: 12500 },
      { name: 'Holiday Special', conversionRate: 35, revenue: 18900 },
      { name: 'Flash Sale', conversionRate: 42, revenue: 8700 }
    ];

    // Calculate Customer Segments
    const customerSegments = [
      { name: 'New', percentage: 30 },
      { name: 'Regular', percentage: 45 },
      { name: 'VIP', percentage: 25 }
    ];

    // Calculate Inventory Turnover Rate safely
    const inventoryTurnoverRate = products.length > 0 ? 
      products.reduce((acc, product) => {
        const productSales = orders.reduce((sum, order) => {
          const orderItem = order.orderItems.find(item => item.product === product._id);
          return sum + (orderItem ? orderItem.qty : 0);
        }, 0);
        return acc + (productSales / (product.countInStock || 1));
      }, 0) / products.length : 0;

    setEnhancedStats({
      customerLifetimeValue,
      averageOrderFrequency,
      cartAbandonmentRate,
      customerSatisfactionScore,
      topSellingCategories,
      geographicalDistribution,
      peakOrderTimes,
      promotionEffectiveness,
      customerSegments,
      inventoryTurnoverRate
    });
  };

  const renderAdvancedAnalytics = () => (
    <Row className="mt-4">
      <Col md={6} lg={4}>
        <Card className="mb-4 analytics-card">
          <Card.Header>
            <h5><FaChartPie className="me-2" /> Customer Segments</h5>
          </Card.Header>
          <Card.Body>
            <Doughnut
              data={{
                labels: enhancedStats.customerSegments.map(segment => segment.name),
                datasets: [{
                  data: enhancedStats.customerSegments.map(segment => segment.percentage),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
              }}
              options={{
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6} lg={4}>
        <Card className="mb-4 analytics-card">
          <Card.Header>
            <h5><FaClock className="me-2" /> Peak Order Times</h5>
          </Card.Header>
          <Card.Body>
            <Bar
              data={{
                labels: Object.keys(enhancedStats.peakOrderTimes).map(hour => `${hour}:00`),
                datasets: [{
                  label: 'Orders',
                  data: Object.values(enhancedStats.peakOrderTimes),
                  backgroundColor: '#4CAF50'
                }]
              }}
              options={{
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={4}>
        <Card className="mb-4 analytics-card">
          <Card.Header>
            <h5><FaMapMarkerAlt className="me-2" /> Geographical Distribution</h5>
          </Card.Header>
          <Card.Body>
            <Pie
              data={{
                labels: Object.keys(enhancedStats.geographicalDistribution),
                datasets: [{
                  data: Object.values(enhancedStats.geographicalDistribution),
                  backgroundColor: ['#FF9800', '#2196F3', '#4CAF50', '#9C27B0']
                }]
              }}
              options={{
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={4}>
        <Card className="mb-4 analytics-card">
          <Card.Header>
            <h5><FaPercentage className="me-2" /> Promotion Performance</h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Conversion</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {enhancedStats.promotionEffectiveness.map((promo, index) => (
                  <tr key={index}>
                    <td>{promo.name}</td>
                    <td>{promo.conversionRate}%</td>
                    <td>${promo.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={4}>
        <Card className="mb-4 analytics-card">
          <Card.Header>
            <h5><FaUserCheck className="me-2" /> Customer Metrics</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Lifetime Value</span>
                  <strong>${enhancedStats.customerLifetimeValue.toFixed(2)}</strong>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Order Frequency</span>
                  <strong>{enhancedStats.averageOrderFrequency.toFixed(1)} orders/customer</strong>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Cart Abandonment</span>
                  <strong>{enhancedStats.cartAbandonmentRate}%</strong>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Satisfaction Score</span>
                  <strong>{enhancedStats.customerSatisfactionScore}/5</strong>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={4}>
        <Card className="mb-4 analytics-card">
          <Card.Header>
            <h5><FaBoxOpen className="me-2" /> Top Categories</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              {enhancedStats.topSellingCategories.map(([category, sales], index) => (
                <ListGroup.Item key={index}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{category}</span>
                    <Badge bg={index < 3 ? 'success' : 'secondary'}>{sales} units</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  // Add custom CSS for hover effects
  const customStyles = `
    .hover-shadow:hover {
      transform: translateY(-5px) !important;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.3s ease !important;
    }
    
    .pulse {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }
    
    .animate-pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }
    
    .action-card:hover {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    }
    
    .chart-container {
      position: relative;
      overflow: hidden;
    }
    
    .chart-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      transform: translateX(-100%);
      transition: transform 0.6s;
    }
    
    .chart-container:hover::before {
      transform: translateX(100%);
    }
    
    .metric-icon {
      transition: all 0.3s ease;
    }
    
    .metric-card:hover .metric-icon {
      transform: scale(1.1) rotate(5deg);
    }
    
    .progress-bar {
      transition: width 0.8s ease-in-out;
    }
    
    .btn-export:hover {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
    }
    
    .dropdown-menu {
      border-radius: 10px;
      border: none;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
    }
    
    .dropdown-item:hover {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 8px;
      margin: 2px 8px;
      transform: translateX(5px);
    }
    
    .nav-pills-custom .nav-link {
      border-radius: 25px;
      margin-right: 10px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .nav-pills-custom .nav-link.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .nav-pills-custom .nav-link:hover:not(.active) {
      background: rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
  `;

  const StatCard = ({ title, value, icon, color, change, prefix = '', suffix = '', onClick }) => {
    const getChangeColor = () => {
      if (change > 0) return '#28a745';
      if (change < 0) return '#dc3545';
      return '#6c757d';
    };

    const getChangeIcon = () => {
      if (change > 0) return <FaArrowUp size={12} />;
      if (change < 0) return <FaArrowDown size={12} />;
      return null;
    };

    const getChangeBg = () => {
      if (change > 0) return 'rgba(40, 167, 69, 0.1)';
      if (change < 0) return 'rgba(220, 53, 69, 0.1)';
      return 'rgba(108, 117, 125, 0.1)';
    };

    return (
      <Card 
        style={{...dashboardStyles.card, cursor: onClick ? 'pointer' : 'default'}} 
        className="h-100 stat-card"
        onClick={onClick}
      >
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col xs={8}>
              <div className="mb-2">
                <h6 className="text-muted mb-1 small">{title}</h6>
                <h3 className="mb-0 fw-bold" style={{ color: color }}>
                  {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                </h3>
              </div>
              {change !== undefined && (
                <div 
                  className="d-flex align-items-center small"
                  style={{ 
                    color: getChangeColor(),
                    backgroundColor: getChangeBg(),
                    padding: '4px 8px',
                    borderRadius: '12px',
                    width: 'fit-content'
                  }}
                >
                  {getChangeIcon()}
                  <span className="ms-1 fw-semibold">
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
              )}
            </Col>
            <Col xs={4} className="text-end">
              <div 
                className="metric-icon d-flex align-items-center justify-content-center"
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: `${color}20`,
                  borderRadius: '50%',
                  color: color,
                  fontSize: '24px'
                }}
              >
                {icon}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // Improved render functions
  const renderOverviewTab = () => (
    <>
      {/* Enhanced Dashboard Header */}
      <Card style={dashboardStyles.dashHeader} className="border-0 mb-4">
        <div style={dashboardStyles.dashHeaderPattern}></div>
        <div className="position-relative">
          <Row className="align-items-center">
            <Col lg={8}>
              <h2 className="fw-bold mb-1">ProMayouf Admin Dashboard</h2>
              <p className="mb-2 opacity-75">
                Welcome back! Here's what's happening with your store today.
              </p>
              <small className="opacity-50">
                Last updated: {format(new Date(), 'PPpp')}
              </small>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <div className="d-flex gap-2 justify-content-lg-end flex-wrap">
                <Button
                  variant="light"
                  size="sm"
                  style={dashboardStyles.dashBtn}
                  onClick={() => handleButtonClick('refresh')}
                  disabled={loadingOrders || loadingDashboard}
                >
                  {loadingOrders || loadingDashboard ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <FaSyncAlt className="me-1" /> Refresh
                    </>
                  )}
                </Button>
                
                <Button
                  variant="light"
                  size="sm"
                  style={dashboardStyles.dashBtn}
                  onClick={() => handleButtonClick('print-report')}
                >
                  <FaPrint className="me-1" /> Print
                </Button>

                <Dropdown>
                  <Dropdown.Toggle
                    variant="light"
                    size="sm"
                    style={dashboardStyles.dashBtn}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FaDownload className="me-1" /> Export
                      </>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleButtonClick('export-sales')}>
                      <FaChartLine className="me-2" /> Sales Report
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleButtonClick('export-products')}>
                      <FaBox className="me-2" /> Products Report
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => handleButtonClick('export-all')}>
                      <FaDownload className="me-2" /> Complete Report
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <Button
                  variant={analyticsView === 'advanced' ? 'warning' : 'light'}
                  size="sm"
                  style={dashboardStyles.dashBtn}
                  onClick={() => handleButtonClick('toggle-analytics')}
                >
                  <FaChartArea className="me-1" />
                  {analyticsView === 'advanced' ? 'Basic View' : 'Advanced'}
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Date Range Selector - Moved to Top */}
      <Row className="mb-4">
        <Col>
          <Card style={dashboardStyles.card}>
            <Card.Header className="bg-light border-bottom">
              <Row className="align-items-center">
                <Col md={6}>
                  <h6 className="mb-0">
                    <FaRegCalendarAlt className="me-2" />
                    Date Range & Period Selection
                  </h6>
                </Col>
                <Col md={6} className="text-end">
                  <small className="text-muted">
                    Current Period: {format(dateRange.startDate, 'MMM dd')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="date-picker-wrapper">
                    <DatePicker
                      selectsRange
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={(update) => {
                        setDateRange({
                          startDate: update[0],
                          endDate: update[1]
                        });
                      }}
                      className="form-control"
                      customInput={
                        <InputGroup>
                          <InputGroup.Text>
                            <FaRegCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control readOnly placeholder="Select date range" />
                        </InputGroup>
                      }
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant={dataPeriod === 'daily' ? 'primary' : 'outline-secondary'} 
                      size="sm" 
                      onClick={() => setDataPeriod('daily')}
                    >
                      Daily
                    </Button>
                    <Button 
                      variant={dataPeriod === 'weekly' ? 'primary' : 'outline-secondary'} 
                      size="sm" 
                      onClick={() => setDataPeriod('weekly')}
                    >
                      Weekly
                    </Button>
                    <Button 
                      variant={dataPeriod === 'monthly' ? 'primary' : 'outline-secondary'} 
                      size="sm" 
                      onClick={() => setDataPeriod('monthly')}
                    >
                      Monthly
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Action Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card 
            style={{...dashboardStyles.card, cursor: 'pointer'}} 
            onClick={() => handleButtonClick('view-orders')}
            className="h-100 text-center hover-shadow"
          >
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaShoppingCart size={32} className="text-primary" />
              </div>
              <h6 className="mb-2">Manage Orders</h6>
              <p className="text-muted small mb-0">View and process orders</p>
              <Badge bg="primary" className="mt-2">{stats.totalOrders || 0}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card 
            style={{...dashboardStyles.card, cursor: 'pointer'}} 
            onClick={() => handleButtonClick('view-products')}
            className="h-100 text-center hover-shadow"
          >
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaBox size={32} className="text-success" />
              </div>
              <h6 className="mb-2">Manage Products</h6>
              <p className="text-muted small mb-0">Add, edit, and organize products</p>
              <Badge bg="success" className="mt-2">{stats.totalProducts || 0}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card 
            style={{...dashboardStyles.card, cursor: 'pointer'}} 
            onClick={() => handleButtonClick('view-users')}
            className="h-100 text-center hover-shadow"
          >
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaUsers size={32} className="text-info" />
              </div>
              <h6 className="mb-2">Manage Users</h6>
              <p className="text-muted small mb-0">View and manage customers</p>
              <Badge bg="info" className="mt-2">{stats.totalUsers || 0}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card 
            style={{...dashboardStyles.card, cursor: 'pointer'}} 
            onClick={() => handleButtonClick('view-returns')}
            className="h-100 text-center hover-shadow"
          >
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaUndo size={32} className="text-warning" />
              </div>
              <h6 className="mb-2">Handle Returns</h6>
              <p className="text-muted small mb-0">Process return requests</p>
              <Badge bg="warning" className="mt-2">{returnStats?.pendingReturns || 0}</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Urgent Notifications Banner */}
      {returnStats?.pendingReturns > 0 && (
        <Alert variant="warning" className="mb-4" dismissible>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center">
                <FaExclamationTriangle size={24} className="me-3 text-warning" />
                <div>
                  <h6 className="mb-1 text-warning">⚠️ Pending Return Requests Need Attention</h6>
                  <p className="mb-0">
                    You have <strong>{returnStats.pendingReturns}</strong> return request{returnStats.pendingReturns > 1 ? 's' : ''} 
                    waiting for your review. Quick response improves customer satisfaction.
                  </p>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="warning" 
                onClick={() => handleButtonClick('view-returns')}
                className="me-2"
              >
                <FaClipboardList className="me-1" />
                Review Now ({returnStats.pendingReturns})
              </Button>
            </Col>
          </Row>
        </Alert>
      )}

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <StatCard 
            title="Total Sales" 
            value={stats.totalSales} 
            icon={<FaDollarSign />} 
            color="#28a745"
            change={comparisonMetrics.sales.percentChange}
            prefix="$"
            onClick={() => handleButtonClick('view-orders')}
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            icon={<FaShoppingCart />} 
            color="#007bff"
            change={comparisonMetrics.orders.percentChange}
            onClick={() => handleButtonClick('view-orders')}
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Total Customers" 
            value={users?.length || 0} 
            icon={<FaUserCheck />} 
            color="#6f42c1"
            change={comparisonMetrics.customers.percentChange}
            onClick={() => handleButtonClick('view-users')}
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Avg. Order Value" 
            value={comparisonMetrics.avgOrderValue.current.toFixed(2)} 
            icon={<FaDollarSign />} 
            color="#fd7e14"
            change={comparisonMetrics.avgOrderValue.percentChange}
            prefix="$"
            onClick={() => handleButtonClick('view-orders')}
          />
        </Col>
      </Row>

      {/* Secondary Metrics including Returns */}
      <Row className="mb-4">
        <Col md={3}>
          <StatCard 
            title="Total Returns" 
            value={returnStats?.totalReturns || 0} 
            icon={<FaUndo />} 
            color="#dc3545"
            change={returnStats?.returnsChange || 0}
            onClick={() => handleButtonClick('view-returns')}
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Pending Returns" 
            value={returnStats?.pendingReturns || 0} 
            icon={<FaClock />} 
            color="#ffc107"
            change={returnStats?.pendingChange || 0}
            onClick={() => handleButtonClick('view-returns')}
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Refund Amount" 
            value={(returnStats?.totalRefunds || 0).toFixed(2)} 
            icon={<FaDollarSign />} 
            color="#17a2b8"
            change={returnStats?.refundChange || 0}
            prefix="$"
            onClick={() => handleButtonClick('view-returns')}
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Return Rate" 
            value={(returnStats?.returnRate || 0).toFixed(1)} 
            icon={<FaChartPie />} 
            color="#6f42c1"
            change={returnStats?.rateChange || 0}
            suffix="%"
            onClick={() => handleButtonClick('view-returns')}
          />
        </Col>
      </Row>

      {/* Enhanced Charts Section */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card style={dashboardStyles.card}>
            <Card.Header className="bg-white border-bottom">
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">
                    <FaChartLine className="me-2 text-primary" />
                    Sales Performance
                  </h5>
                  <small className="text-muted">
                    Revenue trends over {dataPeriod === 'monthly' ? 'last 12 months' : dataPeriod === 'weekly' ? 'last 10 weeks' : 'last 30 days'}
                  </small>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handleButtonClick('export-sales')}
                      disabled={isExporting}
                    >
                      <FaDownload className="me-1" /> Export
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => handleButtonClick('refresh')}
                    >
                      <FaSyncAlt />
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '350px', position: 'relative' }}>
                {loadingOrders ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center">
                      <div className="spinner-border text-primary mb-3" role="status"></div>
                      <p className="text-muted">Loading sales data...</p>
                    </div>
                  </div>
                ) : (
                  <Line 
                    ref={salesChartRef}
                    data={getSalesChartData()}
                    options={getSalesChartOptions()}
                  />
                )}
              </div>
              
              {/* Sales Summary Cards */}
              <Row className="mt-4">
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-success mb-1">
                      <FaArrowUp className="me-1" />
                      Peak Sales Day
                    </h6>
                    <p className="mb-0 fw-bold">
                      ${Object.values(stats?.revenueByCategory || {}).length ? 
                        Math.max(...Object.values(stats.revenueByCategory)).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-info mb-1">
                      <FaChartBar className="me-1" />
                      Average Daily Sales
                    </h6>
                    <p className="mb-0 fw-bold">
                      ${((stats?.totalSales || 0) / 30).toFixed(2)}
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-warning mb-1">
                      <FaChartLine className="me-1" />
                      Growth Rate
                    </h6>
                    <p className="mb-0 fw-bold">
                      {comparisonMetrics.sales.percentChange > 0 ? '+' : ''}
                      {comparisonMetrics.sales.percentChange.toFixed(1)}%
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card style={dashboardStyles.card}>
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaChartPie className="me-2 text-success" />
                Category Distribution
              </h5>
              <small className="text-muted">Sales breakdown by product category</small>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              <div style={{ height: '250px', position: 'relative' }}>
                {loadingProducts ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-success" role="status"></div>
                  </div>
                ) : (
                  <Doughnut 
                    ref={categoryChartRef}
                    data={{
                      labels: Object.keys(stats?.revenueByCategory || {}).length ? Object.keys(stats.revenueByCategory) : ['No Data'],
                      datasets: [
                        {
                          data: Object.values(stats?.revenueByCategory || {}).length ? Object.values(stats.revenueByCategory) : [1],
                          backgroundColor: [
                            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
                            '#F44336', '#00BCD4', '#795548', '#FFEB3B',
                          ],
                          borderWidth: 2,
                          borderColor: '#fff',
                          hoverBorderWidth: 3,
                        },
                      ],
                    }}
                    options={getCategoryChartOptions()}
                  />
                )}
              </div>
              
              {/* Category Legend */}
              <div className="mt-3">
                {Object.entries(stats?.revenueByCategory || {}).slice(0, 4).map(([category, revenue], index) => (
                  <div key={category} className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle me-2" 
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][index]
                        }}
                      ></div>
                      <small className="text-muted">{category}</small>
                    </div>
                    <small className="fw-bold">${(revenue || 0).toFixed(0)}</small>
                  </div>
                ))}
                {Object.keys(stats?.revenueByCategory || {}).length === 0 && (
                  <div className="text-center text-muted">
                    <small>No category data available</small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Analytics Row */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card style={dashboardStyles.card}>
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaUsers className="me-2 text-info" />
                Customer Analytics
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="text-center p-3 border rounded mb-3">
                    <FaUserPlus size={24} className="text-success mb-2" />
                    <h6 className="mb-1">New Customers</h6>
                    <h4 className="text-success mb-0">
                      {users?.filter(user => 
                        new Date(user.createdAt) >= dateRange.startDate && 
                        new Date(user.createdAt) <= dateRange.endDate
                      ).length || 0}
                    </h4>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center p-3 border rounded mb-3">
                    <FaUserCheck size={24} className="text-primary mb-2" />
                    <h6 className="mb-1">Active Customers</h6>
                    <h4 className="text-primary mb-0">
                      {orders?.reduce((acc, order) => {
                        if (!acc.includes(order.user?._id)) acc.push(order.user?._id);
                        return acc;
                      }, []).length || 0}
                    </h4>
                  </div>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6 className="mb-3">Customer Engagement</h6>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${Math.min((users?.length || 0) / 100 * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Total Users: {users?.length || 0}</small>
                  <small className="text-muted">Target: 100</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card style={dashboardStyles.card}>
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaShoppingCart className="me-2 text-warning" />
                Order Analytics
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="text-center p-3 border rounded mb-3">
                    <FaClipboardList size={24} className="text-warning mb-2" />
                    <h6 className="mb-1">Pending Orders</h6>
                    <h4 className="text-warning mb-0">
                      {orders?.filter(order => order.orderStatus === 'Processing').length || 0}
                    </h4>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center p-3 border rounded mb-3">
                    <FaCheckCircle size={24} className="text-success mb-2" />
                    <h6 className="mb-1">Completed</h6>
                    <h4 className="text-success mb-0">
                      {orders?.filter(order => order.orderStatus === 'Delivered').length || 0}
                    </h4>
                  </div>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6 className="mb-3">Order Fulfillment Rate</h6>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ 
                      width: `${orders?.length ? 
                        (orders.filter(order => order.orderStatus === 'Delivered').length / orders.length * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">
                    Delivered: {orders?.filter(order => order.orderStatus === 'Delivered').length || 0}
                  </small>
                  <small className="text-muted">
                    Total: {orders?.length || 0}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderMetricDetailsModal = () => (
    <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{selectedMetric?.title || 'Metric Details'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedMetric?.content}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
          Close
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          Print Report
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Define salesChartData, salesChartOptions, and categoryChartOptions
  const getSalesChartData = () => {
    // Ensure salesData exists and has proper structure
    const salesData = stats?.salesTrend || [];
    
    // If no data, return default structure
    if (!salesData.length) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Sales',
            data: [0],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }
    
    const labels = salesData.map(data => data.date || 'Unknown');
    const salesValues = salesData.map(data => data.amount || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: salesValues,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const getSalesChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Sales Trend',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };
  };

  const getCategoryChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Sales by Category',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: $${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      },
    };
  };

  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  if (loadingOrders || loadingProducts || loadingUsers || loadingDashboard || loadingReturnStats) {
    return <Loader />;
  }

  if (errorOrders || errorProducts || errorUsers || errorDashboard || errorReturnStats) {
    return (
      <Message variant="danger">
        {errorOrders?.message || errorProducts?.message || errorUsers?.message || errorDashboard?.message || errorReturnStats?.message}
      </Message>
    );
  }

  return (
    <div style={dashboardStyles.container}>
      {/* Add custom styles */}
      <style>{customStyles}</style>
      
      <Container fluid className="px-4">
        <Row>
          <Col lg={3}>
            <AdminSidebar activeKey="dashboard" />
          </Col>
          <Col lg={9}>
            <div ref={componentRef}>
              <Nav variant="pills" className="mb-4 nav-pills-custom">
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    className="d-flex align-items-center"
                  >
                    <FaTachometerAlt className="me-2" />
                    Dashboard Overview
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'analytics'}
                    onClick={() => setActiveTab('analytics')}
                    className="d-flex align-items-center"
                  >
                    <FaChartBar className="me-2" />
                    Advanced Analytics
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              {/* Tab Content */}
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'analytics' && renderAdvancedAnalytics()}
            </div>
          </Col>
        </Row>
      </Container>

      {/* Metric Details Modal */}
      {renderMetricDetailsModal()}
    </div>
  );
};

export default AdminDashboardScreen;
