import React from 'react';
import {
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Table,
  Image,
  Modal,
  Button,
} from 'react-bootstrap';
import { FaRuler, FaCut, FaRegQuestionCircle, FaTimes } from 'react-icons/fa';

const CustomizationGuide = ({ show = false, onHide }) => {
  const handleClose = typeof onHide === 'function' ? onHide : () => {};

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size='lg'
      centered
      className='customization-guide-modal'
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaRuler className='me-2' />
          Pants Alteration Guide
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className='p-0'>
        <Card className='customization-guide border-0'>
          <Card.Body>
            <p className='text-muted mb-4'>
              Learn about the available alteration options for your pants
            </p>
            <Tabs
              defaultActiveKey='overview'
              id='customization-guide-tabs'
              className='mb-3'
            >
              <Tab eventKey='overview' title='Overview'>
                <Row>
                  <Col md={12} className='mb-4'>
                    <h5>Pants Alteration Types</h5>
                    <p>
                      Our alterations service can modify your pants in several
                      ways to achieve the perfect fit. Choose from the following
                      options:
                    </p>
                  </Col>
                  <Col md={6} className='mb-3'>
                    <Card className='guide-card'>
                      <Card.Body>
                        <h5>
                          Length Adjustment{' '}
                          <span className='badge bg-primary ms-2'>$10</span>
                        </h5>
                        <p>
                          Shortens or lengthens your pants to achieve the
                          perfect break at your shoes.
                        </p>
                        <ul className='style-options-list'>
                          <li>
                            <strong>Shorten</strong> - Use positive values (e.g.
                            1.5)
                          </li>
                          <li>
                            <strong>Lengthen</strong> - Use negative values
                            (e.g. -1.5)
                          </li>
                        </ul>
                        <Image
                          src='/images/sample.jpg'
                          alt='Pants Length Guide'
                          fluid
                          className='mt-2'
                          style={{ maxHeight: '120px', objectFit: 'cover' }}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className='mb-3'>
                    <Card className='guide-card'>
                      <Card.Body>
                        <h5>
                          Waist Adjustment{' '}
                          <span className='badge bg-info ms-2'>$25*</span>
                        </h5>
                        <p>
                          Takes in or lets out the waistband for a better fit.
                        </p>
                        <ul className='style-options-list'>
                          <li>
                            <strong>Take in</strong> - Use positive values (e.g.
                            1)
                          </li>
                          <li>
                            <strong>Let out</strong> - Use negative values (e.g.
                            -1)
                          </li>
                        </ul>
                        <p className='small text-muted'>
                          *$25 for any alterations beyond length
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className='mb-3'>
                    <Card className='guide-card'>
                      <Card.Body>
                        <h5>
                          Taper Legs{' '}
                          <span className='badge bg-info ms-2'>$25*</span>
                        </h5>
                        <p>
                          Slims the leg opening, creating a more tailored
                          silhouette.
                        </p>
                        <ul className='style-options-list'>
                          <li>
                            <strong>Standard Taper</strong> - Narrows the leg
                            gradually from knee to hem
                          </li>
                          <li>
                            <strong>Aggressive Taper</strong> - Request in notes
                            for a more dramatic taper
                          </li>
                        </ul>
                        <p className='small text-muted'>
                          *$25 for any alterations beyond length
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className='mb-3'>
                    <Card className='guide-card'>
                      <Card.Body>
                        <h5>
                          Cuff Style{' '}
                          <span className='badge bg-info ms-2'>$25*</span>
                        </h5>
                        <p>
                          Adds a folded cuff at the bottom of your pants for a
                          classic look.
                        </p>
                        <ul className='style-options-list'>
                          <li>
                            <strong>Single Cuff</strong> - One fold,
                            approximately 1.25-1.5 inches
                          </li>
                          <li>
                            <strong>Double Cuff</strong> - Two folds,
                            approximately 1.5-2 inches total
                          </li>
                        </ul>
                        <p className='small text-muted'>
                          *$25 for any alterations beyond length
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>
              <Tab eventKey='measurements' title='Measurement Guide'>
                <div className='measurement-section'>
                  <h5>How to Measure for Alterations</h5>
                  <p>
                    Use these guidelines to determine how much alteration is
                    needed for your pants
                  </p>

                  <Table striped bordered hover className='mt-3'>
                    <thead>
                      <tr>
                        <th>Measurement</th>
                        <th>How to Measure</th>
                        <th>Tips</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Length</td>
                        <td>
                          Measure from the bottom of the inseam to your desired
                          length
                        </td>
                        <td>
                          Pants should touch the top of your shoe with a slight
                          break
                        </td>
                      </tr>
                      <tr>
                        <td>Waist</td>
                        <td>
                          Measure how much needs to be taken in or let out
                        </td>
                        <td>
                          You should be able to fit 1-2 fingers in the waistband
                          when buttoned
                        </td>
                      </tr>
                      <tr>
                        <td>Tapering</td>
                        <td>
                          Measure the current leg opening and your desired
                          opening
                        </td>
                        <td>
                          Taper from the knee down for the most natural look
                        </td>
                      </tr>
                      <tr>
                        <td>Cuff Height</td>
                        <td>Measure from the bottom of the pants up</td>
                        <td>
                          Single cuffs are typically 1.25-1.5 inches, double
                          cuffs 1.5-2 inches
                        </td>
                      </tr>
                    </tbody>
                  </Table>

                  <div className='mt-4'>
                    <h5>Pants Break Styles</h5>
                    <Row className='mt-3'>
                      <Col md={4}>
                        <div className='text-center mb-3'>
                          <h6>No Break</h6>
                          <Image
                            src='/images/sample.jpg'
                            alt='No Break'
                            fluid
                            className='break-style-img'
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                          <p className='small mt-2'>
                            Pants end at the top of the shoe with no fold
                          </p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className='text-center mb-3'>
                          <h6>Slight Break</h6>
                          <Image
                            src='/images/sample.jpg'
                            alt='Slight Break'
                            fluid
                            className='break-style-img'
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                          <p className='small mt-2'>
                            Small fold where pants meet the shoe
                          </p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className='text-center mb-3'>
                          <h6>Full Break</h6>
                          <Image
                            src='/images/sample.jpg'
                            alt='Full Break'
                            fluid
                            className='break-style-img'
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                          <p className='small mt-2'>
                            Pants fold more significantly at the shoe
                          </p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Tab>
              <Tab eventKey='pricing' title='Pricing'>
                <div className='pricing-section'>
                  <h5>Alteration Pricing</h5>
                  <p>
                    Our simple pricing structure makes it easy to understand the
                    cost of your alterations.
                  </p>

                  <Table striped bordered hover className='mt-3'>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Description</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Length Adjustment Only</td>
                        <td>
                          Shortening or lengthening pants without any other
                          alterations
                        </td>
                        <td>$10</td>
                      </tr>
                      <tr>
                        <td>Combination Package</td>
                        <td>
                          Any alteration beyond length (waist adjustment,
                          tapering, cuffing)
                        </td>
                        <td>$25</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className='text-center bg-light'>
                          <strong>Examples</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Length Only</td>
                        <td>Just shortening pants by 1 inch</td>
                        <td>$10</td>
                      </tr>
                      <tr>
                        <td>Length + Taper</td>
                        <td>Shortening pants and tapering legs</td>
                        <td>$25</td>
                      </tr>
                      <tr>
                        <td>Waist + Cuff</td>
                        <td>Adjusting waist and adding cuffs</td>
                        <td>$25</td>
                      </tr>
                      <tr>
                        <td>Full Alteration</td>
                        <td>
                          Length adjustment + waist adjustment + tapering +
                          cuffing
                        </td>
                        <td>$25</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Tab>
              <Tab eventKey='policy' title='Return Policy'>
                <div className='policy-section'>
                  <h5>Alteration Return Policy</h5>
                  <div className='alert alert-warning'>
                    <strong>Please Note:</strong> Altered/customized items are
                    not subject to our standard return policy.
                  </div>
                  <p>
                    Due to the personalized nature of tailored items, we cannot
                    accept returns on custom-altered suits or pants. However, we
                    offer <strong>free in-store adjustments</strong> on all
                    altered items within 30 days of purchase.
                  </p>
                  <h6 className='mt-4'>Free In-Store Alterations</h6>
                  <ul>
                    <li>Visit any ProMayouf store with your receipt</li>
                    <li>
                      Our in-house tailors will make adjustments at no cost
                    </li>
                    <li>
                      Additional alterations beyond the original customization
                      may incur charges
                    </li>
                  </ul>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomizationGuide;
