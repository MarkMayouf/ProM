import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Card,
  Tab,
  Tabs,
  Table,
  Alert,
  Badge,
  InputGroup,
  ProgressBar,
  Accordion,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Image
} from 'react-bootstrap';
import {
  FaRuler,
  FaTshirt,
  FaCalculator,
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaPlus,
  FaMinus,
  FaChartLine,
  FaUser,
  FaCut,
  FaMoneyBillWave,
  FaSave,
  FaUndo,
  FaExclamationTriangle,
  FaDownload,
  FaExpand,
  FaPlay
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const CustomizationModal = ({ 
  show, 
  onHide, 
  product, 
  onCustomizationComplete,
  existingCustomizations = null,
  isEditing = false
}) => {
  // State for measurements
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    shoulders: '',
    sleeveLength: '',
    jacketLength: '',
    pantWaist: '',
    pantLength: '',
    inseam: '',
    thigh: '',
    calf: ''
  });

  // State for customization options
  const [customizations, setCustomizations] = useState({
    lapelStyle: 'notched',
    buttonCount: '2',
    ventStyle: 'center',
    pocketStyle: 'flap',
    liningColor: 'standard',
    monogram: '',
    monogramPosition: 'inside',
    cuffStyle: 'button',
    trouser: {
      pleats: 'flat',
      cuffs: false,
      break: 'slight'
    }
  });

  // State for alterations
  const [alterations, setAlterations] = useState({
    sleeveAdjustment: 0,
    waistAdjustment: 0,
    lengthAdjustment: 0,
    shoulderAdjustment: 0,
    pantWaistAdjustment: 0,
    pantLengthAdjustment: 0
  });

  // State for pants alterations
  const [pantsAlterations, setPantsAlterations] = useState({
    waistAdjustment: 0, // in inches
    lengthInseam: '',
    notes: '' // Replace fitType with notes
  });

  // UI state
  const [activeTab, setActiveTab] = useState('measurements');
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [totalCustomizationCost, setTotalCustomizationCost] = useState(0);
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showMeasurementGuide, setShowMeasurementGuide] = useState(false);

  // Load existing customizations if provided
  useEffect(() => {
    if (existingCustomizations) {
      setMeasurements(existingCustomizations.measurements || measurements);
      setCustomizations(existingCustomizations.options || customizations);
      setAlterations(existingCustomizations.alterations || alterations);
      setPantsAlterations({
        waistAdjustment: existingCustomizations.pantsAlterations?.waistAdjustment || 0,
        lengthInseam: existingCustomizations.pantsAlterations?.lengthInseam || '',
        notes: existingCustomizations.pantsAlterations?.notes || ''
      });
      setTotalCustomizationCost(existingCustomizations.totalCost || 0);
    }
  }, [existingCustomizations]);

  // Calculate customization cost whenever options change
  useEffect(() => {
    calculateCustomizationCost();
  }, [customizations, alterations, measurements]);

  // Calculate customization cost whenever alterations change
  useEffect(() => {
    calculateCustomizationCost();
  }, [pantsAlterations]);

  // Pricing structure
  const customizationPricing = {
    lapelStyle: { notched: 0, peak: 25, shawl: 35 },
    buttonCount: { '1': 15, '2': 0, '3': 10 },
    ventStyle: { none: -10, center: 0, side: 15, double: 25 },
    pocketStyle: { flap: 0, besom: 20, patch: 15 },
    liningColor: { standard: 0, premium: 30, luxury: 50 },
    monogram: { base: 25, premium: 45 },
    cuffStyle: { button: 0, french: 20, barrel: 10 },
    alterations: {
      sleeve: 15,
      waist: 20,
      length: 25,
      shoulder: 35,
      pantWaist: 15,
      pantLength: 20
    }
  };

  const alterationPricing = {
    waistAdjustment: 20, // Updated cost for waist adjustment
    lengthInseam: 15,    // Updated cost for length adjustment
  };

  const calculateCustomizationCost = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      let cost = 0;
      
      // Style customizations
      cost += customizationPricing.lapelStyle[customizations.lapelStyle] || 0;
      cost += customizationPricing.buttonCount[customizations.buttonCount] || 0;
      cost += customizationPricing.ventStyle[customizations.ventStyle] || 0;
      cost += customizationPricing.pocketStyle[customizations.pocketStyle] || 0;
      cost += customizationPricing.liningColor[customizations.liningColor] || 0;
      cost += customizationPricing.cuffStyle[customizations.cuffStyle] || 0;
      
      // Monogram
      if (customizations.monogram) {
        cost += customizationPricing.monogram.base;
      }
      
      // Alterations
      Object.entries(alterations).forEach(([key, value]) => {
        if (Math.abs(value) > 0) {
          const alterationType = key.replace('Adjustment', '');
          cost += customizationPricing.alterations[alterationType] || 0;
        }
      });
      
      // Pants alterations
      if (Math.abs(pantsAlterations.waistAdjustment) > 0) {
        cost += alterationPricing.waistAdjustment;
      }
      
      if (pantsAlterations.lengthInseam) {
        cost += alterationPricing.lengthInseam;
      }
      
      setTotalCustomizationCost(cost);
      setIsCalculating(false);
    }, 500);
  };

  // Size recommendation based on measurements
  const calculateRecommendedSize = () => {
    if (!measurements.chest || !measurements.waist) {
      toast.warning('Please enter chest and waist measurements for size recommendation');
      return;
    }

    const chest = parseFloat(measurements.chest);
    const waist = parseFloat(measurements.waist);

    // Size chart for suits
    const sizeChart = {
      '36R': { chest: [34, 36], waist: [28, 30] },
      '38R': { chest: [36, 38], waist: [30, 32] },
      '40R': { chest: [38, 40], waist: [32, 34] },
      '42R': { chest: [40, 42], waist: [34, 36] },
      '44R': { chest: [42, 44], waist: [36, 38] },
      '46R': { chest: [44, 46], waist: [38, 40] },
      '48R': { chest: [46, 48], waist: [40, 42] }
    };

    let bestMatch = null;
    let bestScore = Infinity;

    Object.entries(sizeChart).forEach(([size, ranges]) => {
      const chestFit = chest >= ranges.chest[0] && chest <= ranges.chest[1];
      const waistFit = waist >= ranges.waist[0] && waist <= ranges.waist[1];
      
      if (chestFit && waistFit) {
        const score = Math.abs(chest - (ranges.chest[0] + ranges.chest[1]) / 2) +
                     Math.abs(waist - (ranges.waist[0] + ranges.waist[1]) / 2);
        
        if (score < bestScore) {
          bestScore = score;
          bestMatch = size;
        }
      }
    });

    setRecommendedSize(bestMatch);
    if (bestMatch) {
      toast.success(`Recommended size: ${bestMatch}`);
    } else {
      toast.info('Custom sizing recommended - please contact our tailors');
    }
  };

  // Validation
  const validateMeasurements = () => {
    // Since we're only doing pants alterations, we don't need measurements validation
    // Remove the measurement requirements
    return true;
  };

  const validateCustomizations = () => {
    const errors = {};
    
    // Validate waist adjustment range
    if (Math.abs(pantsAlterations.waistAdjustment) > 5) {
      errors.waistAdjustment = 'Waist adjustment cannot exceed ±5 inches';
    }
    
    // Validate inseam length - only if provided
    if (pantsAlterations.lengthInseam && pantsAlterations.lengthInseam !== '') {
      const inseamValue = parseFloat(pantsAlterations.lengthInseam);
      if (isNaN(inseamValue) || inseamValue < 28 || inseamValue > 36) {
        errors.lengthInseam = 'Inseam length must be between 28-36 inches';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle measurement input
  const handleMeasurementChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Handle customization option change
  const handleCustomizationChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomizations(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomizations(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle alteration change
  const handleAlterationChange = (field, value) => {
    setAlterations(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Handle pants alteration change
  const handlePantsAlterationChange = (field, value) => {
    setPantsAlterations(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Save customizations
  const handleSave = () => {
    if (!validateCustomizations()) {
      toast.error('Please correct the validation errors before saving');
      return;
    }

    const customizationData = {
      measurements,
      options: customizations,
      alterations,
      pantsAlterations,
      totalCost: totalCustomizationCost,
      recommendedSize,
      timestamp: new Date().toISOString()
    };

    onCustomizationComplete(customizationData);
    toast.success('Customizations saved successfully!');
    onHide();
  };

  // Reset all customizations
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all customizations?')) {
      setMeasurements({
        chest: '', waist: '', shoulders: '', sleeveLength: '',
        jacketLength: '', pantWaist: '', pantLength: '', inseam: '', thigh: '', calf: ''
      });
      setCustomizations({
        lapelStyle: 'notched', buttonCount: '2', ventStyle: 'center',
        pocketStyle: 'flap', liningColor: 'standard', monogram: '',
        monogramPosition: 'inside', cuffStyle: 'button',
        trouser: { pleats: 'flat', cuffs: false, break: 'slight' }
      });
      setAlterations({
        sleeveAdjustment: 0, waistAdjustment: 0, lengthAdjustment: 0,
        shoulderAdjustment: 0, pantWaistAdjustment: 0, pantLengthAdjustment: 0
      });
      setPantsAlterations({
        waistAdjustment: 0,
        lengthInseam: '',
        notes: ''
      });
      setRecommendedSize(null);
      toast.info('All customizations have been reset');
    }
  };

  const SizeChartModal = () => (
    <Modal 
      show={showSizeChart} 
      onHide={() => setShowSizeChart(false)} 
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaChartLine className="me-2" />
          Size Chart
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="size-chart-container">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6>Men's Suit Size Chart</h6>
            <Button variant="outline-primary" size="sm">
              <FaDownload className="me-1" />
              Download PDF
            </Button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>Size</th>
                  <th>Chest (inches)</th>
                  <th>Waist (inches)</th>
                  <th>Sleeve (inches)</th>
                  <th>Jacket Length (inches)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>36R</td><td>34-36</td><td>28-30</td><td>32-33</td><td>29-30</td></tr>
                <tr><td>38R</td><td>36-38</td><td>30-32</td><td>32-33</td><td>29-30</td></tr>
                <tr><td>40R</td><td>38-40</td><td>32-34</td><td>33-34</td><td>30-31</td></tr>
                <tr><td>42R</td><td>40-42</td><td>34-36</td><td>33-34</td><td>30-31</td></tr>
                <tr><td>44R</td><td>42-44</td><td>36-38</td><td>34-35</td><td>31-32</td></tr>
                <tr><td>46R</td><td>44-46</td><td>38-40</td><td>34-35</td><td>31-32</td></tr>
              </tbody>
            </table>
                </div>

          <Alert variant="info" className="mt-3">
                      <FaInfoCircle className="me-2" />
            <strong>Note:</strong> These are standard measurements. For the best fit, we recommend professional measuring or using our measurement guide.
          </Alert>
              </div>
      </Modal.Body>
    </Modal>
  );

  const MeasurementGuideModal = () => (
    <Modal 
      show={showMeasurementGuide} 
      onHide={() => setShowMeasurementGuide(false)} 
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaRuler className="me-2" />
          Measurement Guidance
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="measurement-guide-container">
                <Accordion defaultActiveKey="0">
                  <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaRuler className="me-2" />
                How to Measure Waist
              </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={6}>
                    <div className="measurement-illustration">
                      <Image 
                        src="/images/waist.jpg" 
                        alt="Waist measurement guide"
                        fluid
                        className="border rounded"
                      />
                    </div>
                        </Col>
                        <Col md={6}>
                    <h6>Steps:</h6>
                    <ol>
                      <li>Stand straight with feet together</li>
                      <li>Locate your natural waistline (narrowest part of torso)</li>
                      <li>Wrap measuring tape around waist</li>
                      <li>Keep tape parallel to floor</li>
                      <li>Breathe normally and take measurement</li>
                    </ol>
                    <Alert variant="warning" className="mt-3">
                      <strong>Tip:</strong> Don't pull the tape too tight - you should be able to fit one finger underneath.
                    </Alert>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaRuler className="me-2" />
                How to Measure Inseam
              </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                  <Col md={6}>
                    <div className="measurement-illustration">
                      <Image 
                        src="/images/lengthM.jpg" 
                        alt="I/nseam measurement guide"
                        fluid
                        className="border rounded"
                            />
                    </div>
                        </Col>
                  <Col md={6}>
                    <h6>Steps:</h6>
                    <ol>
                      <li>Wear well-fitting pants</li>
                      <li>Stand against a wall</li>
                      <li>Measure from crotch seam to desired hem length</li>
                      <li>For dress pants: typically 1/4" break on shoe</li>
                      <li>For casual pants: can be shorter with no break</li>
                    </ol>
                    <Alert variant="info" className="mt-3">
                      <strong>Note:</strong> Consider the type of shoes you'll wear most often with this suit.
                    </Alert>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaPlay className="me-2" />
                Video Tutorial
              </Accordion.Header>
                    <Accordion.Body>
                <div className="video-tutorial">
                  <div className="ratio ratio-16x9">
                    <iframe 
                      src="https://www.youtube.com/embed/KkiQH9msHaU" 
                      title="How to Measure for a Suit"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="mt-2 text-muted">
                    Watch our detailed video guide on how to take accurate measurements for the perfect suit fit.
                  </p>
                </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
      </Modal.Body>
    </Modal>
  );

  return (
    <>
      <Modal 
        show={show} 
        onHide={onHide} 
        size="lg" 
        centered
        className="customization-modal"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaTshirt className="me-2" />
            {isEditing ? "Edit Your Suit Customization" : "Customize Your Suit"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {/* Show editing notice if editing from cart */}
          {isEditing && (
            <Alert variant="info" className="mb-4">
              <FaInfoCircle className="me-2" />
              You are editing existing customizations. Your changes will be updated in your cart.
            </Alert>
          )}

          {/* Pants Alteration Section */}
          <Card className="mb-4">
                      <Card.Header>
              <h5 className="mb-0">
                <FaCut className="me-2" />
                Pants Alteration
              </h5>
                      </Card.Header>
                      <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Waist Adjustment
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Adjust waist size in inches (±5 max)</Tooltip>}
                      >
                        <FaInfoCircle className="ms-1 text-muted" />
                      </OverlayTrigger>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>±</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.5"
                        min="-5"
                        max="5"
                        placeholder="0"
                        value={pantsAlterations.waistAdjustment}
                        onChange={(e) => handlePantsAlterationChange('waistAdjustment', parseFloat(e.target.value) || 0)}
                        isInvalid={!!validationErrors.waistAdjustment}
                      />
                      <InputGroup.Text>inches</InputGroup.Text>
                    </InputGroup>
                    {validationErrors.waistAdjustment && (
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.waistAdjustment}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      Positive values = let out, Negative values = take in
                    </Form.Text>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Length (Inseam)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        step="0.5"
                        min="28"
                        max="36"
                        placeholder="Enter inseam length"
                        value={pantsAlterations.lengthInseam}
                        onChange={(e) => handlePantsAlterationChange('lengthInseam', e.target.value)}
                        isInvalid={!!validationErrors.lengthInseam}
                      />
                      <InputGroup.Text>inches</InputGroup.Text>
                    </InputGroup>
                    {validationErrors.lengthInseam && (
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.lengthInseam}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      Standard range: 28-36 inches
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows="3"
                  placeholder="Add any special instructions or preferences for your alterations..."
                  value={pantsAlterations.notes}
                  onChange={(e) => handlePantsAlterationChange('notes', e.target.value)}
                />
                <Form.Text className="text-muted">
                  Optional: Provide any specific requirements or preferences for your alterations
                </Form.Text>
              </Form.Group>
                      </Card.Body>
                    </Card>

          {/* Size Chart Section */}
          <Card className="mb-4">
                      <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Size Chart
              </h5>
                      </Card.Header>
                      <Card.Body>
              <p className="text-muted mb-3">
                Need help finding your size? Check our detailed size chart with measurements.
              </p>
                              <Button
                variant="outline-primary" 
                onClick={() => setShowSizeChart(true)}
                className="me-2"
                              >
                <FaExpand className="me-1" />
                View Size Chart
                              </Button>
                              <Button
                                variant="outline-secondary"
                size="sm"
                              >
                <FaDownload className="me-1" />
                Download PDF
                              </Button>
            </Card.Body>
          </Card>

          {/* Measurement Guidance Section */}
          <Card className="mb-4 border-danger">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <FaRuler className="me-2" />
                Measurement Guidance
                <Badge bg="light" text="dark" className="ms-2">Important</Badge>
              </h5>
            </Card.Header>
            <Card.Body className="bg-danger-subtle">
              <p className="text-danger mb-3 fw-bold">
                Learn how to take accurate measurements for the perfect fit. Proper measurements are essential for customization.
              </p>
              <Button 
                variant="danger"
                onClick={() => setShowMeasurementGuide(true)}
              >
                <FaInfoCircle className="me-1" />
                View Measurement Guide
              </Button>
            </Card.Body>
          </Card>

          {/* Cost Summary */}
          <Card className="mb-4 border-success">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <FaMoneyBillWave className="me-2" />
                  Customization Cost
                </h6>
                <Badge bg="success" className="fs-6">
                  {isCalculating ? (
                    <Spinner size="sm" />
                  ) : (
                    `+$${totalCustomizationCost.toFixed(2)}`
                  )}
                </Badge>
                                </div>
            </Card.Header>
            <Card.Body>
              <div className="cost-breakdown">
                {Math.abs(pantsAlterations.waistAdjustment) > 0 && (
                  <div className="d-flex justify-content-between">
                    <span>Waist Adjustment</span>
                    <span>+$20.00</span>
                  </div>
                )}
                {pantsAlterations.lengthInseam && (
                  <div className="d-flex justify-content-between">
                    <span>Length Adjustment</span>
                    <span>+$15.00</span>
                  </div>
                )}
              </div>
                          </Card.Body>
                        </Card>

          {/* Warning Note */}
          <Alert variant="danger" className="mb-4">
            <div className="d-flex align-items-start">
              <FaExclamationTriangle className="me-2 mt-1 flex-shrink-0" />
              <div>
                <strong>Important Notice:</strong> Customized items are not eligible for refunds. 
                Please ensure all measurements and preferences are accurate before proceeding.
              </div>
        </div>
          </Alert>
      </Modal.Body>

        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
          <Button variant="outline-secondary" onClick={handleReset}>
            <FaUndo className="me-1" />
              Reset
          </Button>
            <div>
          <Button variant="secondary" onClick={onHide} className="me-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <FaSave className="me-1" />
                {isEditing ? "Update Customization" : "Save Customization"}
          </Button>
            </div>
        </div>
      </Modal.Footer>
      </Modal>

      {/* Size Chart Modal */}
      <SizeChartModal />
      
      {/* Measurement Guide Modal */}
      <MeasurementGuideModal />

      <style jsx>{`
        .customization-modal .modal-dialog {
          max-width: 900px;
        }
        
        .cost-breakdown > div {
          padding: 0.25rem 0;
          border-bottom: 1px solid #eee;
        }
        
        .cost-breakdown > div:last-child {
          border-bottom: none;
          font-weight: bold;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          border-top: 2px solid #28a745;
        }
        
        .measurement-illustration img {
          max-height: 200px;
          object-fit: cover;
        }
        
        .video-tutorial {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .customization-modal .modal-dialog {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
          }
        }
      `}</style>
    </>
  );
};

export default CustomizationModal; 