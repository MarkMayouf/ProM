import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, Button, Form, ProgressBar, Alert 
} from 'react-bootstrap';
import { 
  FaComments, FaUser, FaTape, FaRuler,
  FaInfoCircle, FaCheck, FaArrowLeft,
  FaSave, FaExclamationTriangle, FaShoppingBag,
  FaClock, FaDollarSign
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const CONVERSATION_STEPS = [
  {
    id: 'customizationType',
    question: 'What would you like to customize today?',
    type: 'select',
    options: [
      { value: 'full', label: 'Full Suit Customization' },
      { value: 'jacket', label: 'Jacket Only' },
      { value: 'pants', label: 'Pants Only' }
    ]
  },
  {
    id: 'alterations',
    question: 'What alterations would you like?',
    type: 'multiselect',
    options: {
      full: [
        { value: 'jacket_shoulders', label: 'Jacket Shoulders ($15)' },
        { value: 'jacket_sleeves', label: 'Jacket Sleeves ($10)' },
        { value: 'jacket_chest', label: 'Jacket Chest ($15)' },
        { value: 'pants_length', label: 'Pants Length ($10)' },
        { value: 'pants_waist', label: 'Pants Waist ($15)' }
      ],
      jacket: [
        { value: 'jacket_shoulders', label: 'Shoulders ($15)' },
        { value: 'jacket_sleeves', label: 'Sleeves ($10)' },
        { value: 'jacket_chest', label: 'Chest ($15)' }
      ],
      pants: [
        { value: 'pants_length', label: 'Length ($10)' },
        { value: 'pants_waist', label: 'Waist ($15)' },
        { value: 'pants_seat', label: 'Seat ($12)' }
      ]
    }
  },
  {
    id: 'urgency',
    question: 'When do you need the alterations completed?',
    type: 'select',
    options: [
      { value: 'standard', label: 'Standard (7-10 days)', price: 0 },
      { value: 'rush', label: 'Rush (3-5 days)', price: 20 },
      { value: 'express', label: 'Express (1-2 days)', price: 35 }
    ]
  }
];

const ALTERATION_PRICING = {
  jacket_shoulders: 15,
  jacket_sleeves: 10,
  jacket_chest: 15,
  pants_length: 10,
  pants_waist: 15,
  pants_seat: 12
};

const URGENCY_PRICING = {
  standard: 0,
  rush: 20,
  express: 35
};

const CustomizationChatbot = ({ show, onHide, onComplete, product }) => {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userSelections, setUserSelections] = useState({
    customizationType: '',
    alterations: [],
    urgency: ''
  });
  const [progress, setProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (show) {
      resetChat();
    }
  }, [show]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetChat = () => {
    setMessages([]);
    setCurrentStep(0);
    setUserSelections({
      customizationType: '',
      alterations: [],
      urgency: ''
    });
    setProgress(0);
    setShowSummary(false);
    setTotalCost(0);
    startConversation();
  };

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addMessage = (message, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
      scrollToBottom();
    }, delay);
  };

  const startConversation = () => {
    setMessages([
      {
        type: 'bot',
        text: `Welcome to your personalized alteration consultation for the ${product?.name || 'suit'}! 👋`,
        icon: FaComments
      }
    ]);

    setTimeout(() => {
      askQuestion(0);
    }, 1000);
  };

  const askQuestion = (stepIndex) => {
    if (stepIndex >= CONVERSATION_STEPS.length) {
      showFinalSummary();
      return;
    }

    const step = CONVERSATION_STEPS[stepIndex];
    let options = step.options;

    // If this is the alterations step, get the correct options based on customization type
    if (step.id === 'alterations') {
      options = step.options[userSelections.customizationType] || [];
    }

    addMessage({
      type: 'bot',
      text: step.question,
      options: options,
      step: step
    });
  };

  const handleSelection = (step, value) => {
    // Prevent duplicate selections for single-select options
    if (step.type === 'select' && userSelections[step.id] === value) {
      return;
    }

    // Handle multi-select options
    if (step.type === 'multiselect') {
      setUserSelections(prev => ({
        ...prev,
        [step.id]: prev[step.id].includes(value)
          ? prev[step.id].filter(v => v !== value)
          : [...prev[step.id], value]
      }));
    } else {
      // Handle single-select options
      setUserSelections(prev => ({
        ...prev,
        [step.id]: value
      }));

      // Add user's response as a message
      addMessage({
        type: 'user',
        text: step.options.find(opt => opt.value === value)?.label || value
      });

      // Update progress
      const newProgress = ((currentStep + 1) / CONVERSATION_STEPS.length) * 100;
      setProgress(newProgress);

      // Move to next question
      setCurrentStep(prev => prev + 1);
      
      // Ask next question after a delay
      setTimeout(() => {
        askQuestion(currentStep + 1);
      }, 1000);
    }
  };

  const calculateTotalCost = () => {
    let cost = 0;

    // Add up alteration costs
    userSelections.alterations.forEach(alteration => {
      cost += ALTERATION_PRICING[alteration] || 0;
    });

    // Add urgency fee
    cost += URGENCY_PRICING[userSelections.urgency] || 0;

    return cost;
  };

  const showFinalSummary = () => {
    const cost = calculateTotalCost();
    setTotalCost(cost);

    addMessage({
      type: 'bot',
      text: "Here's a summary of your selections:",
      icon: FaInfoCircle
    });

    const alterationLabels = userSelections.alterations.map(alt => 
      CONVERSATION_STEPS[1].options[userSelections.customizationType]
        .find(opt => opt.value === alt)?.label
    ).filter(Boolean);

    const urgencyOption = CONVERSATION_STEPS[2].options
      .find(opt => opt.value === userSelections.urgency);

    addMessage({
      type: 'bot',
      text: `Type: ${userSelections.customizationType.toUpperCase()}\n` +
            `Alterations: ${alterationLabels.join(', ') || 'None'}\n` +
            `Timing: ${urgencyOption?.label || 'Standard'}\n` +
            `Total Cost: $${cost}`,
      icon: FaDollarSign
    });

    setShowSummary(true);
  };

  const handleComplete = () => {
    onComplete({
      selections: userSelections,
      totalCost
    });
    toast.success('Your alteration preferences have been saved!');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaShoppingBag className="me-2" />
          Customization Assistant
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <ProgressBar 
          now={progress} 
          variant="success" 
          className="rounded-0"
          style={{ height: '4px' }}
        />
        <div className="chat-container p-3" style={{ height: '60vh', overflowY: 'auto' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.type} mb-3 ${message.type === 'bot' ? 'text-start' : 'text-end'}`}
            >
              <div className={`d-inline-block p-3 rounded-3 ${
                message.type === 'bot' ? 'bg-light' : 'bg-dark text-white'
              }`}>
                {message.icon && <message.icon className="me-2" />}
                {message.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                {message.options && (
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {message.options.map((option, i) => (
                      <Button
                        key={i}
                        variant={
                          message.step?.type === 'multiselect'
                            ? userSelections[message.step.id]?.includes(option.value)
                              ? 'dark'
                              : 'outline-dark'
                            : userSelections[message.step?.id] === option.value
                            ? 'dark'
                            : 'outline-dark'
                        }
                        className="rounded-pill"
                        onClick={() => handleSelection(message.step, option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot mb-3">
              <div className="d-inline-block p-3 rounded-3 bg-light">
                <FaComments className="me-2" />
                Typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-3 border-top">
          {showSummary ? (
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={resetChat}>
                <FaArrowLeft /> Start Over
              </Button>
              <Button variant="dark" className="flex-grow-1" onClick={handleComplete}>
                Save Preferences <FaCheck className="ms-2" />
              </Button>
            </div>
          ) : (
            <Alert variant="info" className="mb-0">
              <FaInfoCircle className="me-2" />
              {currentStep < CONVERSATION_STEPS.length
                ? "Select your preferences to continue"
                : "Processing your selections..."}
            </Alert>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CustomizationChatbot;
