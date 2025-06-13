import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaPinterest,
  FaYoutube,
  FaCreditCard,
  FaLock,
  FaTruck,
  FaArrowRight,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcDiscover,
  FaCcPaypal,
} from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Newsletter subscription */}
      <section className='newsletter-section py-5 bg-light'>
        <Container>
          <Row className='justify-content-center'>
            <Col md={8} lg={6} className='text-center'>
              <h4 className='mb-2'>Subscribe to Our Newsletter</h4>
              <p className='text-muted mb-4'>
                Get exclusive offers, style tips, and more straight to your
                inbox.
              </p>
              <Form>
                <InputGroup className='mb-3'>
                  <Form.Control
                    placeholder='Your email address'
                    aria-label='Email address'
                    className='py-2'
                  />
                  <Button variant='dark' type='submit' className='px-4'>
                    Subscribe <FaArrowRight className='ms-2' />
                  </Button>
                </InputGroup>
                <Form.Text className='text-muted'>
                  By subscribing, you agree to our Privacy Policy and Terms of
                  Service.
                </Form.Text>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main footer */}
      <footer className='bg-white border-top'>
        <Container className='py-5'>
          <Row className='g-4'>
            <Col md={3} sm={6}>
              <h5 className='fw-bold mb-3'>Shopping</h5>
              <ul className='list-unstyled footer-links'>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>Suits</span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>Shoes</span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Accessories
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      New Arrivals
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Sales & Offers
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Gift Cards
                  </span>
                </li>
              </ul>
            </Col>

            <Col md={3} sm={6}>
              <h5 className='fw-bold mb-3'>Customer Service</h5>
              <ul className='list-unstyled footer-links'>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Contact Us
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      FAQs
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Track Your Order
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Returns & Exchanges
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Shipping Information
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Sizing Guide
                  </span>
                </li>
              </ul>
            </Col>

            <Col md={3} sm={6}>
              <h5 className='fw-bold mb-3'>About ProMayouf</h5>
              <ul className='list-unstyled footer-links'>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Our Story
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Careers
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Corporate Responsibility
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Store Locator
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Style Blog
                  </span>
                </li>
                <li className='mb-2'>
                  <span className='text-decoration-none text-secondary footer-link-disabled'>
                      Press Releases
                  </span>
                </li>
              </ul>
            </Col>

            <Col md={3} sm={6}>
              <h5 className='fw-bold mb-3'>Contact Us</h5>
              <ul className='list-unstyled footer-info'>
                <li className='mb-3'>
                  <FaPhone className='me-2 text-dark' />
                  <span className='text-secondary'>1-800-PROMAYOUF</span>
                </li>
                <li className='mb-3'>
                  <FaEnvelope className='me-2 text-dark' />
                  <span className='text-secondary'>
                    support@promayoufsuits.com
                  </span>
                </li>
                <li className='mb-3'>
                  <FaMapMarkerAlt className='me-2 text-dark' />
                  <span className='text-secondary'>
                    123 Fashion Street, New York, NY 10001
                  </span>
                </li>
              </ul>

              <h5 className='fw-bold mb-3 mt-4'>Follow Us</h5>
              <div className='social-icons'>
                <a
                  href='https://facebook.com'
                  className='me-3 text-dark'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FaFacebook size={20} />
                </a>
                <a
                  href='https://twitter.com'
                  className='me-3 text-dark'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FaTwitter size={20} />
                </a>
                <a
                  href='https://instagram.com'
                  className='me-3 text-dark'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FaInstagram size={20} />
                </a>
                <a
                  href='https://pinterest.com'
                  className='me-3 text-dark'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FaPinterest size={20} />
                </a>
                <a
                  href='https://youtube.com'
                  className='text-dark'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FaYoutube size={20} />
                </a>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Secondary footer */}
        <div className='py-4 border-top bg-light'>
          <Container>
            <Row className='align-items-center'>
              <Col md={4} className='mb-3 mb-md-0'>
                <div className='d-flex gap-3 payment-icons'>
                  <FaCcVisa size={32} className="text-primary" />
                  <FaCcMastercard size={32} className="text-danger" />
                  <FaCcAmex size={32} className="text-info" />
                  <FaCcDiscover size={32} className="text-warning" />
                  <FaCcPaypal size={32} className="text-primary" />
                </div>
              </Col>
              <Col md={4} className='text-center mb-3 mb-md-0'>
                <div className='d-flex flex-column flex-md-row gap-md-3 justify-content-center'>
                  <div className='d-flex align-items-center justify-content-center'>
                    <FaLock className='me-2 text-success' />
                    <span className='small'>Secure Shopping</span>
                  </div>
                  <div className='d-flex align-items-center justify-content-center'>
                    <FaTruck className='me-2 text-success' />
                    <span className='small'>Free Shipping Over $75</span>
                  </div>
                </div>
              </Col>
              <Col md={4} className='text-md-end'>
                <p className='mb-0 small text-secondary'>
                  Copyright &copy; {currentYear} Mayouf Suits. All rights
                  reserved.
                </p>
              </Col>
            </Row>
          </Container>
        </div>

        {/* Legal links */}
        <div className='py-3 bg-dark text-center'>
          <Container>
            <Row>
              <Col>
                <div className='d-flex flex-wrap justify-content-center'>
                  <span className='text-white text-decoration-none mx-2 small footer-link-disabled'>
                      Privacy Policy
                  </span>
                  <span className='text-white mx-1'>|</span>
                  <span className='text-white text-decoration-none mx-2 small footer-link-disabled'>
                      Terms of Service
                  </span>
                  <span className='text-white mx-1'>|</span>
                  <span className='text-white text-decoration-none mx-2 small footer-link-disabled'>
                      Accessibility
                  </span>
                  <span className='text-white mx-1'>|</span>
                  <span className='text-white text-decoration-none mx-2 small footer-link-disabled'>
                      Legal Information
                  </span>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </footer>
    </>
  );
};

export default Footer;

<style jsx="true">{`
  .payment-icons {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .payment-icons svg {
    transition: transform 0.2s ease;
  }

  .payment-icons svg:hover {
    transform: translateY(-2px);
  }

  .social-icons a {
    transition: all 0.2s ease;
  }

  .social-icons a:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }

  .footer-links a {
    transition: all 0.2s ease;
  }

  .footer-links a:hover {
    color: #000 !important;
    padding-left: 5px;
  }

  .footer-link-disabled {
    cursor: default !important;
    opacity: 0.7;
  }

  .footer-link-disabled:hover {
    color: inherit !important;
    padding-left: 0 !important;
    transform: none !important;
  }

  .footer-info li {
    transition: all 0.2s ease;
  }

  .footer-info li:hover {
    transform: translateX(5px);
  }
`}</style>
