import { useState } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import Meta from '../components/Meta';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (err) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to send password reset email';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <FormContainer>
        <Meta title='Reset Email Sent' />
        <Card className='p-4 shadow-sm'>
          <div className="text-center">
            <h1>Check Your Email</h1>
            <p className="mb-4">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="text-muted mb-4">
              Please check your email and follow the link to reset your password.
              If you don't see the email, check your spam folder.
            </p>
            <Button
              variant="outline-primary"
              onClick={() => setEmailSent(false)}
              className="me-2"
            >
              Send Another Email
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <Meta title='Forgot Password' />
      <Card className='p-4 shadow-sm'>
        <h1 className='text-center mb-4'>Forgot Password</h1>
        <p className="text-muted mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <Form onSubmit={submitHandler}>
          <Form.Group className='my-3'>
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type='email'
              placeholder='Enter email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            type='submit'
            variant='primary'
            className='mt-2 w-100'
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </Button>

          {isLoading && <Loader />}
        </Form>

        <Row className='py-3'>
          <Col className='text-center'>
            Remember your password?{' '}
            <Button
              variant='link'
              className='p-0'
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Col>
        </Row>
      </Card>
    </FormContainer>
  );
};

export default ForgotPasswordScreen;
