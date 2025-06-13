import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Form,
  Card,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  ProgressBar,
} from 'react-bootstrap';
import {
  FaRobot,
  FaUser,
  FaRuler,
  FaTshirt,
  FaQuestionCircle,
  FaCheck,
  FaTimes,
  FaPaperPlane,
  FaLightbulb,
  FaHeart,
  FaShoppingCart,
  FaPalette,
  FaDollarSign,
  FaWeight,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const UserInfoChatbot = ({ show, onHide, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('welcome');
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState({
    height: '',
    weight: '',
    reason: '',
    favoriteColors: [],
    budget: '',
    bodyType: '',
    preferredFit: '',
  });
  const [progress, setProgress] = useState(0);
  const chatEndRef = useRef(null);

  const totalSteps = 6; // height, weight, reason, colors, budget, completion

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (show) {
      initializeChat();
    }
  }, [show]);

  const initializeChat = () => {
    setCurrentStep('welcome');
    setProgress(0);
    setUserProfile({
      height: '',
      weight: '',
      reason: '',
      favoriteColors: [],
      budget: '',
      bodyType: '',
      preferredFit: '',
    });
    setChatHistory([
      {
        type: 'bot',
        message: "👋 Hello! I'm your personal style consultant. I'll help you find the perfect suit by asking a few quick questions. This will only take 2 minutes!",
        timestamp: new Date(),
        options: [
          { text: '🚀 Let\'s Get Started!', action: 'start-questions' },
          { text: '❌ Maybe Later', action: 'close' }
        ]
      }
    ]);
  };

  const addMessage = (type, message, options = null, data = null) => {
    const newMessage = {
      type,
      message,
      timestamp: new Date(),
      options,
      data
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const simulateTyping = (duration = 1500) => {
    setIsTyping(true);
    return new Promise(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        resolve();
      }, duration);
    });
  };

  const updateProgress = (step) => {
    const stepProgress = (step / totalSteps) * 100;
    setProgress(stepProgress);
  };

  const handleOptionClick = async (action, data = null) => {
    // Add user's choice to chat
    if (data?.text) {
      addMessage('user', data.text);
    }
    
    await simulateTyping();

    switch (action) {
      case 'start-questions':
        askHeight();
        break;
      case 'height-response':
        handleHeight(data);
        break;
      case 'weight-response':
        handleWeight(data);
        break;
      case 'reason-response':
        handleReason(data);
        break;
      case 'color-response':
        handleColors(data);
        break;
      case 'budget-question':
        askBudget();
        break;
      case 'budget-response':
        handleBudget(data);
        break;
      case 'generate-recommendations':
        generateRecommendations();
        break;
      case 'shop-recommendations':
        // Handle the shop recommendations action
        if (onComplete) {
          const recommendations = calculateRecommendations();
          onComplete(recommendations);
        }
        onHide();
        break;
      case 'continue-questions':
        // Continue with the current step or restart
        if (currentStep === 'welcome') {
          askHeight();
        } else {
          addMessage('bot', "Let's continue with finding your perfect suit!");
        }
        break;
      case 'close':
        onHide();
        break;
      default:
        addMessage('bot', "Let me help you with that. Let's continue with the questions!");
    }
  };

  const askHeight = () => {
    setCurrentStep('height');
    updateProgress(1);
    addMessage('bot', 
      "Great! Let's start with your height. This helps me recommend the right fit and proportions.",
      [
        { text: '5\'6" - 5\'8"', action: 'height-response', data: { value: '5\'6"-5\'8"', text: '5\'6" - 5\'8"' } },
        { text: '5\'9" - 5\'11"', action: 'height-response', data: { value: '5\'9"-5\'11"', text: '5\'9" - 5\'11"' } },
        { text: '6\'0" - 6\'2"', action: 'height-response', data: { value: '6\'0"-6\'2"', text: '6\'0" - 6\'2"' } },
        { text: '6\'3" or taller', action: 'height-response', data: { value: '6\'3"+', text: '6\'3" or taller' } },
        { text: 'Under 5\'6"', action: 'height-response', data: { value: 'Under 5\'6"', text: 'Under 5\'6"' } }
      ]
    );
  };

  const handleHeight = (data) => {
    setUserProfile(prev => ({ ...prev, height: data.value }));
    setCurrentStep('weight');
    updateProgress(2);
    addMessage('bot', 
      "Perfect! Now, what's your approximate weight range? This helps me suggest the best fit style.",
      [
        { text: '120-150 lbs', action: 'weight-response', data: { value: '120-150', text: '120-150 lbs' } },
        { text: '150-180 lbs', action: 'weight-response', data: { value: '150-180', text: '150-180 lbs' } },
        { text: '180-210 lbs', action: 'weight-response', data: { value: '180-210', text: '180-210 lbs' } },
        { text: '210-240 lbs', action: 'weight-response', data: { value: '210-240', text: '210-240 lbs' } },
        { text: 'Over 240 lbs', action: 'weight-response', data: { value: '240+', text: 'Over 240 lbs' } }
      ]
    );
  };

  const handleWeight = (data) => {
    setUserProfile(prev => ({ ...prev, weight: data.value }));
    setCurrentStep('reason');
    updateProgress(3);
    addMessage('bot', 
      "Excellent! What's the main reason you're looking for a suit? This helps me recommend the perfect style and formality level.",
      [
        { text: '💼 Business/Work', action: 'reason-response', data: { value: 'business', text: '💼 Business/Work' } },
        { text: '💒 Wedding (Mine)', action: 'reason-response', data: { value: 'wedding-groom', text: '💒 Wedding (Mine)' } },
        { text: '🎉 Wedding Guest', action: 'reason-response', data: { value: 'wedding-guest', text: '🎉 Wedding Guest' } },
        { text: '🎭 Special Event', action: 'reason-response', data: { value: 'special-event', text: '🎭 Special Event' } },
        { text: '🌟 General/Multiple', action: 'reason-response', data: { value: 'general', text: '🌟 General/Multiple' } }
      ]
    );
  };

  const handleReason = (data) => {
    setUserProfile(prev => ({ ...prev, reason: data.value }));
    setCurrentStep('colors');
    updateProgress(4);
    addMessage('bot', 
      "Great choice! What are your favorite colors for suits? You can select multiple options.",
      [
        { text: '🖤 Black', action: 'color-response', data: { value: 'black', text: '🖤 Black' } },
        { text: '🔵 Navy Blue', action: 'color-response', data: { value: 'navy', text: '🔵 Navy Blue' } },
        { text: '⚫ Charcoal Gray', action: 'color-response', data: { value: 'charcoal', text: '⚫ Charcoal Gray' } },
        { text: '🔘 Light Gray', action: 'color-response', data: { value: 'light-gray', text: '🔘 Light Gray' } },
        { text: '🤎 Brown', action: 'color-response', data: { value: 'brown', text: '🤎 Brown' } },
        { text: '✅ I\'m done selecting', action: 'budget-question', data: { value: 'done', text: '✅ I\'m done selecting colors' } }
      ]
    );
  };

  const handleColors = (data) => {
    if (data.value && data.value !== 'done') {
      const newColors = [...userProfile.favoriteColors];
      if (!newColors.includes(data.value)) {
        newColors.push(data.value);
        setUserProfile(prev => ({ ...prev, favoriteColors: newColors }));
        
        addMessage('bot', 
          `Great! Added ${data.text} to your preferences. ${newColors.length > 0 ? `\n\nSelected colors: ${newColors.join(', ')}` : ''}\n\nWould you like to select more colors?`,
          [
            { text: '🖤 Black', action: 'color-response', data: { value: 'black', text: '🖤 Black' } },
            { text: '🔵 Navy Blue', action: 'color-response', data: { value: 'navy', text: '🔵 Navy Blue' } },
            { text: '⚫ Charcoal Gray', action: 'color-response', data: { value: 'charcoal', text: '⚫ Charcoal Gray' } },
            { text: '🔘 Light Gray', action: 'color-response', data: { value: 'light-gray', text: '🔘 Light Gray' } },
            { text: '🤎 Brown', action: 'color-response', data: { value: 'brown', text: '🤎 Brown' } },
            { text: '✅ I\'m done selecting', action: 'budget-question', data: { value: 'done', text: '✅ I\'m done selecting colors' } }
          ]
        );
      } else {
        addMessage('bot', 
          `You've already selected ${data.text}. Please choose another color or finish selecting.`,
          [
            { text: '🖤 Black', action: 'color-response', data: { value: 'black', text: '🖤 Black' } },
            { text: '🔵 Navy Blue', action: 'color-response', data: { value: 'navy', text: '🔵 Navy Blue' } },
            { text: '⚫ Charcoal Gray', action: 'color-response', data: { value: 'charcoal', text: '⚫ Charcoal Gray' } },
            { text: '🔘 Light Gray', action: 'color-response', data: { value: 'light-gray', text: '🔘 Light Gray' } },
            { text: '🤎 Brown', action: 'color-response', data: { value: 'brown', text: '🤎 Brown' } },
            { text: '✅ I\'m done selecting', action: 'budget-question', data: { value: 'done', text: '✅ I\'m done selecting colors' } }
          ]
        );
      }
    } else {
      // User is done selecting colors, move to budget question
      askBudget();
    }
  };

  const askBudget = () => {
    setCurrentStep('budget');
    updateProgress(5);
    addMessage('bot', 
      "Perfect! Finally, what's your budget range for this suit? This helps me show you the best options in your price range.",
      [
        { text: '💰 Under $500', action: 'budget-response', data: { value: 'under-500', text: '💰 Under $500' } },
        { text: '💎 $500 - $1,000', action: 'budget-response', data: { value: '500-1000', text: '💎 $500 - $1,000' } },
        { text: '👑 $1,000 - $2,000', action: 'budget-response', data: { value: '1000-2000', text: '👑 $1,000 - $2,000' } },
        { text: '💸 Over $2,000', action: 'budget-response', data: { value: 'over-2000', text: '💸 Over $2,000' } },
        { text: '🤔 I\'m flexible', action: 'budget-response', data: { value: 'flexible', text: '🤔 I\'m flexible' } }
      ]
    );
  };

  const handleBudget = (data) => {
    setUserProfile(prev => ({ ...prev, budget: data.value }));
    setCurrentStep('completion');
    updateProgress(6);
    addMessage('bot', 
      "🎉 Perfect! I have all the information I need. Let me analyze your preferences and find the perfect suits for you!",
      [
        { text: '✨ Show Me My Recommendations', action: 'generate-recommendations' }
      ]
    );
  };

  const generateRecommendations = async () => {
    await simulateTyping(2000);
    
    const recommendations = calculateRecommendations();
    
    addMessage('bot', 
      `🎯 **Your Personalized Recommendations**

**Based on your profile:**
• Height: ${userProfile.height}
• Weight: ${userProfile.weight} lbs
• Purpose: ${getReasonText(userProfile.reason)}
• Favorite Colors: ${userProfile.favoriteColors.join(', ') || 'Not specified'}
• Budget: ${getBudgetText(userProfile.budget)}

**My Recommendations:**
${recommendations.message}

**Recommended Size:** ${recommendations.size}
**Best Fit Style:** ${recommendations.fitStyle}
**Top Color Choices:** ${recommendations.colors.join(', ')}

Ready to see your perfect suits?`,
      [
        { text: '🛍️ Shop My Recommendations', action: 'shop-recommendations' },
        { text: '🔄 Start Over', action: 'start-questions' },
        { text: '❌ Close', action: 'close' }
      ],
      recommendations
    );

    // Call the parent callback with recommendations
    if (onComplete) {
      onComplete(recommendations);
    }
  };

  const calculateRecommendations = () => {
    const { height, weight, reason, favoriteColors, budget } = userProfile;
    
    // Calculate recommended size based on height and weight
    let size = 'Medium';
    let fitStyle = 'Regular Fit';
    
    // Size calculation logic
    if (height.includes('Under 5\'6"') || height.includes('5\'6"-5\'8"')) {
      if (weight.includes('120-150') || weight.includes('150-180')) {
        size = 'Small';
        fitStyle = 'Slim Fit';
      } else {
        size = 'Medium';
        fitStyle = 'Regular Fit';
      }
    } else if (height.includes('5\'9"-5\'11"')) {
      if (weight.includes('120-150')) {
        size = 'Small';
        fitStyle = 'Slim Fit';
      } else if (weight.includes('150-180') || weight.includes('180-210')) {
        size = 'Medium';
        fitStyle = 'Regular Fit';
      } else {
        size = 'Large';
        fitStyle = 'Classic Fit';
      }
    } else if (height.includes('6\'0"-6\'2"') || height.includes('6\'3"+')) {
      if (weight.includes('150-180')) {
        size = 'Medium Tall';
        fitStyle = 'Slim Fit';
      } else if (weight.includes('180-210')) {
        size = 'Large Tall';
        fitStyle = 'Regular Fit';
      } else {
        size = 'X-Large Tall';
        fitStyle = 'Classic Fit';
      }
    }

    // Color recommendations based on reason and preferences
    let colors = [];
    if (favoriteColors.length > 0) {
      colors = favoriteColors;
    } else {
      // Default recommendations based on reason
      switch (reason) {
        case 'business':
          colors = ['navy', 'charcoal', 'black'];
          break;
        case 'wedding-groom':
          colors = ['black', 'navy', 'charcoal'];
          break;
        case 'wedding-guest':
          colors = ['navy', 'charcoal', 'light-gray'];
          break;
        case 'special-event':
          colors = ['black', 'navy', 'charcoal'];
          break;
        default:
          colors = ['navy', 'charcoal', 'black'];
      }
    }

    // Generate personalized message
    let message = '';
    switch (reason) {
      case 'business':
        message = 'For business wear, I recommend classic, professional styles that project confidence and authority.';
        break;
      case 'wedding-groom':
        message = 'For your special day, I recommend our premium wedding collection with perfect tailoring and elegant details.';
        break;
      case 'wedding-guest':
        message = 'For wedding guest attire, I recommend sophisticated styles that are elegant but not too formal.';
        break;
      case 'special-event':
        message = 'For special events, I recommend versatile styles that can work for multiple occasions.';
        break;
      default:
        message = 'Based on your preferences, I recommend versatile suits that work for multiple occasions.';
    }

    return {
      size,
      fitStyle,
      colors,
      message,
      reason,
      budget,
      height,
      weight,
      category: getRecommendedCategory(reason),
      priceRange: getPriceRange(budget)
    };
  };

  const getReasonText = (reason) => {
    const reasonMap = {
      'business': 'Business/Work',
      'wedding-groom': 'Wedding (Groom)',
      'wedding-guest': 'Wedding Guest',
      'special-event': 'Special Event',
      'general': 'General/Multiple'
    };
    return reasonMap[reason] || reason;
  };

  const getBudgetText = (budget) => {
    const budgetMap = {
      'under-500': 'Under $500',
      '500-1000': '$500 - $1,000',
      '1000-2000': '$1,000 - $2,000',
      'over-2000': 'Over $2,000',
      'flexible': 'Flexible'
    };
    return budgetMap[budget] || budget;
  };

  const getRecommendedCategory = (reason) => {
    switch (reason) {
      case 'wedding-groom':
        return 'Tuxedos';
      case 'business':
      case 'wedding-guest':
      case 'special-event':
      case 'general':
      default:
        return 'Suits';
    }
  };

  const getPriceRange = (budget) => {
    switch (budget) {
      case 'under-500':
        return { min: 0, max: 500 };
      case '500-1000':
        return { min: 500, max: 1000 };
      case '1000-2000':
        return { min: 1000, max: 2000 };
      case 'over-2000':
        return { min: 2000, max: 10000 };
      default:
        return { min: 0, max: 10000 };
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    addMessage('user', userInput);
    setUserInput('');
    
    // Simple response logic
    setTimeout(() => {
      addMessage('bot', 
        "Thanks for your message! Let's continue with the questions to find your perfect suit.",
        [
          { text: '👍 Continue Questions', action: 'continue-questions' },
          { text: '❌ Close', action: 'close' }
        ]
      );
    }, 1000);
  };

  const renderMessage = (message, index) => {
    const isBot = message.type === 'bot';
    
    return (
      <div key={index} className={`message ${isBot ? 'bot-message' : 'user-message'} mb-3`}>
        <div className="d-flex align-items-start">
          {isBot && (
            <div className="bot-avatar me-2">
              <FaRobot className="text-primary" size={24} />
            </div>
          )}
          <div className={`message-content ${isBot ? 'bot-content' : 'user-content'}`}>
            <div className={`message-bubble ${isBot ? 'bg-light' : 'bg-primary text-white'} p-3 rounded`}>
              <div style={{ whiteSpace: 'pre-line' }}>{message.message}</div>
              {message.options && (
                <div className="message-options mt-3">
                  {message.options.map((option, optIndex) => (
                    <Button
                      key={optIndex}
                      variant={isBot ? "outline-primary" : "outline-light"}
                      size="sm"
                      className="me-2 mb-2"
                      onClick={() => handleOptionClick(option.action, option.data || { text: option.text })}
                    >
                      {option.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <small className="text-muted">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
          {!isBot && (
            <div className="user-avatar ms-2">
              <FaUser className="text-secondary" size={20} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaRobot className="me-2" />
          Personal Style Consultant
          <Badge bg="success" className="ms-2">AI Powered</Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {/* Progress Bar */}
        <div className="progress-container p-3 bg-light border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">Progress</small>
            <small className="text-muted">{Math.round(progress)}% Complete</small>
          </div>
          <ProgressBar now={progress} variant="primary" style={{ height: '8px' }} />
        </div>

        <div className="chat-container" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <div className="chat-messages flex-grow-1 p-3" style={{ overflowY: 'auto', maxHeight: '400px' }}>
            {chatHistory.map((message, index) => renderMessage(message, index))}
            {isTyping && (
              <div className="typing-indicator mb-3">
                <div className="d-flex align-items-center">
                  <FaRobot className="text-primary me-2" size={24} />
                  <div className="typing-dots">
                    <Spinner animation="grow" size="sm" className="me-1" />
                    <span className="text-muted">Consultant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input border-top p-3">
            <Form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="me-2"
                />
                <Button type="submit" variant="primary">
                  <FaPaperPlane />
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <small className="text-muted">
          <FaLightbulb className="me-1" />
          Your personal style consultant • Quick & Easy • 2 minutes
        </small>
      </Modal.Footer>

      <style jsx>{`
        .message {
          animation: fadeInUp 0.3s ease;
        }
        
        .bot-content {
          max-width: 80%;
        }
        
        .user-content {
          max-width: 80%;
          margin-left: auto;
        }
        
        .message-bubble {
          border-radius: 18px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .bot-avatar, .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .typing-dots {
          display: flex;
          align-items: center;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .message-options .btn {
          transition: all 0.2s ease;
        }
        
        .message-options .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .progress-container {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        }
      `}</style>
    </Modal>
  );
};

export default UserInfoChatbot; 