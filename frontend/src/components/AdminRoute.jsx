import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { currentUser, loading } = useAuth();
  
  // Show loading while checking auth state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Check if user is authenticated and is admin
  const isAuthenticated = currentUser || userInfo;
  const isAdmin = userInfo?.isAdmin;
  
  return isAuthenticated && isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to='/login' replace />
  );
};

export default AdminRoute;
