import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaGift, FaTag, FaPercent } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SpecialOffers = () => {
  const offers = [
    {
      id: 1,
      icon: <FaGift />,
      title: 'Buy 2 Get 1 Free',
      description: 'On selected premium suits',
      link: '/category/suits?offer=buy2get1',
    },
    {
      id: 2,
      icon: <FaTag />,
      title: 'Wedding Collection',
      description: 'Up to 20% off on wedding suits',
      link: '/category/wedding-collection',
    },
    {
      id: 3,
      icon: <FaPercent />,
      title: 'Summer Clearance',
      description: 'Extra 30% off on summer collection',
      link: '/category/summer-collection',
    },
  ];

  return (
    <section className='special-offer-section'>
      <Container>
        <h2 className='text-center mb-4'>Special Offers</h2>
        <Row>
          {offers.map((offer) => (
            <Col key={offer.id} md={4}>
              <Link to={offer.link} className='text-decoration-none'>
                <Card className='special-offer-card'>
                  <Card.Body>
                    <div className='special-offer-icon'>{offer.icon}</div>
                    <h4>{offer.title}</h4>
                    <p className='mb-0'>{offer.description}</p>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default SpecialOffers;
