import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Card, InputGroup, Modal, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaEye, FaEyeSlash, FaShieldAlt, FaLock, FaEnvelope, FaKey, 
  FaGoogle, FaUserShield, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaArrowRight, FaStore, FaSuitcase
} from 'react-icons/fa';
import Loader from '../components/Loader';
import Meta from '../components/Meta';

import { toast } from 'react-toastify';
import { signInWithGoogle, signInWithEmailAndPassword_, resetPassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' });
  const [passwordValidation, setPasswordValidation] = useState({ isValid: true, message: '' });
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get('redirect') || '/';

  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  useEffect(() => {
    if (currentUser) {
      navigate(redirect);
    }
  }, [navigate, redirect, currentUser]);

  // Load saved email if remember me was used
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const wasRemembered = localStorage.getItem('rememberMe');
    if (savedEmail && wasRemembered) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle account lockout timer
  useEffect(() => {
    let interval;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prevTime) => {
          if (prevTime <= 1) {
            setIsLocked(false);
            clearInterval(interval);
            toast.success('Account unlocked! You can try logging in again.');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, lockTimer]);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailValidation({
      isValid,
      message: isValid ? '' : 'Please enter a valid email address'
    });
    return isValid;
  };

  // Password validation
  const validatePassword = (password) => {
    const isValid = password.length >= 6;
    setPasswordValidation({
      isValid,
      message: isValid ? '' : 'Password must be at least 6 characters'
    });
    return isValid;
  };

  // Main login handler
  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error('Account is temporarily locked. Please wait.');
      return;
    }

    setIsSubmitting(true);

    if (!validateEmail(email) || !validatePassword(password)) {
      setIsSubmitting(false);
      toast.error('Please fix the form errors before submitting');
      return;
    }

    try {
      // Use Firebase authentication only
      const result = await signInWithEmailAndPassword_(email.trim().toLowerCase(), password);
      
      if (result.success) {
        // Reset login attempts on successful login
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }
        
        toast.success('Successfully signed in!');
        navigate(redirect);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
       const newAttempts = loginAttempts + 1;
       setLoginAttempts(newAttempts);
       localStorage.setItem('loginAttempts', newAttempts.toString());
       
       if (newAttempts >= 3) {
         setIsLocked(true);
         setLockTimer(300); // 5 minutes lockout
         toast.error('Too many failed attempts. Account locked for 5 minutes.');
       } else {
         // Handle specific errors
         if (error.message && error.message.includes('auth/user-not-found')) {
           toast.error('Account not found. Please check your email or create a new account.');
         } else if (error.message && error.message.includes('auth/wrong-password')) {
           toast.error('Incorrect password. Please try again or reset your password.');
         } else if (error.message && error.message.includes('auth/invalid-email')) {
           toast.error('Please enter a valid email address.');
         } else if (error.message && error.message.includes('auth/user-disabled')) {
           toast.error('This account has been disabled. Please contact support.');
         } else if (error.message && error.message.includes('auth/too-many-requests')) {
           toast.error('Too many unsuccessful attempts. Please try again later.');
         } else if (error.message && error.message.includes('auth/invalid-credential')) {
           toast.error('Invalid credentials. Please check your email and password.');
         } else {
           toast.error(error.message || 'Failed to sign in');
         }
       }
     } finally {
       setIsSubmitting(false);
     }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        toast.success('Successfully signed in with Google!');
        // Add a small delay to ensure auth state is properly set
        setTimeout(() => {
          navigate(redirect);
        }, 1000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const result = await resetPassword(forgotPasswordEmail);
      if (result.success) {
        setResetEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  const getStrengthColor = (attempts) => {
    if (attempts === 0) return 'info';
    if (attempts === 1) return 'warning';
    return 'danger';
  };

  return (
    <>
      <Meta title='Sign In - ProMayouf' />
      <div 
        className="min-vh-100 d-flex align-items-center py-5" 
        style={{
          background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 50%, #34495e 100%)',
          position: 'relative'
        }}
      >
        {/* Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3
          }}
        />

        <Container>
          <Row className="justify-content-center">
            <Col md={6} lg={5} xl={4}>
              <Card 
                className="shadow-lg border-0"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Card.Body className="p-5">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 100%)',
                      }}
                    >
                      <FaShieldAlt size={35} className="text-white" />
                    </div>
                    <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
                    <p className="text-muted">Sign in to your ProMayouf account</p>
                  </div>

                  {/* Alerts */}
                  {isLocked && (
                    <Alert variant="danger" className="d-flex align-items-center mb-3">
                      <FaLock className="me-2" />
                      <div>
                        <strong>Account Locked</strong>
                        <div>Too many failed attempts. Try again in {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')}</div>
                      </div>
                    </Alert>
                  )}

                  {loginAttempts > 0 && !isLocked && (
                    <Alert variant={getStrengthColor(loginAttempts)} className="d-flex align-items-center mb-3">
                      <FaExclamationTriangle className="me-2" />
                      <div>
                        <strong>{3 - loginAttempts} attempts remaining</strong>
                        <div>Account will be locked after 3 failed attempts</div>
                      </div>
                    </Alert>
                  )}

                  <Form onSubmit={submitHandler}>
                    {/* Email Field */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark small">
                        <FaEnvelope className="me-2 text-primary" />
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          validateEmail(e.target.value);
                        }}
                        onBlur={() => validateEmail(email)}
                        className={`${!emailValidation.isValid ? 'is-invalid' : email && emailValidation.isValid ? 'is-valid' : ''}`}
                        style={{ borderRadius: '8px', padding: '0.75rem' }}
                        required
                      />
                      {!emailValidation.isValid && (
                        <div className="invalid-feedback">{emailValidation.message}</div>
                      )}
                    </Form.Group>

                    {/* Password Field */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark small">
                        <FaLock className="me-2 text-primary" />
                        Password
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            validatePassword(e.target.value);
                          }}
                          onBlur={() => validatePassword(password)}
                          className={`${!passwordValidation.isValid ? 'is-invalid' : password && passwordValidation.isValid ? 'is-valid' : ''}`}
                          style={{ borderRadius: '8px 0 0 8px', padding: '0.75rem' }}
                          required
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ 
                            borderRadius: '0 8px 8px 0',
                            borderLeft: 'none'
                          }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </InputGroup>
                      {!passwordValidation.isValid && (
                        <div className="invalid-feedback d-block">{passwordValidation.message}</div>
                      )}
                    </Form.Group>

                    {/* Remember Me & Forgot Password */}
                    <Row className="mb-4">
                      <Col xs={6}>
                        <Form.Check
                          type="checkbox"
                          id="rememberMe"
                          label={<span className="small">Remember me</span>}
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="text-muted"
                        />
                      </Col>
                      <Col xs={6} className="text-end">
                        <Button
                          variant="link"
                          className="text-decoration-none p-0 small"
                          onClick={() => setShowForgotPassword(true)}
                          style={{ color: '#1a2c42' }}
                        >
                          Forgot Password?
                        </Button>
                      </Col>
                    </Row>

                    {/* Sign In Button */}
                    <div className="d-grid mb-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting || isLocked}
                        style={{
                          background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Signing In...
                          </>
                        ) : (
                          <>
                            <FaShieldAlt className="me-2" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="text-center my-4">
                      <div className="d-flex align-items-center">
                        <hr className="flex-grow-1" />
                        <span className="mx-3 text-muted small">OR</span>
                        <hr className="flex-grow-1" />
                      </div>
                    </div>

                    {/* Google Sign In Button */}
                    <div className="d-grid mb-4">
                      <Button
                        variant="outline-danger"
                        size="lg"
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                        style={{ 
                          borderRadius: '10px',
                          padding: '0.75rem',
                          border: '2px solid #dc3545',
                          fontWeight: '600'
                        }}
                      >
                        <FaGoogle className="me-2" />
                        Continue with Google
                      </Button>
                    </div>
                  </Form>

                  {/* Create Account Link */}
                  <div className="text-center">
                    <p className="text-muted mb-0 small">
                      Don't have an account?{' '}
                      <Link 
                        to={redirect ? `/register?redirect=${redirect}` : '/register'}
                        className="text-decoration-none fw-semibold"
                        style={{ color: '#1a2c42' }}
                      >
                        Create Account
                      </Link>
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

        {/* Forgot Password Modal */}
        <Modal show={showForgotPassword} onHide={() => setShowForgotPassword(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <FaKey className="me-2 text-primary" />
              Reset Password
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {!resetEmailSent ? (
              <>
                <p className="text-muted mb-3">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email address"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                </Form.Group>
              </>
            ) : (
              <div className="text-center">
                <FaCheckCircle size={50} className="text-success mb-3" />
                <h5>Email Sent!</h5>
                <p className="text-muted">
                  Check your email for password reset instructions.
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {!resetEmailSent ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 100%)',
                    border: 'none'
                  }}
                >
                  Send Reset Email
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setForgotPasswordEmail('');
                }}
                style={{
                  background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 100%)',
                  border: 'none'
                }}
              >
                Close
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default LoginScreen;
