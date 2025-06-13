import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Nav,
  Container,
  Badge,
  Dropdown,
  Button,
  Form,
  InputGroup,
  Row,
  Col,
} from 'react-bootstrap';
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaSearch,
  FaBars,
  FaAngleDown,
  FaPhone,
  FaComments,
  FaUserCog,
  FaChartBar,
  FaBox,
  FaList,
  FaTags,
  FaUsers,
  FaTruck,
  FaRobot,
  FaTag,
  FaTshirt,
} from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../services/authService';
import { resetCart } from '../slices/cartSlice';
import logo from '../assets/logo.png';
import '../assets/styles/home.css';
import SizeRecommenderChatbot from './SizeRecommenderChatbot';
import toast from 'react-hot-toast';

const Header = () => {
  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoutHandler = async () => {
    try {
      const result = await signOutUser();
      if (result.success) {
        // Firebase auth state change will automatically clear Redux store via AuthContext
        dispatch(resetCart());
        toast.success('Successfully signed out!');
        navigate('/');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to sign out');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search initiated with query:', searchQuery.trim());
      navigate(`/search/${searchQuery.trim()}`);
      setSearchQuery('');
    } else {
      console.log('Empty search query - no navigation');
    }
  };

  const handleSizeRecommendation = (recommendation) => {
    // Handle the size recommendation
    console.log('Size recommendation:', recommendation);
  };

  return (
    <header className='site-header'>
      {/* Top utility bar */}
      <div className='top-bar'>
        <Container>
          <Row className='align-items-center'>
            <Col xs={4} md={4} className='d-flex align-items-center'>
              <FaPhone className='me-2' size={14} />
              <span className='me-4'>1-800-PROMAYOUF</span>
              <LinkContainer to='/store-locator'>
                <a className='text-white text-decoration-none me-3'>
                  Store Locator
                </a>
              </LinkContainer>
              <LinkContainer to='/help'>
                <a className='text-white text-decoration-none'>
                  Help
                </a>
              </LinkContainer>
            </Col>

            {/* Center Logo Column */}
            <Col xs={4} md={4} className='text-center'>
              <LinkContainer to='/'>
                <div className='d-inline-flex align-items-center mx-auto'>
                  <img
                    src={logo}
                    alt='ProMayouf'
                    className='me-1'
                    style={{
                      height: '28px',
                      filter: 'brightness(0) invert(1)',
                    }}
                  />
                  <div className='text-white fw-bold' style={{ letterSpacing: '0.5px' }}>
                    PROMAYOUF
                  </div>
                </div>
              </LinkContainer>
            </Col>

            {/* Right side - Auth links */}
            <Col xs={4} md={4} className='text-end'>
              {userInfo ? (
                <Dropdown>
                  <Dropdown.Toggle variant='link' className='text-white text-decoration-none'>
                    {userInfo.name}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <LinkContainer to='/profile'>
                      <Dropdown.Item>Profile</Dropdown.Item>
                    </LinkContainer>
                    <LinkContainer to='/my-purchases'>
                      <Dropdown.Item>My Purchases</Dropdown.Item>
                    </LinkContainer>
                    <LinkContainer to='/track-order'>
                      <Dropdown.Item>Track Order</Dropdown.Item>
                    </LinkContainer>
                    {userInfo.isAdmin && (
                      <>
                        <Dropdown.Divider />
                        <LinkContainer to='/admin/dashboard'>
                          <Dropdown.Item>
                            <FaChartBar className='me-2' /> Admin
                          </Dropdown.Item>
                        </LinkContainer>
                        <LinkContainer to='/admin/productlist'>
                          <Dropdown.Item>
                            <FaBox className='me-2' /> Products
                          </Dropdown.Item>
                        </LinkContainer>
                        <LinkContainer to='/admin/orderlist'>
                          <Dropdown.Item>
                            <FaList className='me-2' /> Orders
                          </Dropdown.Item>
                        </LinkContainer>
                        <LinkContainer to='/admin/userlist'>
                          <Dropdown.Item>
                            <FaUsers className='me-2' /> Users
                          </Dropdown.Item>
                        </LinkContainer>
                        <LinkContainer to='/admin/marketing'>
                          <Dropdown.Item>
                            <FaTag className='me-2' /> Marketing
                          </Dropdown.Item>
                        </LinkContainer>
                      </>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={logoutHandler}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <>
                  <LinkContainer to='/login'>
                    <a className='text-white text-decoration-none me-3'>Sign In</a>
                  </LinkContainer>
                  <LinkContainer to='/register'>
                    <a className='text-white text-decoration-none'>Create Account</a>
                  </LinkContainer>
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main navbar */}
      <Navbar
        bg='white'
        variant='light'
        expand='lg'
        className={`py-3 ${isScrolled ? 'scrolled' : ''}`}
      >
        <Container>
          {/* Mobile toggle and icons for small screens */}
          <div className='d-flex d-lg-none align-items-center'>
            <Button
              variant='link'
              className='nav-icon px-2'
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <FaBars size={20} color='#212529' />
            </Button>
            <LinkContainer to='/'>
              <img
                src={logo}
                alt='ProMayouf'
                style={{ height: '30px' }}
                className='ms-2'
              />
            </LinkContainer>
          </div>

          {/* Left side navigation - visible only on large screens */}
          <Nav className='d-none d-lg-flex'>
            <LinkContainer to='/category/suits'>
              <Nav.Link className='nav-link-josbank'>Suits</Nav.Link>
            </LinkContainer>
            <LinkContainer to='/shirts'>
              <Nav.Link className='nav-link-josbank'>Shirts</Nav.Link>
            </LinkContainer>
            <LinkContainer to='/category/shoes'>
              <Nav.Link className='nav-link-josbank'>Shoes</Nav.Link>
            </LinkContainer>

            {/* Accessories Dropdown */}
            <LinkContainer to='/category/accessories
'>
              <Nav.Link className='nav-link-josbank'> Accessories
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to='/sale'>

            <Nav.Link className="nav-link-josbank" style={{ color: 'red', fontWeight: 'bold' }}>
  Sale
</Nav.Link>

            </LinkContainer>
          </Nav>

          {/* Right side icons */}
          <div className='d-flex align-items-center ms-auto'>
            {/* Search */}
            <Form onSubmit={handleSearch} className='d-none d-lg-flex me-3'>
              <InputGroup>
                <Form.Control
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant='outline-secondary' type='submit'>
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            {/* Wishlist */}
            <LinkContainer to='/wishlist'>
              <Button variant='link' className='nav-icon px-2 position-relative'>
                <FaHeart size={20} color='#212529' />
                {wishlistItems.length > 0 && (
                  <Badge
                    pill
                    bg='danger'
                    className='position-absolute top-0 end-0 translate-middle'
                  >
                    {wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </LinkContainer>

            {/* Cart */}
            <LinkContainer to='/cart'>
              <Button variant='link' className='nav-icon px-2 position-relative'>
                <FaShoppingCart size={20} color='#212529' />
                {cartItems.length > 0 && (
                  <Badge
                    pill
                    bg='danger'
                    className='position-absolute top-0 end-0 translate-middle'
                  >
                    {cartItems.reduce((a, c) => a + c.qty, 0)}
                  </Badge>
                )}
              </Button>
            </LinkContainer>

            {/* Chat */}
            <Button
              variant='link'
              className='nav-icon px-2'
              onClick={() => setChatbotOpen(true)}
            >
              <FaRobot size={20} color='#212529' />
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className='mobile-menu'>
          <Container>
            <Nav className='flex-column'>
              <LinkContainer to='/category/suits'>
                <Nav.Link>Suits</Nav.Link>
              </LinkContainer>
              <LinkContainer to='/shirts'>
                <Nav.Link>Shirts</Nav.Link>
              </LinkContainer>
              <LinkContainer to='/category/shoes'>
                <Nav.Link>Shoes</Nav.Link>
              </LinkContainer>
              <LinkContainer to='/category/accessories'>
                <Nav.Link>Accessories</Nav.Link>
              </LinkContainer>
              <div className="ps-3 py-2">
                <LinkContainer to={{ pathname: '/category/accessories', search: '?subcategory=ties' }}>
                  <Nav.Link className="mobile-submenu-item">Ties Collection</Nav.Link>
                </LinkContainer>
                <LinkContainer to={{ pathname: '/category/accessories', search: '?subcategory=belts' }}>
                  <Nav.Link className="mobile-submenu-item">Belts</Nav.Link>
                </LinkContainer>
                <LinkContainer to={{ pathname: '/category/accessories', search: '?subcategory=cufflinks' }}>
                  <Nav.Link className="mobile-submenu-item">Cufflinks</Nav.Link>
                </LinkContainer>
              </div>
              <LinkContainer to='/sale'>
                <Nav.Link className='text-danger'>Sale</Nav.Link>
              </LinkContainer>
            </Nav>
          </Container>
        </div>
      )}

      {/* Chatbot */}
      <SizeRecommenderChatbot
        onRecommendationComplete={handleSizeRecommendation}
        productType='General'
        open={chatbotOpen}
        setOpen={setChatbotOpen}
      />
    </header>
  );
};

export default Header;
