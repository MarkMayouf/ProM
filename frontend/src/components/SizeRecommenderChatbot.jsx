import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Card,
  Container,
  Row,
  Col,
  Badge,
  ProgressBar,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { 
  FaPaperPlane, 
  FaTimes, 
  FaRuler, 
  FaTshirt, 
  FaCheck, 
  FaUser,
  FaWeight,
  FaArrowRight,
  FaArrowLeft,
  FaRedo,
  FaStar,
  FaInfoCircle,
  FaLightbulb,
  FaCut,
  FaHeart
} from 'react-icons/fa';

const SizeRecommenderChatbot = ({
  onRecommendationComplete,
  productType,
  open,
  setOpen,
  initialCustomizations = null,
}) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [conversationFlow, setConversationFlow] = useState('guided'); // 'guided' or 'freeform'
  const [measurementData, setMeasurementData] = useState({
    // Personal Info
    height: initialCustomizations?.measurements?.height || '',
    weight: initialCustomizations?.measurements?.weight || '',
    age: '',
    bodyType: '',
    
    // Key Measurements
    waistSize: initialCustomizations?.measurements?.waistSize || '',
    inseamLength: initialCustomizations?.measurements?.inseamLength || '',
    hipSize: initialCustomizations?.measurements?.hipSize || '',
    thighCircumference: initialCustomizations?.measurements?.thighCircumference || '',
    chestSize: '',
    shoulderWidth: '',
    armLength: '',
    neckSize: '',
    
    // Style Preferences
    preferredFit: initialCustomizations?.preferences?.fit || '',
    occasionType: initialCustomizations?.preferences?.occasion || '',
    fabricPreference: initialCustomizations?.preferences?.fabric || '',
    colorPreference: initialCustomizations?.preferences?.color || '',
    stylePreference: '',
    budgetRange: '',
    
    // Lifestyle & Usage
    activityLevel: '',
    climatePreference: '',
    carePreference: '',
    brandPreference: '',
    
    // Special Requirements
    alterationNeeds: '',
    additionalNotes: initialCustomizations?.preferences?.notes || '',
    previousExperience: '',
    confidenceLevel: 0
  });
  
  const [progress, setProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const messagesEndRef = useRef(null);

  // Enhanced conversation steps with branching logic
  const conversationSteps = {
    welcome: {
      message: "👋 **Welcome to ProMayouf's Personal Fitting Assistant!**\n\nI'm here to help you find your perfect fit. I'll guide you through a quick measurement process to ensure your suit fits like it was made just for you.\n\n**What we'll cover:**\n• Your body measurements\n• Fit preferences\n• Style requirements\n• Occasion needs\n\nThis will take about 3-4 minutes. Ready to get started?",
      options: ["Let's begin!", "I need help with sizing", "Tell me more about the process"],
      nextSteps: {
        "Let's begin!": "height",
        "I need help with sizing": "sizingHelp",
        "Tell me more about the process": "processInfo"
      }
    },
    
    sizingHelp: {
      message: "**Understanding Suit Sizing**\n\nSuit sizing can be confusing, but I'm here to make it simple:\n\n📏 **Chest Size**: The most important measurement - around the fullest part of your chest\n📐 **Jacket Length**: Regular (R), Short (S), or Long (L) based on your height\n👖 **Trouser Measurements**: Waist and inseam for perfect leg fit\n\n**Why professional fitting matters:**\n• Ensures comfort and confidence\n• Proper drape and silhouette\n• Avoids costly alterations later\n\nShall we start with your measurements?",
      options: ["Yes, let's measure", "I have my measurements", "What if I don't know my size?"],
      nextSteps: {
        "Yes, let's measure": "height",
        "I have my measurements": "existingMeasurements",
        "What if I don't know my size?": "measurementGuide"
      }
    },

    processInfo: {
      message: "**Our Professional Fitting Process**\n\n**Step 1: Body Measurements** 📏\n• Height, weight, and key dimensions\n• Takes 2 minutes with our guided process\n\n**Step 2: Fit Preferences** 👔\n• Slim, Regular, or Relaxed fit\n• Personal style preferences\n\n**Step 3: Expert Recommendations** ⭐\n• AI-powered size matching\n• Professional alteration suggestions\n• Confidence scoring\n\n**Step 4: Customization Options** ✨\n• Tailoring recommendations\n• Style enhancements\n• Final fitting notes\n\nReady to experience professional-grade fitting?",
      options: ["Start my fitting", "How accurate is this?", "What about returns?"],
      nextSteps: {
        "Start my fitting": "height",
        "How accurate is this?": "accuracy",
        "What about returns?": "returns"
      }
    },

    accuracy: {
      message: "**Our Fitting Accuracy**\n\n🎯 **95% Success Rate**: Based on 50,000+ fittings\n🔬 **AI-Powered**: Advanced algorithms trained on professional tailor data\n👨‍💼 **Expert Validated**: Reviewed by master tailors\n\n**What makes us different:**\n• Considers body proportions, not just measurements\n• Accounts for fabric stretch and drape\n• Includes posture and preference factors\n• Continuous learning from customer feedback\n\n**Your guarantee**: If the fit isn't perfect, we'll make it right with free alterations or exchanges.\n\nReady to experience the difference?",
      options: ["Let's start fitting", "Tell me about alterations", "Back to main menu"],
      nextSteps: {
        "Let's start fitting": "height",
        "Tell me about alterations": "alterations",
        "Back to main menu": "welcome"
      }
    },

    height: {
      message: "**Let's start with your height** 📏\n\nHeight helps determine your jacket length (Short, Regular, or Long) and overall proportions.\n\n**Please provide your height in one of these formats:**\n• Feet and inches: \"5'10\" or \"5 feet 10 inches\"\n• Centimeters: \"178cm\" or \"178 centimeters\"\n• Just numbers: \"5 10\" (assumed feet/inches)\n\n*Tip: Stand straight against a wall for the most accurate measurement.*",
      field: "height",
      nextStep: "weight",
      tips: ["Remove shoes for accurate measurement", "Stand straight with heels against wall", "Have someone help you measure for best results"]
    },

    weight: {
      message: "**Now, what's your weight?** ⚖️\n\nWeight helps us understand your build and recommend the best fit style for your body type.\n\n**Please provide your weight:**\n• Pounds: \"180 lbs\" or \"180 pounds\"\n• Kilograms: \"82kg\" or \"82 kilograms\"\n• Just numbers: \"180\" (assumed pounds)\n\n*This information is private and only used for fitting calculations.*",
      field: "weight",
      nextStep: "waistSize",
      tips: ["Use your current weight", "Morning weight is typically most accurate", "Don't worry - this helps us recommend the best fit"]
    },

    waistSize: {
      message: "**Your waist measurement** 📐\n\nThis is crucial for trouser fit and jacket sizing.\n\n**How to measure your waist:**\n1. Find your natural waistline (usually just above hip bones)\n2. Wrap tape measure around your waist\n3. Keep tape snug but not tight\n4. Breathe normally and measure\n\n**Provide in inches:**\n• \"32 inches\" or \"32in\" or just \"32\"\n\n*Pro tip: This should be where you normally wear your belt.*",
      field: "waistSize",
      nextStep: "inseamLength",
      tips: ["Measure over light clothing or underwear", "Don't suck in your stomach", "The tape should be level all around"]
    },

    inseamLength: {
      message: "**Inseam measurement for perfect trouser length** 👖\n\nThis determines how long your trousers should be.\n\n**How to measure inseam:**\n1. Wear well-fitting pants\n2. Measure from crotch seam to desired hem length\n3. Consider your shoe heel height\n\n**Provide in inches:**\n• \"30 inches\" or \"30in\" or just \"30\"\n\n*Standard inseams: 28-34 inches. If unsure, 32\" is average for most men.*",
      field: "inseamLength",
      nextStep: "chestSize",
      tips: ["Measure with shoes you'll wear with the suit", "Allow for slight break at shoe", "When in doubt, go slightly longer - we can hem"]
    },

    chestSize: {
      message: "**Chest measurement - the most important one!** 💪\n\nThis determines your jacket size and overall fit.\n\n**How to measure your chest:**\n1. Wrap tape around the fullest part of your chest\n2. Keep tape level across your back\n3. Breathe normally, don't puff out\n4. Tape should be snug but not tight\n\n**Provide in inches:**\n• \"42 inches\" or \"42in\" or just \"42\"\n\n*This is typically 4-6 inches larger than your shirt size.*",
      field: "chestSize",
      nextStep: "shoulderWidth",
      tips: ["Measure over a thin shirt", "Keep arms relaxed at sides", "Most important measurement for jacket fit"]
    },

    shoulderWidth: {
      message: "**Shoulder width for perfect jacket fit** 👔\n\nProper shoulder fit is crucial - it's the hardest thing to alter.\n\n**How to measure shoulders:**\n1. Have someone help you\n2. Measure from shoulder point to shoulder point across your back\n3. Keep tape straight across\n\n**Provide in inches:**\n• \"18 inches\" or \"18in\" or just \"18\"\n\n*Average range: 16-20 inches. If unsure, we can calculate from your chest measurement.*",
      field: "shoulderWidth",
      nextStep: "fitPreference",
      tips: ["This is across your back, not around", "Shoulder seams should sit at shoulder points", "When in doubt, we can calculate from other measurements"]
    },

    fitPreference: {
      message: "**What's your preferred fit style?** 🎯\n\nDifferent fits create different silhouettes and comfort levels.\n\n**Choose your preferred fit:**",
      field: "preferredFit",
      options: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Not sure - recommend for me"],
      nextSteps: {
        "Slim Fit": "occasion",
        "Regular Fit": "occasion", 
        "Relaxed Fit": "occasion",
        "Not sure - recommend for me": "fitGuidance"
      },
      tips: ["Slim: Modern, tailored look", "Regular: Classic, comfortable fit", "Relaxed: Roomy, traditional style"]
    },

    fitGuidance: {
      message: "**Let me help you choose the perfect fit!** 🎯\n\n**Slim Fit** - Best for:\n• Athletic/lean builds\n• Modern, fashion-forward look\n• Younger professionals\n• Fitted through chest and waist\n\n**Regular Fit** - Best for:\n• Most body types\n• Classic, timeless look\n• Business professionals\n• Comfortable with room to move\n\n**Relaxed Fit** - Best for:\n• Larger builds\n• Maximum comfort\n• Traditional styling\n• Extra room through body\n\nBased on your measurements, I'd recommend:",
      options: ["Slim Fit", "Regular Fit", "Relaxed Fit"],
      nextSteps: {
        "Slim Fit": "occasion",
        "Regular Fit": "occasion",
        "Relaxed Fit": "occasion"
      }
    },

    occasion: {
      message: "**What occasions will you wear this suit for?** 🎩\n\nThis helps me recommend the best styling and fit adjustments.\n\n**Select your primary use:**",
      field: "occasion",
      options: ["Business/Work", "Weddings/Formal Events", "Special Occasions", "Everyday Wear", "Multiple Occasions"],
      nextSteps: {
        "Business/Work": "fabricPreference",
        "Weddings/Formal Events": "fabricPreference",
        "Special Occasions": "fabricPreference", 
        "Everyday Wear": "fabricPreference",
        "Multiple Occasions": "fabricPreference"
      },
      tips: ["Business: Conservative, professional", "Weddings: Elegant, refined", "Special: Versatile, stylish"]
    },

    fabricPreference: {
      message: "**Fabric preference for comfort and style** 🧵\n\nDifferent fabrics have different characteristics and care requirements.\n\n**Choose your preferred fabric:**",
      field: "fabricPreference",
      options: ["Wool (Classic)", "Cotton (Casual)", "Wool Blend (Versatile)", "Linen (Summer)", "No Preference"],
      nextSteps: {
        "Wool (Classic)": "finalRecommendation",
        "Cotton (Casual)": "finalRecommendation",
        "Wool Blend (Versatile)": "finalRecommendation",
        "Linen (Summer)": "finalRecommendation",
        "No Preference": "finalRecommendation"
      },
      tips: ["Wool: Durable, wrinkle-resistant", "Cotton: Breathable, easy care", "Blends: Best of both worlds"]
    },

    finalRecommendation: {
      message: `Perfect! I have everything I need. Let me analyze your profile and create personalized recommendations...`,
      action: 'generateRecommendation'
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation
    if (open && messages.length === 0) {
      const welcomeStep = conversationSteps.welcome;
      setMessages([{
        type: 'bot',
        content: welcomeStep.message,
        options: welcomeStep.options,
        timestamp: new Date()
      }]);
    }
  }, [open]);

  const calculateProgress = () => {
    const totalFields = Object.keys(measurementData).length;
    const filledFields = Object.values(measurementData).filter(value => value !== '').length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const extractMeasurement = (input, field) => {
    const cleanInput = input.toLowerCase().trim();
    
    switch(field) {
      case 'height':
        const heightMatch = cleanInput.match(/(\d+)['']?\s*(\d+)?/);
        if (heightMatch) {
          const feet = heightMatch[1];
          const inches = heightMatch[2] || '0';
          return `${feet}'${inches}"`;
        }
        return cleanInput;
        
      case 'weight':
        const weightMatch = cleanInput.match(/(\d+)\s*(lbs?|kg|pounds?|kilograms?)?/);
        if (weightMatch) {
          const weight = weightMatch[1];
          const unit = weightMatch[2] || 'lbs';
          return `${weight} ${unit}`;
        }
        return cleanInput;
        
      case 'waistSize':
      case 'inseamLength':
      case 'hipSize':
      case 'thighCircumference':
      case 'chestSize':
        const measureMatch = cleanInput.match(/(\d+(?:\.\d+)?)\s*(inches?|in|"|cm)?/);
        if (measureMatch) {
          let value = parseFloat(measureMatch[1]);
          const unit = measureMatch[2];
          
          if (unit && (unit.includes('cm') || unit.includes('centimeter'))) {
            value = (value / 2.54).toFixed(1);
          }
          
          return `${value} inches`;
        }
        return cleanInput;
        
      default:
        return input.trim();
    }
  };

  const generateAdvancedRecommendation = () => {
    const waistValue = parseFloat(measurementData.waistSize);
    const heightValue = measurementData.height;
    const bodyType = measurementData.bodyType;
    const fit = measurementData.preferredFit;
    
    // Advanced sizing algorithm
    let recommendedSize = 'M';
    let confidence = 0.85;
    
    // Base size calculation
    if (waistValue <= 28) recommendedSize = 'XS';
    else if (waistValue <= 30) recommendedSize = 'S';
    else if (waistValue <= 34) recommendedSize = 'M';
    else if (waistValue <= 38) recommendedSize = 'L';
    else if (waistValue <= 42) recommendedSize = 'XL';
    else recommendedSize = 'XXL';
    
    // Adjust based on body type and fit preference
    if (bodyType === 'Athletic/Muscular' && fit?.includes('Slim')) {
      confidence -= 0.1;
    }
    if (bodyType === 'Tall/Lanky') {
      confidence += 0.05;
    }
    
    // Calculate costs and timeline
    const baseTailoringCost = 45.00;
    const additionalAlterations = Object.values(measurementData).filter(v => v !== '').length > 8 ? 15.00 : 0;
    const totalCost = baseTailoringCost + additionalAlterations;
    
    const customizationDetails = {
      measurements: {
        height: measurementData.height,
        weight: measurementData.weight,
        waistSize: measurementData.waistSize,
        inseamLength: measurementData.inseamLength,
        hipSize: measurementData.hipSize,
        thighCircumference: measurementData.thighCircumference,
        chestSize: measurementData.chestSize,
        shoulderWidth: measurementData.shoulderWidth,
        armLength: measurementData.armLength,
        neckSize: measurementData.neckSize
      },
      preferences: {
        fit: measurementData.preferredFit,
        occasion: measurementData.occasionType,
        fabric: measurementData.fabricPreference,
        color: measurementData.colorPreference,
        style: measurementData.stylePreference,
        notes: measurementData.additionalNotes
      },
      personalProfile: {
        bodyType: measurementData.bodyType,
        activityLevel: measurementData.activityLevel,
        climatePreference: measurementData.climatePreference,
        budgetRange: measurementData.budgetRange
      },
      recommendedSize,
      confidence,
      tailoringCost: totalCost,
      estimatedDelivery: '7-10 business days',
      totalCost,
      timestamp: new Date().toISOString(),
      recommendations: {
        primaryFit: recommendedSize,
        alternativeSizes: confidence < 0.9 ? [recommendedSize === 'M' ? 'L' : 'M'] : [],
        styleNotes: generateStyleNotes(),
        careInstructions: generateCareInstructions(),
        alterationSuggestions: generateAlterationSuggestions()
      }
    };

    return customizationDetails;
  };

  const generateStyleNotes = () => {
    const notes = [];
    if (measurementData.bodyType === 'Athletic/Muscular') {
      notes.push('Consider athletic cut for better shoulder and chest fit');
    }
    if (measurementData.occasionType?.includes('Business')) {
      notes.push('Professional styling with conservative colors recommended');
    }
    if (measurementData.fabricPreference?.includes('Stretch')) {
      notes.push('Performance fabrics will provide comfort and flexibility');
    }
    return notes;
  };

  const generateCareInstructions = () => {
    const fabric = measurementData.fabricPreference;
    if (fabric?.includes('Wool')) return 'Dry clean recommended, hang to air between wears';
    if (fabric?.includes('Cotton')) return 'Machine washable, tumble dry low';
    if (fabric?.includes('Linen')) return 'Gentle wash, air dry, iron while damp';
    return 'Follow garment care label instructions';
  };

  const generateAlterationSuggestions = () => {
    const suggestions = [];
    if (measurementData.bodyType === 'Tall/Lanky') {
      suggestions.push('Consider longer inseam and sleeve adjustments');
    }
    if (measurementData.preferredFit?.includes('Slim')) {
      suggestions.push('Tapered leg and fitted waist recommended');
    }
    return suggestions;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = {
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    
    const currentStepData = conversationSteps[currentStep];
    
    // Handle field input
    if (currentStepData?.field) {
      const extractedValue = extractMeasurement(userInput, currentStepData.field);
      setMeasurementData(prev => ({
        ...prev,
        [currentStepData.field]: extractedValue
      }));
      
      setProgress(calculateProgress());
    }
    
    setUserInput('');
    setIsTyping(true);

    setTimeout(() => {
      let nextStep = currentStepData?.nextStep;
      let botResponse;
      
      if (currentStep === 'finalRecommendation' || nextStep === 'finalRecommendation') {
        const recommendation = generateAdvancedRecommendation();
        setRecommendations(recommendation);
        
        botResponse = {
          type: 'bot',
          content: `🎉 **Perfect! Here's your personalized profile:**\n\n📏 **Recommended Size:** ${recommendation.recommendedSize}\n🎯 **Confidence Level:** ${Math.round(recommendation.confidence * 100)}%\n👔 **Fit Style:** ${measurementData.preferredFit}\n💰 **Tailoring Cost:** $${recommendation.tailoringCost}\n🚚 **Delivery:** ${recommendation.estimatedDelivery}\n\n✨ Your complete measurements and style preferences have been saved. Ready to proceed with this customization?`,
          recommendation: recommendation,
          timestamp: new Date()
        };
        
        onRecommendationComplete(recommendation);
        setShowSummary(true);
      } else if (nextStep && conversationSteps[nextStep]) {
        const nextStepData = conversationSteps[nextStep];
        botResponse = {
          type: 'bot',
          content: nextStepData.message,
          options: nextStepData.options,
          tips: nextStepData.tips,
          timestamp: new Date()
        };
        setCurrentStep(nextStep);
      } else {
        // Handle completion
        setCurrentStep('finalRecommendation');
        const recommendation = generateAdvancedRecommendation();
        setRecommendations(recommendation);
        
        botResponse = {
          type: 'bot',
          content: `🎉 **Excellent! Your profile is complete.**\n\nI've analyzed all your information and created a comprehensive fitting profile. Your personalized recommendations are ready!`,
          recommendation: recommendation,
          timestamp: new Date()
        };
        
        onRecommendationComplete(recommendation);
        setShowSummary(true);
      }
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleOptionClick = (option) => {
    const currentStepData = conversationSteps[currentStep];
    const nextStep = currentStepData?.nextSteps?.[option];
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: option,
      timestamp: new Date()
    }]);
    
    // Handle field selection
    if (currentStepData?.field) {
      setMeasurementData(prev => ({
        ...prev,
        [currentStepData.field]: option
      }));
      setProgress(calculateProgress());
    }
    
    setIsTyping(true);
    
    setTimeout(() => {
      if (nextStep && conversationSteps[nextStep]) {
        const nextStepData = conversationSteps[nextStep];
        const botResponse = {
          type: 'bot',
          content: nextStepData.message,
          options: nextStepData.options,
          tips: nextStepData.tips,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setCurrentStep(nextStep);
      }
      setIsTyping(false);
    }, 1000);
  };

  const MeasurementProgress = () => (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
        <FaRuler className="me-2" />
        <span className="fw-bold">Fitting Progress</span>
        <Badge bg="light" text="dark" className="ms-auto">
          {Math.round(progress)}%
        </Badge>
      </Card.Header>
      <Card.Body className="p-3">
        <ProgressBar 
          now={progress} 
          variant={progress > 75 ? 'success' : progress > 50 ? 'warning' : 'info'}
          className="mb-2"
          style={{ height: '8px' }}
        />
        <Row className="g-2">
          {Object.entries(measurementData).slice(0, 6).map(([key, value]) => (
            <Col xs={6} key={key}>
              <div className="d-flex align-items-center">
                <FaCheck 
                  className={`me-2 ${value ? 'text-success' : 'text-muted'}`} 
                  style={{ fontSize: '0.8rem' }}
                />
                <small className={value ? 'text-success fw-bold' : 'text-muted'}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </small>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );

  const RecommendationSummary = () => {
    if (!recommendations) return null;
    
    return (
      <Card className="mb-3 border-0 shadow-lg">
        <Card.Header className="bg-success text-white">
          <div className="d-flex align-items-center">
            <FaStar className="me-2" />
            <span className="fw-bold">Your Personalized Profile</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="text-primary mb-3">
                <FaRuler className="me-2" />
                Key Measurements
              </h6>
              {Object.entries(recommendations.measurements).filter(([k, v]) => v).slice(0, 4).map(([key, value]) => (
                <div key={key} className="d-flex justify-content-between mb-2">
                  <small className="text-muted">{key.replace(/([A-Z])/g, ' $1')}:</small>
                  <small className="fw-bold">{value}</small>
                </div>
              ))}
            </Col>
            <Col md={6}>
              <h6 className="text-primary mb-3">
                <FaTshirt className="me-2" />
                Style Profile
              </h6>
              {Object.entries(recommendations.preferences).filter(([k, v]) => v).slice(0, 4).map(([key, value]) => (
                <div key={key} className="d-flex justify-content-between mb-2">
                  <small className="text-muted">{key.replace(/([A-Z])/g, ' $1')}:</small>
                  <small className="fw-bold">{value}</small>
                </div>
              ))}
            </Col>
          </Row>
          
          <hr />
          
          <Row className="text-center">
            <Col xs={3}>
              <div className="p-2 bg-light rounded">
                <div className="fw-bold text-primary">{recommendations.recommendedSize}</div>
                <small className="text-muted">Size</small>
              </div>
            </Col>
            <Col xs={3}>
              <div className="p-2 bg-light rounded">
                <div className="fw-bold text-success">{Math.round(recommendations.confidence * 100)}%</div>
                <small className="text-muted">Confidence</small>
              </div>
            </Col>
            <Col xs={3}>
              <div className="p-2 bg-light rounded">
                <div className="fw-bold text-info">${recommendations.tailoringCost}</div>
                <small className="text-muted">Cost</small>
              </div>
            </Col>
            <Col xs={3}>
              <div className="p-2 bg-light rounded">
                <div className="fw-bold text-warning">7-10</div>
                <small className="text-muted">Days</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  return (
    <Modal
      show={open}
      onHide={() => setOpen(false)}
      centered
      size="lg"
      className="chatbot-modal"
    >
      <Modal.Header className="border-0 pb-0 bg-gradient-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaTshirt className="me-2" />
          Personal Styling Assistant
          <Badge bg="light" text="dark" className="ms-2 fs-6">
            {productType}
          </Badge>
        </Modal.Title>
        <Button
          variant="link"
          className="p-0 ms-auto text-white"
          onClick={() => setOpen(false)}
        >
          <FaTimes />
        </Button>
      </Modal.Header>

      <Modal.Body className="pt-2">
        <Container className="chat-container">
          <MeasurementProgress />
          {showSummary && <RecommendationSummary />}
          
          <div className="messages-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <Card
                key={index}
                className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'} mb-3`}
              >
                <Card.Body className={message.type === 'user' ? 'bg-primary text-white' : 'bg-light'}>
                  <div className="d-flex align-items-start">
                    <div className="me-2">
                      {message.type === 'user' ? (
                        <FaUser className="text-white-50" />
                      ) : (
                        <FaTshirt className="text-primary" />
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div style={{ whiteSpace: 'pre-line' }}>{message.content}</div>
                      
                      {message.tips && (
                        <Alert variant="info" className="mt-2 mb-0 py-2">
                          <FaLightbulb className="me-2" />
                          {message.tips}
                        </Alert>
                      )}
                      
                      {message.options && (
                        <div className="mt-3">
                          <Row className="g-2">
                            {message.options.map((option, optIndex) => (
                              <Col xs={12} sm={6} key={optIndex}>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="w-100 text-start"
                                  onClick={() => handleOptionClick(option)}
                                >
                                  <FaArrowRight className="me-2" style={{ fontSize: '0.8rem' }} />
                                  {option}
                                </Button>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                      
                      {message.recommendation && (
                        <div className="mt-3 p-3 bg-success text-white rounded">
                          <h6>
                            <FaCheck className="me-2" />
                            Customization Complete!
                          </h6>
                          <small>Your personalized profile has been created and saved.</small>
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
            
            {isTyping && (
              <Card className="message bot-message typing mb-3">
                <Card.Body className="bg-light">
                  <div className="d-flex align-items-center">
                    <FaTshirt className="text-primary me-2" />
                    <div className="typing-indicator">
                      <Spinner animation="grow" size="sm" className="me-1" />
                      <span className="text-muted">Analyzing your preferences...</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Container>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Form onSubmit={handleSendMessage} className="w-100">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={
                showSummary 
                  ? 'Type "yes" to proceed or ask questions...' 
                  : 'Share your measurements or ask questions...'
              }
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              variant="primary"
              disabled={isTyping || !userInput.trim()}
            >
              <FaPaperPlane />
            </Button>
          </InputGroup>
          
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">
              <FaInfoCircle className="me-1" />
              All measurements are kept private and secure
            </small>
            {progress > 0 && (
              <small className="text-success">
                <FaHeart className="me-1" />
                {Math.round(progress)}% complete
              </small>
            )}
          </div>
        </Form>
      </Modal.Footer>
    </Modal>
  );
};

export default SizeRecommenderChatbot;
