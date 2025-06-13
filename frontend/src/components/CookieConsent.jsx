import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { FaCookieBite, FaCheck, FaTimes, FaShieldAlt, FaChartBar, FaBullhorn } from 'react-icons/fa';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false
  });

  // Check local storage for cookie preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookiePreferences');
    
    if (!savedPreferences) {
      // No preferences set, show the banner
      setShowBanner(true);
    } else {
      // Preferences already set, load them
      setCookiePreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    setCookiePreferences(onlyNecessary);
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    setShowPreferences(false);
    setShowBanner(false);
  };

  const handlePreferenceChange = (type) => {
    setCookiePreferences({
      ...cookiePreferences,
      [type]: !cookiePreferences[type]
    });
  };

  // Manage cookies function that would be called in your app to check permissions
  const hasCookiePermission = (type) => {
    const savedPreferences = localStorage.getItem('cookiePreferences');
    if (!savedPreferences) return type === 'necessary';
    
    const preferences = JSON.parse(savedPreferences);
    return preferences[type] === true;
  };

  // Banner component
  const CookieBanner = () => (
    <div className="cookie-banner">
      <Container>
        <Row className="align-items-center py-3">
          <Col xs={12} md={1} className="text-center text-md-start mb-3 mb-md-0">
            <FaCookieBite size={32} className="text-primary" />
          </Col>
          <Col xs={12} md={7} className="mb-3 mb-md-0">
            <h5 className="mb-1">Privacy Notice</h5>
            <p className="mb-0">
              This website uses cookies to improve your experience, personalize content, and analyze site traffic. Essential cookies are required for site functionality, while additional cookies help us optimize our services. Please select your preferences or click "Accept All" to consent to all cookies.
            </p>
          </Col>
          <Col xs={12} md={4} className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-end">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowPreferences(true)}>
              Cookie Settings
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleRejectAll}>
              Essential Only
            </Button>
            <Button variant="primary" size="sm" onClick={handleAcceptAll}>
              Accept All Cookies
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );

  // Cookie preferences modal
  const PreferencesModal = () => (
    <Modal show={showPreferences} onHide={() => setShowPreferences(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cookie Preferences</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          MyStore uses cookies to enhance your browsing experience and provide tailored services. Below, you can customize your cookie preferences. Please note that essential cookies cannot be disabled as they are required for the website to function properly.
        </p>
        
        <Form>
          <div className="cookie-option mb-3 pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <FaShieldAlt className="text-success me-2" />
                <h6 className="mb-0">Necessary Cookies</h6>
              </div>
              <Form.Check 
                type="switch"
                checked={cookiePreferences.necessary}
                disabled
                className="cookie-switch"
              />
            </div>
            <p className="text-muted small mb-0">
              These cookies are essential for core website functionality and cannot be disabled. They enable basic features like page navigation, security, and network management.
            </p>
          </div>
          
          <div className="cookie-option mb-3 pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <FaCheck className="text-primary me-2" />
                <h6 className="mb-0">Functional Cookies</h6>
              </div>
              <Form.Check 
                type="switch"
                checked={cookiePreferences.functional}
                onChange={() => handlePreferenceChange('functional')}
                className="cookie-switch"
              />
            </div>
            <p className="text-muted small mb-0">
              These cookies allow the website to remember choices you make (such as your preferred language or region) and provide enhanced, personalized features to improve your experience.
            </p>
          </div>
          
          <div className="cookie-option mb-3 pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <FaChartBar className="text-info me-2" />
                <h6 className="mb-0">Analytics Cookies</h6>
              </div>
              <Form.Check 
                type="switch"
                checked={cookiePreferences.analytics}
                onChange={() => handlePreferenceChange('analytics')}
                className="cookie-switch"
              />
            </div>
            <p className="text-muted small mb-0">
              These cookies collect information about how you use our website, which pages you visit, and any errors that occur. The data is aggregated and anonymous, helping us improve site performance and user experience.
            </p>
          </div>
          
          <div className="cookie-option">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <FaBullhorn className="text-warning me-2" />
                <h6 className="mb-0">Marketing Cookies</h6>
              </div>
              <Form.Check 
                type="switch"
                checked={cookiePreferences.marketing}
                onChange={() => handlePreferenceChange('marketing')}
                className="cookie-switch"
              />
            </div>
            <p className="text-muted small mb-0">
              These cookies track your browsing habits to deliver advertising that is more relevant to your interests. They are typically placed by third-party advertising networks with our permission and help us measure marketing effectiveness.
            </p>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowPreferences(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSavePreferences}>
          Save Settings
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Export the hasCookiePermission method so it can be used elsewhere
  CookieConsent.hasCookiePermission = hasCookiePermission;

  return (
    <>
      {showBanner && <CookieBanner />}
      <PreferencesModal />
      
      <style jsx="true">{`
        .cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #fff;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          z-index: 1050;
          border-top: 1px solid #e9ecef;
        }
        
        .cookie-switch .form-check-input {
          width: 3em;
        }
        
        .cookie-switch .form-check-input:checked {
          background-color: #28a745;
          border-color: #28a745;
        }
      `}</style>
    </>
  );
};

export default CookieConsent; 