import React from 'react';
import { Table, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaInfoCircle, FaRuler } from 'react-icons/fa';

const SizeChart = ({ category = 'Suits', className = '' }) => {
  const sizeCharts = {
    Suits: {
      title: 'Suit Size Chart',
      description: 'All measurements are in inches. Sizes are based on chest measurement.',
      headers: ['Size', 'Chest', 'Waist', 'Hip', 'Shoulder', 'Sleeve Length'],
      data: [
        { size: '36R', chest: '34-36', waist: '28-30', hip: '36-38', shoulder: '17.5', sleeve: '32-33' },
        { size: '38R', chest: '36-38', waist: '30-32', hip: '38-40', shoulder: '18', sleeve: '32.5-33.5' },
        { size: '40R', chest: '38-40', waist: '32-34', hip: '40-42', shoulder: '18.5', sleeve: '33-34' },
        { size: '42R', chest: '40-42', waist: '34-36', hip: '42-44', shoulder: '19', sleeve: '33.5-34.5' },
        { size: '44R', chest: '42-44', waist: '36-38', hip: '44-46', shoulder: '19.5', sleeve: '34-35' },
        { size: '46R', chest: '44-46', waist: '38-40', hip: '46-48', shoulder: '20', sleeve: '34.5-35.5' },
        { size: '48R', chest: '46-48', waist: '40-42', hip: '48-50', shoulder: '20.5', sleeve: '35-36' },
        { size: '50R', chest: '48-50', waist: '42-44', hip: '50-52', shoulder: '21', sleeve: '35.5-36.5' }
      ],
      lengthGuide: {
        'R (Regular)': 'For men 5\'8" to 6\'0" tall',
        'S (Short)': 'For men 5\'4" to 5\'7" tall',
        'L (Long)': 'For men 6\'1" to 6\'4" tall',
        'XL (Extra Long)': 'For men 6\'5" and taller'
      }
    },
    Tuxedos: {
      title: 'Tuxedo Size Chart',
      description: 'Tuxedo sizing follows the same measurements as suits.',
      headers: ['Size', 'Chest', 'Waist', 'Hip', 'Shoulder', 'Sleeve Length'],
      data: [
        { size: '36R', chest: '34-36', waist: '28-30', hip: '36-38', shoulder: '17.5', sleeve: '32-33' },
        { size: '38R', chest: '36-38', waist: '30-32', hip: '38-40', shoulder: '18', sleeve: '32.5-33.5' },
        { size: '40R', chest: '38-40', waist: '32-34', hip: '40-42', shoulder: '18.5', sleeve: '33-34' },
        { size: '42R', chest: '40-42', waist: '34-36', hip: '42-44', shoulder: '19', sleeve: '33.5-34.5' },
        { size: '44R', chest: '42-44', waist: '36-38', hip: '44-46', shoulder: '19.5', sleeve: '34-35' },
        { size: '46R', chest: '44-46', waist: '38-40', hip: '46-48', shoulder: '20', sleeve: '34.5-35.5' },
        { size: '48R', chest: '46-48', waist: '40-42', hip: '48-50', shoulder: '20.5', sleeve: '35-36' }
      ],
      lengthGuide: {
        'R (Regular)': 'For men 5\'8" to 6\'0" tall',
        'S (Short)': 'For men 5\'4" to 5\'7" tall',
        'L (Long)': 'For men 6\'1" to 6\'4" tall'
      }
    },
    Blazers: {
      title: 'Blazer Size Chart',
      description: 'Blazer sizing is similar to suits but may have a more relaxed fit.',
      headers: ['Size', 'Chest', 'Waist', 'Shoulder', 'Sleeve Length'],
      data: [
        { size: '36R', chest: '34-36', waist: '30-32', shoulder: '17.5', sleeve: '32-33' },
        { size: '38R', chest: '36-38', waist: '32-34', shoulder: '18', sleeve: '32.5-33.5' },
        { size: '40R', chest: '38-40', waist: '34-36', shoulder: '18.5', sleeve: '33-34' },
        { size: '42R', chest: '40-42', waist: '36-38', shoulder: '19', sleeve: '33.5-34.5' },
        { size: '44R', chest: '42-44', waist: '38-40', shoulder: '19.5', sleeve: '34-35' },
        { size: '46R', chest: '44-46', waist: '40-42', shoulder: '20', sleeve: '34.5-35.5' },
        { size: '48R', chest: '46-48', waist: '42-44', shoulder: '20.5', sleeve: '35-36' }
      ]
    },
    'Dress Shirts': {
      title: 'Dress Shirt Size Chart',
      description: 'Shirt sizes are based on neck and sleeve measurements.',
      headers: ['Size', 'Neck', 'Chest', 'Sleeve Length', 'Body Length'],
      data: [
        { size: 'S (14.5)', neck: '14.5', chest: '38-40', sleeve: '32-33', body: '30' },
        { size: 'M (15.5)', neck: '15.5', chest: '40-42', sleeve: '33-34', body: '31' },
        { size: 'L (16.5)', neck: '16.5', chest: '42-44', sleeve: '34-35', body: '32' },
        { size: 'XL (17.5)', neck: '17.5', chest: '44-46', sleeve: '35-36', body: '33' },
        { size: 'XXL (18.5)', neck: '18.5', chest: '46-48', sleeve: '36-37', body: '34' }
      ]
    },
    Shoes: {
      title: 'Shoe Size Chart',
      description: 'International shoe size conversion chart.',
      headers: ['US Size', 'EU Size', 'UK Size', 'Foot Length (inches)', 'Foot Length (cm)'],
      data: [
        { size: '7', eu: '40', uk: '6', inches: '9.25', cm: '23.5' },
        { size: '7.5', eu: '40.5', uk: '6.5', inches: '9.5', cm: '24.1' },
        { size: '8', eu: '41', uk: '7', inches: '9.625', cm: '24.4' },
        { size: '8.5', eu: '41.5', uk: '7.5', inches: '9.75', cm: '24.8' },
        { size: '9', eu: '42', uk: '8', inches: '9.9375', cm: '25.4' },
        { size: '9.5', eu: '42.5', uk: '8.5', inches: '10.125', cm: '25.7' },
        { size: '10', eu: '43', uk: '9', inches: '10.25', cm: '26' },
        { size: '10.5', eu: '43.5', uk: '9.5', inches: '10.4375', cm: '26.7' },
        { size: '11', eu: '44', uk: '10', inches: '10.5625', cm: '27' },
        { size: '11.5', eu: '44.5', uk: '10.5', inches: '10.75', cm: '27.3' },
        { size: '12', eu: '45', uk: '11', inches: '10.9375', cm: '27.9' },
        { size: '13', eu: '46', uk: '12', inches: '11.25', cm: '28.6' }
      ]
    }
  };

  const currentChart = sizeCharts[category] || sizeCharts.Suits;

  const measurementTips = {
    Suits: [
      'Measure your chest around the fullest part, keeping the tape level',
      'Waist measurement should be taken at your natural waistline',
      'For the most accurate fit, have someone help you measure',
      'Wear only undergarments when measuring'
    ],
    Tuxedos: [
      'Tuxedo fit should be slightly more fitted than a regular suit',
      'Consider professional tailoring for formal events',
      'Measure over a dress shirt for accurate sizing'
    ],
    Blazers: [
      'Blazers can have a more relaxed fit than suits',
      'Consider the intended use - business vs casual',
      'Shoulder fit is the most important measurement'
    ],
    'Dress Shirts': [
      'Neck measurement: measure around the base of your neck',
      'Sleeve length: from center back neck to wrist',
      'Allow for one finger of room in the neck measurement'
    ],
    Shoes: [
      'Measure your feet in the evening when they are largest',
      'Measure both feet and use the larger measurement',
      'Consider the type of socks you\'ll wear with the shoes'
    ]
  };

  return (
    <div className={`size-chart ${className}`}>
      <Card>
        <Card.Header className="bg-primary text-white">
          <div className="d-flex align-items-center">
            <FaRuler className="me-2" />
            <h5 className="mb-0">{currentChart.title}</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-4">{currentChart.description}</p>
          
          {/* Size Table */}
          <div className="table-responsive mb-4">
            <Table striped bordered hover className="size-table">
              <thead className="table-dark">
                <tr>
                  {currentChart.headers.map((header, index) => (
                    <th key={index} className="text-center">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentChart.data.map((row, index) => (
                  <tr key={index}>
                    <td className="text-center fw-bold">
                      <Badge bg="primary">{row.size || row.size}</Badge>
                    </td>
                    {Object.entries(row).slice(1).map(([key, value], cellIndex) => (
                      <td key={cellIndex} className="text-center">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Length Guide for Suits/Tuxedos */}
          {currentChart.lengthGuide && (
            <Row className="mb-4">
              <Col md={12}>
                <Card className="bg-light">
                  <Card.Header>
                    <h6 className="mb-0">Length Guide</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {Object.entries(currentChart.lengthGuide).map(([length, description], index) => (
                        <Col md={6} key={index} className="mb-2">
                          <div className="d-flex align-items-center">
                            <Badge bg="secondary" className="me-2">{length}</Badge>
                            <span className="small">{description}</span>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Measurement Tips */}
          <Alert variant="info">
            <div className="d-flex align-items-start">
              <FaInfoCircle className="me-2 mt-1" />
              <div>
                <h6 className="mb-2">Measurement Tips</h6>
                <ul className="mb-0">
                  {(measurementTips[category] || measurementTips.Suits).map((tip, index) => (
                    <li key={index} className="mb-1">{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Alert>

          {/* Fit Guide */}
          <Card className="mt-4">
            <Card.Header>
              <h6 className="mb-0">Fit Guide</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="fit-type mb-3">
                    <h6 className="text-primary">Slim Fit</h6>
                    <p className="small text-muted mb-0">
                      Tailored close to the body with minimal excess fabric. 
                      Best for lean builds.
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="fit-type mb-3">
                    <h6 className="text-primary">Regular Fit</h6>
                    <p className="small text-muted mb-0">
                      Classic fit with comfortable room through the chest and waist. 
                      Most versatile option.
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="fit-type mb-3">
                    <h6 className="text-primary">Relaxed Fit</h6>
                    <p className="small text-muted mb-0">
                      Generous cut with extra room for comfort. 
                      Ideal for broader builds.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      <style jsx="true">{`
        .size-chart .size-table th {
          background-color: #343a40;
          color: white;
          font-weight: 600;
          padding: 0.75rem 0.5rem;
        }
        
        .size-chart .size-table td {
          padding: 0.75rem 0.5rem;
          vertical-align: middle;
        }
        
        .size-chart .size-table tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.1);
        }
        
        .fit-type h6 {
          border-bottom: 2px solid #007bff;
          padding-bottom: 0.25rem;
          margin-bottom: 0.5rem;
        }
        
        .table-responsive {
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .card {
          border: none;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        .card-header {
          border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        }
        
        @media (max-width: 768px) {
          .size-chart .size-table {
            font-size: 0.875rem;
          }
          
          .size-chart .size-table th,
          .size-chart .size-table td {
            padding: 0.5rem 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SizeChart; 