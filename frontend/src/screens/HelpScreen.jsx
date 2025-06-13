import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Accordion,
  Card,
  Button,
  Form,
  InputGroup,
} from 'react-bootstrap';
import {
  FaQuestionCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSearch,
  FaTruck,
  FaExchangeAlt,
  FaRuler,
  FaCreditCard,
} from 'react-icons/fa';
import Meta from '../components/Meta';

const HelpScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      title: 'Orders & Shipping',
      icon: FaTruck,
      faqs: [
        {
          q: 'How can I track my order?',
          a: 'You can track your order by logging into your account and visiting the Order History section. Alternatively, use the tracking number provided in your shipping confirmation email.',
        },
        {
          q: 'What are your shipping options?',
          a: 'We offer standard shipping (5-7 business days), express shipping (2-3 business days), and next-day delivery for select locations.',
        },
      ],
    },
    {
      title: 'Returns & Exchanges',
      icon: FaExchangeAlt,
      faqs: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 30-day return policy for unworn items in original condition with tags attached. Custom altered items cannot be returned unless defective.',
        },
        {
          q: 'How do I initiate a return?',
          a: 'Log into your account, go to Order History, select the item you wish to return, and follow the return instructions. You can also contact our customer service for assistance.',
        },
      ],
    },
    {
      title: 'Sizing & Alterations',
      icon: FaRuler,
      faqs: [
        {
          q: 'How do I find my correct size?',
          a: 'Use our Size Guide available on product pages or chat with our AI Size Assistant. For the most accurate fit, visit one of our stores for professional measurements.',
        },
        {
          q: 'What alterations do you offer?',
          a: 'We offer comprehensive alteration services including hem adjustment, waist adjustment, sleeve length, and more. Alterations are complimentary for full-price suits.',
        },
      ],
    },
    {
      title: 'Payment & Promotions',
      icon: FaCreditCard,
      faqs: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards, PayPal, Apple Pay, and Google Pay. We also offer financing options through Affirm.',
        },
        {
          q: 'How do I apply a promo code?',
          a: 'Enter your promo code in the designated field during checkout. The discount will be automatically applied to eligible items.',
        },
      ],
    },
  ];

  const filteredFAQs = searchQuery
    ? faqCategories.map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.faqs.length > 0)
    : faqCategories;

  return (
    <>
      <Meta
        title="Help Center | ProMayouf"
        description="Get help with your ProMayouf orders, returns, sizing, and more. Find answers to frequently asked questions and contact our customer service team."
      />
      
      <Container className="py-5">
        <Row className="justify-content-center mb-5">
          <Col md={8} className="text-center">
            <h1 className="mb-4">
              <FaQuestionCircle className="me-2" />
              How Can We Help You?
            </h1>
            <InputGroup className="mb-4">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <FaPhone className="text-primary mb-3" size={30} />
                <h3>Call Us</h3>
                <p className="mb-3">1-800-PROMAYOUF</p>
                <p className="text-muted small">
                  Mon-Fri: 9AM-9PM EST<br />
                  Sat-Sun: 10AM-6PM EST
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <FaEnvelope className="text-primary mb-3" size={30} />
                <h3>Email Us</h3>
                <p className="mb-3">support@promayouf.com</p>
                <p className="text-muted small">
                  We typically respond within<br />
                  24 business hours
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <FaMapMarkerAlt className="text-primary mb-3" size={30} />
                <h3>Visit Us</h3>
                <p className="mb-3">Find a Store Near You</p>
                <Button variant="outline-primary" href="/store-locator">
                  Store Locator
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col>
            <h2 className="mb-4">Frequently Asked Questions</h2>
            {filteredFAQs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-4">
                <h3 className="h5 mb-3">
                  <category.icon className="me-2" />
                  {category.title}
                </h3>
                <Accordion>
                  {category.faqs.map((faq, faqIndex) => (
                    <Accordion.Item
                      key={faqIndex}
                      eventKey={`${categoryIndex}-${faqIndex}`}
                    >
                      <Accordion.Header>{faq.q}</Accordion.Header>
                      <Accordion.Body>{faq.a}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            ))}
          </Col>
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <p className="mb-4">
              Still need help? Our customer service team is here for you.
            </p>
            <Button variant="primary" href="mailto:support@promayouf.com">
              Contact Support
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HelpScreen; 