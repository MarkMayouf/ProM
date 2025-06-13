import React from 'react';
import { Table, Card, Alert } from 'react-bootstrap';
import { FaRuler, FaExclamationTriangle } from 'react-icons/fa';

const SuitCustomizationChart = () => {
  return (
    <Card className="suit-customization-chart mb-4">
      <Card.Header className="bg-dark text-white d-flex align-items-center">
        <FaRuler className="me-2" />
        <h5 className="mb-0">Suit Measurement Guide</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-4">
          For the perfect fit, we recommend having a professional tailor take your measurements. 
          All measurements should be taken in inches.
        </Alert>

        <Table striped bordered responsive>
          <thead className="bg-light">
            <tr>
              <th>Measurement</th>
              <th>How to Measure</th>
              <th>Standard Range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Chest</strong></td>
              <td>Measure around the fullest part of your chest, keeping the tape horizontal</td>
              <td>36" - 48"</td>
            </tr>
            <tr>
              <td><strong>Waist</strong></td>
              <td>Measure around your natural waistline, at the narrowest part</td>
              <td>30" - 44"</td>
            </tr>
            <tr>
              <td><strong>Hip</strong></td>
              <td>Measure around the fullest part of your hips</td>
              <td>36" - 48"</td>
            </tr>
            <tr>
              <td><strong>Shoulder Width</strong></td>
              <td>Measure across the back from shoulder point to shoulder point</td>
              <td>17" - 20"</td>
            </tr>
            <tr>
              <td><strong>Sleeve Length</strong></td>
              <td>Measure from shoulder point to wrist</td>
              <td>32" - 36"</td>
            </tr>
            <tr>
              <td><strong>Inseam</strong></td>
              <td>Measure from the crotch to the desired trouser length</td>
              <td>30" - 34"</td>
            </tr>
          </tbody>
        </Table>

        <div className="customization-notes mt-4">
          <h6 className="text-primary mb-3">Additional Customization Options:</h6>
          <ul className="list-unstyled">
            <li>✓ Jacket Style (Single-breasted, Double-breasted)</li>
            <li>✓ Lapel Style (Notch, Peak, Shawl)</li>
            <li>✓ Vent Style (Single, Double, No vent)</li>
            <li>✓ Button Configuration (2-button, 3-button)</li>
            <li>✓ Pocket Style (Flap, Patch, Besom)</li>
          </ul>
        </div>

        <Alert variant="warning" className="mt-4 d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={20} />
          <div>
            <strong>Important Note:</strong> Customized and altered suits cannot be returned or refunded. 
            Please ensure all measurements are accurate before proceeding with customization.
          </div>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default SuitCustomizationChart; 