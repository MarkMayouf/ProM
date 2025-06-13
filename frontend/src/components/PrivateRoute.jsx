import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { currentUser, loading } = useAuth();
  
  // Show loading while checking auth state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Use Firebase auth as primary check, Redux as backup
  return (currentUser || userInfo) ? <Outlet /> : <Navigate to='/login' replace />;
};

export default PrivateRoute;
