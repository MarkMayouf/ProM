import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  InputGroup,
} from 'react-bootstrap';
import {
  FaMapMarkerAlt,
  FaSearch,
  FaPhone,
  FaClock,
  FaDirections,
} from 'react-icons/fa';
import Meta from '../components/Meta';

const StoreLocatorScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);

  // Sample store data - in a real app, this would come from an API
  const stores = [
    {
      id: 1,
      name: 'ProMayouf Flagship Store',
      address: '123 Fashion Avenue',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      phone: '(212) 555-0123',
      hours: {
        mon_fri: '10:00 AM - 9:00 PM',
        sat: '10:00 AM - 8:00 PM',
        sun: '11:00 AM - 6:00 PM',
      },
      coordinates: {
        lat: 40.7505,
        lng: -73.9934,
      },
    },
    {
      id: 2,
      name: 'ProMayouf Beverly Hills',
      address: '456 Luxury Lane',
      city: 'Beverly Hills',
      state: 'CA',
      zip: '90210',
      phone: '(310) 555-0123',
      hours: {
        mon_fri: '10:00 AM - 8:00 PM',
        sat: '10:00 AM - 7:00 PM',
        sun: '12:00 PM - 6:00 PM',
      },
      coordinates: {
        lat: 34.0674,
        lng: -118.4016,
      },
    },
    {
      id: 3,
      name: 'ProMayouf Chicago',
      address: '789 Michigan Avenue',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      phone: '(312) 555-0123',
      hours: {
        mon_fri: '10:00 AM - 8:00 PM',
        sat: '10:00 AM - 7:00 PM',
        sun: '11:00 AM - 6:00 PM',
      },
      coordinates: {
        lat: 41.8781,
        lng: -87.6298,
      },
    },
  ];

  const filteredStores = searchQuery
    ? stores.filter(
        (store) =>
          store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.zip.includes(searchQuery)
      )
    : stores;

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    // In a real app, you would center the map on the selected store
  };

  return (
    <>
      <Meta
        title="Store Locator | ProMayouf"
        description="Find a ProMayouf store near you. Visit us for expert tailoring, suit fittings, and personalized service."
      />

      <Container className="py-5">
        <Row className="justify-content-center mb-5">
          <Col md={8} className="text-center">
            <h1 className="mb-4">
              <FaMapMarkerAlt className="me-2" />
              Find a Store Near You
            </h1>
            <p className="text-muted mb-4">
              Visit us for expert tailoring, personalized fittings, and exceptional service.
            </p>
            <InputGroup className="store-search mb-4">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Enter city, state, or ZIP code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>

        <Row>
          <Col md={5} className="mb-4 mb-md-0">
            <div className="store-list">
              {filteredStores.map((store) => (
                <Card
                  key={store.id}
                  className={`store-card mb-3 ${
                    selectedStore?.id === store.id ? 'selected' : ''
                  }`}
                  onClick={() => handleStoreSelect(store)}
                >
                  <Card.Body>
                    <h3 className="h5 mb-2">{store.name}</h3>
                    <p className="mb-2">
                      {store.address}
                      <br />
                      {store.city}, {store.state} {store.zip}
                    </p>
                    <div className="store-details">
                      <div className="mb-2">
                        <FaPhone className="me-2 text-primary" />
                        {store.phone}
                      </div>
                      <div className="mb-2">
                        <FaClock className="me-2 text-primary" />
                        <small>
                          Mon-Fri: {store.hours.mon_fri}
                          <br />
                          Sat: {store.hours.sat}
                          <br />
                          Sun: {store.hours.sun}
                        </small>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          // In a real app, this would open directions in Google Maps
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lng}`
                          );
                        }}
                      >
                        <FaDirections className="me-1" /> Get Directions
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Col>
          <Col md={7}>
            <Card className="map-container">
              <Card.Body>
                <div className="text-center py-5">
                  <FaMapMarkerAlt size={40} className="text-primary mb-3" />
                  <h4>Store Map</h4>
                  <p className="text-muted">
                    Map integration would go here.<br />
                    In a real app, this would show an interactive map using Google Maps or a similar service.
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <h2 className="h4 mb-4">Need Additional Assistance?</h2>
            <p className="mb-4">
              Our customer service team is here to help you find the perfect store location.
            </p>
            <Button variant="primary" href="/help">
              Contact Us
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default StoreLocatorScreen; 