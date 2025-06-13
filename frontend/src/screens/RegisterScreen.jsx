import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Container, InputGroup, Modal, Spinner, Alert } from 'react-bootstrap';
import { 
  FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, 
  FaShieldAlt, FaUserPlus, FaSuitcase, 
  FaFileContract, FaUserShield
} from 'react-icons/fa';
import Meta from '../components/Meta';
import { toast } from 'react-toastify';
import { 
  signInWithGoogle, 
  registerWithEmailAndPassword,
  sendEmailVerification_,
  sendPhoneVerificationCode,
  setupPhoneVerification
} from '../services/authService';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import Loader from '../components/Loader';

// Import auth testing utility for development
if (process.env.NODE_ENV === 'development') {
  import('../utils/authTest');
}

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    verificationCode: '',
    verificationType: 'email',
    verificationSent: false,
    isLoading: false,
    recaptchaVerifier: null,
    confirmationResult: null
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { firstName, lastName, email, password, confirmPassword, phone } = formData;

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const dispatch = useDispatch();

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get('redirect') || '/';

  const { userInfo } = useSelector((state) => state.auth);

  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(redirect);
    }
  }, [navigate, redirect, currentUser]);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  useEffect(() => {
    if (!formData.recaptchaVerifier && formData.verificationType === 'phone') {
      try {
        const verifier = setupPhoneVerification('recaptcha-container');
        setFormData(prev => ({ ...prev, recaptchaVerifier: verifier }));
      } catch (error) {
        toast.error('Error setting up phone verification. Please try again.');
      }
    }
  }, [formData.recaptchaVerifier, formData.verificationType]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation errors on input change
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Real-time validation
    if (name === 'email') validateEmail(value);
    if (name === 'password') validatePassword(value);
    if (name === 'confirmPassword' || (name === 'password' && confirmPassword)) {
      validateConfirmPassword(name === 'confirmPassword' ? value : confirmPassword, name === 'password' ? value : password);
    }
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid && email.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
    return isValid;
  };

  // Password validation
  const validatePassword = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
    
    if (password.length > 0 && strength < 3) {
      setValidationErrors(prev => ({
        ...prev,
        password: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
      }));
      return false;
    } else {
      setValidationErrors(prev => ({
        ...prev,
        password: ''
      }));
      return true;
    }
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPass, pass) => {
    if (confirmPass !== pass && confirmPass.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return false;
    } else {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
      return true;
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    
    if (!email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(email)) errors.email = 'Please enter a valid email address';
    
    if (!password.trim()) errors.password = 'Password is required';
    else if (!validatePassword(password)) errors.password = 'Password is too weak';
    
    if (!confirmPassword.trim()) errors.confirmPassword = 'Please confirm your password';
    else if (!validateConfirmPassword(confirmPassword, password)) errors.confirmPassword = 'Passwords do not match';
    
    if (!acceptTerms) errors.acceptTerms = 'You must accept the Terms & Conditions';
    if (!acceptPrivacy) errors.acceptPrivacy = 'You must accept the Privacy Policy';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const submitHandler = async (e) => {
    e.preventDefault();
    console.log('Registration started');
    console.log('Form data:', formData);
    
    if (!validateForm()) return;
    
    setFormData(prev => ({
      ...prev,
      isLoading: true
    }));

    try {
      if (formData.verificationType === 'email') {
        // Register with email
        const fullName = `${firstName} ${lastName}`;
        const result = await registerWithEmailAndPassword(email.trim().toLowerCase(), password, fullName);
        
        if (result.success) {
          // Send verification email
          await sendEmailVerification_(result.user);
          setFormData(prev => ({
            ...prev,
            verificationSent: true
          }));
          toast.success('Registration successful! Please verify your email.');
          console.log('Registration completed successfully');
          console.log('Registration result:', result);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Phone verification
        if (!formData.verificationSent) {
          await handlePhoneVerification();
          return;
        }

        if (!formData.confirmationResult) {
          toast.error('Please request a verification code first');
          return;
        }

        // Verify the code
        try {
          await formData.confirmationResult.confirm(formData.verificationCode);
          // Register the user after successful verification
          const fullName = `${firstName} ${lastName}`;
          const result = await registerWithEmailAndPassword(email.trim().toLowerCase(), password, fullName);
          if (result.success) {
            toast.success('Registration successful!');
            navigate('/');
            console.log('Registration completed successfully');
            console.log('Registration result:', result);
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error('Invalid verification code');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setFormData(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  // Google registration
  const handleGoogleRegister = async () => {
    try {
      setFormData(prev => ({
        ...prev,
        isLoading: true
      }));
      const result = await signInWithGoogle();
      if (result.success) {
        toast.success('Registration successful with Google!');
        setTimeout(() => {
          navigate(redirect);
        }, 1000);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Google registration error:', error);
      toast.error('Google registration failed. Please try again.');
    } finally {
      setFormData(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  // Password strength helpers
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#dc3545';
    if (passwordStrength <= 3) return '#fd7e14';
    if (passwordStrength <= 4) return '#ffc107';
    return '#28a745';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const handlePhoneVerification = async () => {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const confirmation = await sendPhoneVerificationCode(formattedPhone, formData.recaptchaVerifier);
      setFormData(prev => ({
        ...prev,
        confirmationResult: confirmation,
        verificationSent: true
      }));
      toast.success('Verification code sent to your phone');
    } catch (error) {
      console.error('Phone verification error:', error);
      toast.error(error.message || 'Failed to send verification code');
    }
  };

  return (
    <FormContainer>
      <Meta title='Register' />
      <Card className='p-4 shadow-sm'>
        <h1 className='text-center mb-4'>Register</h1>
        
        {formData.verificationSent ? (
          <div className='text-center'>
            <Alert variant='info'>
              {formData.verificationType === 'email' ? (
                <>
                  <h4>Check Your Email</h4>
                  <p>We've sent a verification link to {email}</p>
                  <p>Please check your email and click the link to verify your account.</p>
                </>
              ) : (
                <>
                  <h4>Enter Verification Code</h4>
                  <p>We've sent a verification code to {phone}</p>
                  <Form.Group className='my-3'>
                    <Form.Control
                      type='text'
                      placeholder='Enter verification code'
                      value={formData.verificationCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verificationCode: e.target.value
                      }))}
                    />
                  </Form.Group>
                  <Button
                    variant='primary'
                    onClick={submitHandler}
                    disabled={formData.isLoading || !formData.verificationCode}
                  >
                    {formData.isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </>
              )}
            </Alert>
            <Button
              variant='link'
              onClick={() => setFormData(prev => ({
                ...prev,
                verificationSent: false
              }))}
              className='mt-3'
            >
              Back to Registration
            </Button>
          </div>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group className='my-3'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='name'
                placeholder='Enter name'
                value={firstName}
                onChange={handleInputChange}
                name='firstName'
                required
              />
            </Form.Group>

            <Form.Group className='my-3'>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                value={email}
                onChange={handleInputChange}
                name='email'
                required
              />
            </Form.Group>

            <Form.Group className='my-3'>
              <Form.Label>Phone Number (Optional)</Form.Label>
              <Form.Control
                type='tel'
                placeholder='+1234567890'
                value={phone}
                onChange={handleInputChange}
                name='phone'
              />
            </Form.Group>

            <Form.Group className='my-3'>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Enter password'
                value={password}
                onChange={handleInputChange}
                name='password'
                required
              />
            </Form.Group>

            <Form.Group className='my-3'>
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Confirm password'
                value={confirmPassword}
                onChange={handleInputChange}
                name='confirmPassword'
                required
              />
            </Form.Group>

            <Form.Group className='my-3'>
              <Form.Label>Verification Method</Form.Label>
              <div>
                <Form.Check
                  type='radio'
                  label='Email Verification'
                  name='verificationType'
                  checked={formData.verificationType === 'email'}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    verificationType: 'email'
                  }))}
                  className='mb-2'
                />
                <Form.Check
                  type='radio'
                  label='Phone Verification'
                  name='verificationType'
                  checked={formData.verificationType === 'phone'}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    verificationType: 'phone'
                  }))}
                  disabled={!phone}
                />
              </div>
            </Form.Group>

            <div id='recaptcha-container'></div>

            <Button
              type='submit'
              variant='primary'
              className='mt-3 w-100'
              disabled={formData.isLoading || (formData.verificationType === 'phone' && !phone)}
            >
              {formData.isLoading ? 'Registering...' : 'Register'}
            </Button>

            {/* Google Register Button */}
            <Button
              variant='outline-danger'
              className='mt-3 w-100 d-flex align-items-center justify-content-center'
              onClick={handleGoogleRegister}
              disabled={formData.isLoading}
              style={{ fontWeight: 600 }}
            >
              <FaGoogle className='me-2' />
              Register with Google
            </Button>

            {formData.isLoading && <Loader />}
          </Form>
        )}

        <Row className='py-3'>
          <Col className='text-center'>
            Already have an account?{' '}
            <Link to='/login'>Login</Link>
          </Col>
        </Row>
      </Card>

      {/* Terms Modal */}
      <Modal show={showTermsModal} onHide={() => setShowTermsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileContract className="me-2 text-primary" />
            Terms & Conditions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="terms-content">
            <h6>1. Account Registration</h6>
            <p>By creating an account with ProMayouf, you agree to provide accurate and complete information.</p>
            
            <h6>2. Use of Service</h6>
            <p>You agree to use our service only for lawful purposes and in accordance with these terms.</p>
            
            <h6>3. Privacy and Data Protection</h6>
            <p>Your privacy is important to us. Please review our Privacy Policy to understand how we protect your information.</p>
            
            <h6>4. Product Information and Orders</h6>
            <p>We strive to provide accurate product descriptions and pricing. All orders are subject to acceptance and availability.</p>
            
            <h6>5. Returns and Exchanges</h6>
            <p>Please refer to our return policy for detailed information about returns, exchanges, and refunds.</p>
            
            <h6>6. Account Termination</h6>
            <p>We reserve the right to terminate accounts that violate these terms or engage in fraudulent activities.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTermsModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setAcceptTerms(true);
              setShowTermsModal(false);
            }}
            style={{
              background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 100%)',
              border: 'none'
            }}
          >
            Accept Terms
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Privacy Modal */}
      <Modal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaShieldAlt className="me-2 text-primary" />
            Privacy Policy
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="terms-content">
            <h6>1. Information We Collect</h6>
            <p>We collect information you provide directly, such as name, email, and shipping addresses.</p>
            
            <h6>2. How We Use Your Information</h6>
            <p>We use your information to provide services, process orders, and communicate with you.</p>
            
            <h6>3. Information Sharing</h6>
            <p>We do not sell or rent your personal information. We may share information with service providers when required.</p>
            
            <h6>4. Data Security</h6>
            <p>We implement appropriate security measures to protect your information.</p>
            
            <h6>5. Your Rights</h6>
            <p>You can access, update, or delete your personal information at any time.</p>
            
            <h6>6. Contact Us</h6>
            <p>If you have questions about this Privacy Policy, please contact us at privacy@promayouf.com</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPrivacyModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setAcceptPrivacy(true);
              setShowPrivacyModal(false);
            }}
            style={{
              background: 'linear-gradient(135deg, #1a2c42 0%, #2c3e50 100%)',
              border: 'none'
            }}
          >
            Accept Privacy Policy
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .terms-content h6 {
          color: #1a2c42;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .terms-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
      `}</style>
    </FormContainer>
  );
};

export default RegisterScreen; 