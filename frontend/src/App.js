import React from 'react';
import {
  Outlet,
  Route,
  Routes
} from 'react-router-dom';
import {
  ToastContainer
} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Container
} from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import CartScreen from './screens/CartScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ShippingScreen from './screens/ShippingScreen';
import PrivateRoute from './components/PrivateRoute';
import PaymentScreen from './screens/PaymentScreen';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import OrderScreen from './screens/OrderScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReturnRequestScreen from './screens/ReturnRequestScreen';
import OrderListScreen from './screens/admin/OrderListScreen';
import OrderCreateScreen from './screens/admin/OrderCreateScreen';
import ProductListScreen from './screens/admin/ProductListScreen';
import ProductEditScreen from './screens/admin/ProductEditScreen';
import ProductCreateScreen from './screens/admin/ProductCreateScreen';

import UserListScreen from './screens/admin/UserListScreen';
import UserEditScreen from './screens/admin/UserEditScreen';
import AdminRoute from './components/AdminRoute';
import CategoryScreen from './screens/CategoryScreen';

import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import SaleScreen from './screens/SaleScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import InvoiceScreen from './screens/InvoiceScreen';
import HelpScreen from './screens/HelpScreen';
import StoreLocatorScreen from './screens/StoreLocatorScreen';
import WishlistScreen from './screens/WishlistScreen';
import MarketingDashboardScreen from './screens/admin/MarketingDashboardScreen';
import EmailMarketingScreen from './screens/admin/EmailMarketingScreen';
import HomeContentManagementScreen from './screens/admin/HomeContentManagementScreen';
import ReturnManagementScreen from './screens/admin/ReturnManagementScreen';

import CookieConsent from './components/CookieConsent';
import TiesScreen from './screens/TiesScreen';
import ShirtsScreen from './screens/ShirtsScreen';
import NikeScreen from './screens/NikeScreen';
import FeaturedProductsScreen from './screens/FeaturedProductsScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import LastBoughtItemsScreen from './screens/LastBoughtItemsScreen';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#4aed88',
            },
          },
        }}
      />
      <Header />
      <main className='py-3'>
        <Container>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/search/:keyword' element={<HomeScreen />} />
            <Route path='/page/:pageNumber' element={<HomeScreen />} />
            <Route path='/search/:keyword/page/:pageNumber' element={<HomeScreen />} />
            <Route path='/product/:id' element={<ProductScreen />} />
            <Route path='/cart' element={<CartScreen />} />
            <Route path='/wishlist' element={<WishlistScreen />} />
            <Route path='/login' element={<LoginScreen />} />
            <Route path='/register' element={<RegisterScreen />} />
            <Route path='/forgot-password' element={<ForgotPasswordScreen />} />
            <Route path='/reset-password/:token' element={<ResetPasswordScreen />} />
            <Route path='/category/:category' element={<CategoryScreen />} />
            {/* Special route for ties collection */}
            <Route path='/category/accessories/ties' element={<TiesScreen />} />
            {/* Special route for shirts collection */}
            <Route path='/shirts' element={<ShirtsScreen />} />
            <Route path='/brands/nike' element={<NikeScreen />} />
            <Route path='/sale' element={<SaleScreen />} />
            <Route path='/sale/page/:pageNumber' element={<SaleScreen />} />
            <Route path='/featured-products' element={<FeaturedProductsScreen />} />
            <Route path='/track-order' element={<OrderTrackingScreen />} />
            <Route path='/track-order/:id' element={<OrderTrackingScreen />} />
            <Route path='/help' element={<HelpScreen />} />
            <Route path='/store-locator' element={<StoreLocatorScreen />} />

            <Route path='' element={<PrivateRoute />}>
              <Route path='/shipping' element={<ShippingScreen />} />
              <Route path='/payment' element={<PaymentScreen />} />
              <Route path='/placeorder' element={<PlaceOrderScreen />} />
              <Route path='/order/:id' element={<OrderScreen />} />
              <Route path='/order/:id/receipt' element={<ReceiptScreen />} />
              <Route path='/order/:id/invoice' element={<InvoiceScreen />} />
              <Route path='/order/:id/return' element={<ReturnRequestScreen />} />
              <Route path='/feedback/:orderId' element={<FeedbackScreen />} />
              <Route path='/profile' element={<ProfileScreen />} />
              <Route path='/order-history' element={<OrderHistoryScreen />} />
              <Route path='/my-purchases' element={<LastBoughtItemsScreen />} />
            </Route>

            <Route path='' element={<AdminRoute />}>
              <Route path='/admin/dashboard' element={<AdminDashboardScreen />} />
              <Route path='/admin/orderlist' element={<OrderListScreen />} />
              <Route path='/admin/order/create' element={<OrderCreateScreen />} />
              <Route path='/admin/productlist' element={<ProductListScreen />} />
              <Route path='/admin/productlist/:pageNumber' element={<ProductListScreen />} />
              <Route path='/admin/product/create' element={<ProductCreateScreen />} />
              <Route path='/admin/products/:id/edit' element={<ProductEditScreen />} />
              <Route path='/admin/userlist' element={<UserListScreen />} />
              <Route path='/admin/user/:id/edit' element={<UserEditScreen />} />

              <Route path='/admin/marketing' element={<MarketingDashboardScreen />} />
              <Route path='/admin/email-marketing' element={<EmailMarketingScreen />} />
              <Route path='/admin/home-content' element={<HomeContentManagementScreen />} />
              <Route path='/admin/returns' element={<ReturnManagementScreen />} />

            </Route>
          </Routes>
        </Container>
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
      <ToastContainer />
    </AuthProvider>
  );
};

export default App;