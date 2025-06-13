import { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import { toast } from 'react-toastify';
import Meta from '../components/Meta';

const ResetPasswordScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show information about Firebase password reset
    toast.info('Password reset is handled through your email. Please check your inbox for the reset link.');
  }, []);

  return (
    <FormContainer>
      <Meta title='Password Reset' />
      <div className="text-center">
        <h1>Password Reset</h1>
        <div className="mb-4">
          <i className="fas fa-envelope-open-text fa-3x text-primary mb-3"></i>
          <p className="lead">
            Password reset is handled through email
          </p>
          <p className="text-muted">
            To reset your password:
          </p>
          <ol className="text-start text-muted">
            <li>Go to the login page</li>
            <li>Click "Forgot Password?"</li>
            <li>Enter your email address</li>
            <li>Check your email for the reset link</li>
            <li>Follow the link to create a new password</li>
          </ol>
          <p className="text-muted mt-3">
            The reset link will take you to a secure page where you can set your new password.
          </p>
        </div>

        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
          <Button
            variant="primary"
            onClick={() => navigate('/forgot-password')}
            className="me-md-2"
          >
            Request Password Reset
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </FormContainer>
  );
};

export default ResetPasswordScreen;
