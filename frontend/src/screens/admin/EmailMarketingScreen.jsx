import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col, Card, Badge, Tabs, Tab, Alert, Form, Spinner, Modal, InputGroup, ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEnvelope, FaUsers, FaChartBar, FaCheck, FaTimes, FaEye, FaPaperPlane, FaInfoCircle, FaSearch, FaFilter, FaCalendarAlt, FaExclamationTriangle, FaList, FaClock, FaBoxOpen, FaMousePointer, FaUserMinus, FaChartLine, FaChartPie, FaArrowUp, FaArrowDown, FaSpinner, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Meta from '../../components/Meta';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { format, parseISO, subDays } from 'date-fns';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(...registerables);

const EmailMarketingScreen = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [subscribersList, setSubscribersList] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [campaignPage, setCampaignPage] = useState(1);
  const [totalSubscriberPages, setTotalSubscriberPages] = useState(0);
  const [totalCampaignPages, setTotalCampaignPages] = useState(0);
  
  // Campaign form state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [campaignTargetAudience, setCampaignTargetAudience] = useState('all');
  const [campaignScheduleDate, setCampaignScheduleDate] = useState('');
  const [campaignFormLoading, setCampaignFormLoading] = useState(false);
  const [campaignFormError, setCampaignFormError] = useState('');
  
  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  
  // Send confirmation modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [campaignToSend, setCampaignToSend] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  
  // Filter states
  const [subscriberFilter, setSubscriberFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days
  
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  
  // Load data
  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers();
    } else if (activeTab === 'campaigns') {
      fetchCampaigns();
    } else if (activeTab === 'analytics') {
      fetchStats();
    }
  }, [activeTab, subscriberPage, campaignPage, subscriberFilter, campaignFilter, dateRange]);
  
  // Auto-refresh stats every 5 minutes when on analytics tab
  useEffect(() => {
    let interval;
    if (activeTab === 'analytics') {
      interval = setInterval(() => {
        fetchStats();
      }, 300000); // 5 minutes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);
  
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      let url = `/api/email/subscribers?pageNumber=${subscriberPage}`;
      if (subscriberFilter !== 'all') {
        url += `&status=${subscriberFilter}`;
      }
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      const { data } = await axios.get(url, config);
      setSubscribersList(data.subscribers);
      setTotalSubscriberPages(data.pages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };
  
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      let url = `/api/email/campaigns?pageNumber=${campaignPage}`;
      if (campaignFilter !== 'all') {
        url += `&status=${campaignFilter}`;
      }
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      const { data } = await axios.get(url, config);
      setCampaigns(data.campaigns);
      setTotalCampaignPages(data.pages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      const { data } = await axios.get('/api/email/stats', config);
      setStatsData(data);
      setLoadingStats(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoadingStats(false);
    }
  };

  // Chart configurations
  const getSubscriberGrowthChart = () => {
    if (!statsData?.trends?.dailySubscribers) return null;

    const labels = [];
    const data = [];
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      labels.push(format(date, 'MMM d'));
      
      const found = statsData.trends.dailySubscribers.find(item => item._id === dateStr);
      data.push(found ? found.count : 0);
    }

    return {
      labels,
      datasets: [{
        label: 'New Subscribers',
        data,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const getCampaignPerformanceChart = () => {
    if (!statsData?.topCampaigns?.length) return null;

    const campaigns = statsData.topCampaigns.slice(0, 5);
    
    return {
      labels: campaigns.map(c => c.subject.substring(0, 20) + (c.subject.length > 20 ? '...' : '')),
      datasets: [
        {
          label: 'Open Rate (%)',
          data: campaigns.map(c => parseFloat(c.stats?.openRate || 0)),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Click Rate (%)',
          data: campaigns.map(c => parseFloat(c.stats?.clickRate || 0)),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getSubscriberSourceChart = () => {
    if (!statsData?.subscribers?.sources?.length) return null;

    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)'
    ];

    return {
      labels: statsData.subscribers.sources.map(s => s._id || 'Unknown'),
      datasets: [{
        data: statsData.subscribers.sources.map(s => s.count),
        backgroundColor: colors.slice(0, statsData.subscribers.sources.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  const getEngagementMetricsChart = () => {
    if (!statsData?.engagementMetrics) return null;

    return {
      labels: ['Open Rate', 'Click Rate', 'Unsubscribe Rate'],
      datasets: [{
        label: 'Engagement Metrics (%)',
        data: [
          parseFloat(statsData.engagementMetrics.averageOpenRate || 0),
          parseFloat(statsData.engagementMetrics.averageClickRate || 0),
          parseFloat(statsData.engagementMetrics.unsubscribeRate || 0)
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const deleteSubscriberHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };
        await axios.delete(`/api/email/subscribers/${id}`, config);
        toast.success('Subscriber deleted successfully');
        fetchSubscribers();
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  };
  
  const deleteCampaignHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };
        await axios.delete(`/api/email/campaigns/${id}`, config);
        toast.success('Campaign deleted successfully');
        fetchCampaigns();
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  };
  
  // Campaign form handlers
  const openCampaignModal = (campaign = null) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignSubject(campaign.subject);
      setCampaignContent(campaign.content);
      setCampaignTargetAudience(campaign.targetAudience);
      if (campaign.scheduledFor) {
        setCampaignScheduleDate(new Date(campaign.scheduledFor).toISOString().substring(0, 16));
      } else {
        setCampaignScheduleDate('');
      }
    } else {
      setEditingCampaign(null);
      setCampaignSubject('');
      setCampaignContent('');
      setCampaignTargetAudience('all');
      setCampaignScheduleDate('');
    }
    setCampaignFormError('');
    setShowCampaignModal(true);
  };
  
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    
    if (!campaignSubject.trim()) {
      setCampaignFormError('Subject is required');
      return;
    }
    
    if (!campaignContent.trim()) {
      setCampaignFormError('Email content is required');
      return;
    }
    
    setCampaignFormLoading(true);
    setCampaignFormError('');
    
    const campaignData = {
      subject: campaignSubject,
      content: campaignContent,
      targetAudience: campaignTargetAudience,
      scheduledFor: campaignScheduleDate ? new Date(campaignScheduleDate).toISOString() : null
    };
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      if (editingCampaign) {
        await axios.put(`/api/email/campaigns/${editingCampaign._id}`, campaignData, config);
        toast.success('Campaign updated successfully');
      } else {
        await axios.post('/api/email/campaigns', campaignData, config);
        toast.success('Campaign created successfully');
      }
      
      setShowCampaignModal(false);
      fetchCampaigns();
    } catch (err) {
      setCampaignFormError(err.response?.data?.message || err.message);
    } finally {
      setCampaignFormLoading(false);
    }
  };
  
  const openPreviewModal = (campaign) => {
    setPreviewCampaign(campaign);
    setShowPreviewModal(true);
  };
  
  const confirmSendCampaign = (campaign) => {
    setCampaignToSend(campaign);
    setShowSendModal(true);
  };
  
  const handleSendCampaign = async () => {
    if (!campaignToSend) return;
    
    setSendingCampaign(true);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      const { data } = await axios.post(`/api/email/campaigns/${campaignToSend._id}/send`, {}, config);
      toast.success(`Campaign sent to ${data.stats.successCount} subscribers`);
      setShowSendModal(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSendingCampaign(false);
    }
  };
  
  // Quill modules config
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  return (
    <>
      <Meta title="Email Marketing Dashboard" />
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Email Marketing</h1>
        </Col>
        <Col className="text-end">
          {activeTab === 'campaigns' && (
            <Button className="my-3" onClick={() => openCampaignModal()}>
              <FaPlus /> Create Campaign
            </Button>
          )}
        </Col>
      </Row>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="subscribers" title="Subscribers">
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <Row className="align-items-center">
                <Col md={4}>
                  <Form.Group>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search subscribers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchSubscribers()}
                      />
                      <Button variant="outline-secondary" onClick={fetchSubscribers}>
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex justify-content-center">
                  <Form.Group>
                    <Form.Select
                      value={subscriberFilter}
                      onChange={(e) => setSubscriberFilter(e.target.value)}
                    >
                      <option value="all">All Subscribers</option>
                      <option value="active">Active</option>
                      <option value="inactive">Unsubscribed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="text-md-end">
                  <div className="d-flex justify-content-md-end align-items-center">
                    <span className="me-2">
                      Page {subscriberPage} of {totalSubscriberPages}
                    </span>
                    <Button
                      variant="light"
                      disabled={subscriberPage <= 1}
                      onClick={() => setSubscriberPage((prev) => Math.max(prev - 1, 1))}
                      className="me-2"
                    >
                      &lt;
                    </Button>
                    <Button
                      variant="light"
                      disabled={subscriberPage >= totalSubscriberPages}
                      onClick={() => setSubscriberPage((prev) => prev + 1)}
                    >
                      &gt;
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <Loader />
              ) : error ? (
                <Message variant="danger">{error}</Message>
              ) : subscribersList.length === 0 ? (
                <Message>No subscribers found</Message>
              ) : (
                <Table striped hover responsive className="table-sm">
                  <thead>
                    <tr>
                      <th>EMAIL</th>
                      <th>NAME</th>
                      <th>STATUS</th>
                      <th>SUBSCRIBED DATE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribersList.map((subscriber) => (
                      <tr key={subscriber._id}>
                        <td>{subscriber.email}</td>
                        <td>
                          {subscriber.firstName} {subscriber.lastName}
                        </td>
                        <td>
                          {subscriber.isActive ? (
                            <Badge bg="success">Active</Badge>
                          ) : (
                            <Badge bg="secondary">Unsubscribed</Badge>
                          )}
                        </td>
                        <td>
                          {new Date(subscriber.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="danger"
                            className="btn-sm"
                            onClick={() => deleteSubscriberHandler(subscriber._id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="campaigns" title="Campaigns">
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <Row className="align-items-center">
                <Col md={4}>
                  <Form.Group>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchCampaigns()}
                      />
                      <Button variant="outline-secondary" onClick={fetchCampaigns}>
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex justify-content-center">
                  <Form.Group>
                    <Form.Select
                      value={campaignFilter}
                      onChange={(e) => setCampaignFilter(e.target.value)}
                    >
                      <option value="all">All Campaigns</option>
                      <option value="draft">Drafts</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="sent">Sent</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="text-md-end">
                  <div className="d-flex justify-content-md-end align-items-center">
                    <span className="me-2">
                      Page {campaignPage} of {totalCampaignPages}
                    </span>
                    <Button
                      variant="light"
                      disabled={campaignPage <= 1}
                      onClick={() => setCampaignPage((prev) => Math.max(prev - 1, 1))}
                      className="me-2"
                    >
                      &lt;
                    </Button>
                    <Button
                      variant="light"
                      disabled={campaignPage >= totalCampaignPages}
                      onClick={() => setCampaignPage((prev) => prev + 1)}
                    >
                      &gt;
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <Loader />
              ) : error ? (
                <Message variant="danger">{error}</Message>
              ) : campaigns.length === 0 ? (
                <Message>
                  No campaigns found. <Link to="#" onClick={() => openCampaignModal()}>Create your first campaign</Link>
                </Message>
              ) : (
                <Table striped hover responsive className="table-sm">
                  <thead>
                    <tr>
                      <th>SUBJECT</th>
                      <th>STATUS</th>
                      <th>TARGET</th>
                      <th>CREATED</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign._id}>
                        <td>{campaign.subject}</td>
                        <td>
                          {campaign.isSent ? (
                            <Badge bg="success">Sent</Badge>
                          ) : campaign.scheduledFor ? (
                            <Badge bg="info">
                              <FaCalendarAlt className="me-1" />
                              Scheduled
                            </Badge>
                          ) : (
                            <Badge bg="secondary">Draft</Badge>
                          )}
                        </td>
                        <td>
                          {campaign.targetAudience === 'all' ? (
                            'All Subscribers'
                          ) : (
                            campaign.targetAudience
                          )}
                        </td>
                        <td>
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="info"
                            className="btn-sm me-2"
                            onClick={() => openPreviewModal(campaign)}
                          >
                            <FaEye />
                          </Button>
                          
                          {!campaign.isSent && (
                            <>
                              <Button
                                variant="primary"
                                className="btn-sm me-2"
                                onClick={() => openCampaignModal(campaign)}
                              >
                                <FaEdit />
                              </Button>
                              
                              <Button
                                variant="success"
                                className="btn-sm me-2"
                                onClick={() => confirmSendCampaign(campaign)}
                              >
                                <FaPaperPlane />
                              </Button>
                              
                              <Button
                                variant="danger"
                                className="btn-sm"
                                onClick={() => deleteCampaignHandler(campaign._id)}
                              >
                                <FaTrash />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="analytics" title={
          <span>
            <FaChartLine className="me-1" />
            Analytics
          </span>
        }>
          {loadingStats ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading analytics...</div>
            </div>
          ) : error ? (
            <Message variant="danger">{error}</Message>
          ) : statsData ? (
            <>
              {/* Key Metrics Cards */}
              <Row className="mb-4">
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaUsers className="stats-icon text-primary mb-2" size={32} />
                      <h2 className="mb-1">{statsData.subscribers.total.toLocaleString()}</h2>
                      <p className="text-muted mb-1">Total Subscribers</p>
                      <small className="text-success">
                        <FaArrowUp className="me-1" />
                        +{statsData.trends.recentActivity.newSubscribers} this week
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaEye className="stats-icon text-success mb-2" size={32} />
                      <h2 className="mb-1">{parseFloat(statsData.engagementMetrics.averageOpenRate || 0).toFixed(1)}%</h2>
                      <p className="text-muted mb-1">Avg Open Rate</p>
                      <small className="text-muted">
                        {statsData.engagementMetrics.totalEmailsOpened.toLocaleString()} opens
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaMousePointer className="stats-icon text-info mb-2" size={32} />
                      <h2 className="mb-1">{parseFloat(statsData.engagementMetrics.averageClickRate || 0).toFixed(1)}%</h2>
                      <p className="text-muted mb-1">Avg Click Rate</p>
                      <small className="text-muted">
                        {statsData.engagementMetrics.totalEmailsClicked.toLocaleString()} clicks
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaPaperPlane className="stats-icon text-warning mb-2" size={32} />
                      <h2 className="mb-1">{statsData.campaigns.sent.toLocaleString()}</h2>
                      <p className="text-muted mb-1">Campaigns Sent</p>
                      <small className="text-muted">
                        {statsData.engagementMetrics.totalEmailsSent.toLocaleString()} emails sent
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Secondary Metrics */}
              <Row className="mb-4">
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaUserMinus className="stats-icon text-danger mb-2" size={24} />
                      <h4 className="mb-1">{parseFloat(statsData.engagementMetrics.unsubscribeRate || 0).toFixed(2)}%</h4>
                      <p className="text-muted mb-0">Unsubscribe Rate</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaCheck className="stats-icon text-success mb-2" size={24} />
                      <h4 className="mb-1">{statsData.subscribers.active.toLocaleString()}</h4>
                      <p className="text-muted mb-0">Active Subscribers</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaCalendarAlt className="stats-icon text-info mb-2" size={24} />
                      <h4 className="mb-1">{statsData.campaigns.scheduled.toLocaleString()}</h4>
                      <p className="text-muted mb-0">Scheduled</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <FaEdit className="stats-icon text-secondary mb-2" size={24} />
                      <h4 className="mb-1">{statsData.campaigns.draft.toLocaleString()}</h4>
                      <p className="text-muted mb-0">Drafts</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Charts Row 1 */}
              <Row className="mb-4">
                <Col md={8}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <FaChartLine className="me-2 text-primary" />
                          Subscriber Growth (Last 30 Days)
                        </h5>
                        <Button variant="outline-primary" size="sm">
                          <FaDownload className="me-1" />
                          Export
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        {getSubscriberGrowthChart() ? (
                          <Line data={getSubscriberGrowthChart()} options={chartOptions} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                              <FaChartLine size={32} className="text-muted mb-2" />
                              <p className="text-muted">No subscriber data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <FaChartPie className="me-2 text-success" />
                        Subscriber Sources
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        {getSubscriberSourceChart() ? (
                          <Doughnut data={getSubscriberSourceChart()} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              }
                            }
                          }} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                              <FaChartPie size={32} className="text-muted mb-2" />
                              <p className="text-muted">No source data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Charts Row 2 */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <FaChartBar className="me-2 text-info" />
                        Campaign Performance
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        {getCampaignPerformanceChart() ? (
                          <Bar data={getCampaignPerformanceChart()} options={barChartOptions} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                              <FaChartBar size={32} className="text-muted mb-2" />
                              <p className="text-muted">No campaign data available yet</p>
                              <Button variant="primary" size="sm" onClick={() => setActiveTab('campaigns')}>
                                Create First Campaign
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <FaChartBar className="me-2 text-warning" />
                        Engagement Metrics
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        {getEngagementMetricsChart() ? (
                          <Bar data={getEngagementMetricsChart()} options={barChartOptions} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                              <FaChartBar size={32} className="text-muted mb-2" />
                              <p className="text-muted">No engagement data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Recent Activity & Top Campaigns */}
              <Row>
                <Col md={6}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <FaArrowUp className="me-2 text-success" />
                        Recent Activity (Last 7 Days)
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                        <div>
                          <h6 className="mb-1">New Subscribers</h6>
                          <small className="text-muted">People who joined this week</small>
                        </div>
                        <div className="text-end">
                          <h4 className="mb-0 text-success">{statsData.trends.recentActivity.newSubscribers}</h4>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                        <div>
                          <h6 className="mb-1">Campaigns Sent</h6>
                          <small className="text-muted">Campaigns sent this week</small>
                        </div>
                        <div className="text-end">
                          <h4 className="mb-0 text-primary">{statsData.trends.recentActivity.campaignsSent}</h4>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <div>
                          <h6 className="mb-1">Unsubscribes</h6>
                          <small className="text-muted">People who unsubscribed</small>
                        </div>
                        <div className="text-end">
                          <h4 className="mb-0 text-danger">{statsData.trends.recentActivity.unsubscribes}</h4>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <FaArrowUp className="me-2 text-warning" />
                        Top Performing Campaigns
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {statsData.topCampaigns && statsData.topCampaigns.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {statsData.topCampaigns.slice(0, 5).map((campaign, index) => (
                            <div key={campaign._id} className="list-group-item border-0 px-0">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">{campaign.subject}</h6>
                                  <small className="text-muted">
                                    Sent: {new Date(campaign.sentAt).toLocaleDateString()}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <Badge bg="success" className="me-1">
                                    {parseFloat(campaign.stats?.openRate || 0).toFixed(1)}% open
                                  </Badge>
                                  <Badge bg="info">
                                    {parseFloat(campaign.stats?.clickRate || 0).toFixed(1)}% click
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <FaEnvelope size={32} className="text-muted mb-2" />
                          <p className="text-muted">No campaigns sent yet</p>
                          <Button variant="primary" size="sm" onClick={() => setActiveTab('campaigns')}>
                            Create Your First Campaign
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div className="text-center py-5">
              <FaChartLine size={48} className="text-muted mb-3" />
              <h5>No Analytics Data Available</h5>
              <p className="text-muted">Start by creating campaigns and gaining subscribers to see analytics.</p>
              <Button variant="primary" onClick={() => setActiveTab('campaigns')}>
                Create First Campaign
              </Button>
            </div>
          )}
        </Tab>
      </Tabs>
      
      {/* Campaign Modal */}
      <Modal show={showCampaignModal} onHide={() => setShowCampaignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {campaignFormError && (
            <Alert variant="danger">{campaignFormError}</Alert>
          )}
          
          <Form onSubmit={handleCampaignSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Subject Line</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter email subject"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Target Audience</Form.Label>
              <Form.Select
                value={campaignTargetAudience}
                onChange={(e) => setCampaignTargetAudience(e.target.value)}
              >
                <option value="all">All Subscribers</option>
                <option value="newsletter">Newsletter Subscribers</option>
                <option value="promotions">Promotion Subscribers</option>
                <option value="productUpdates">Product Updates Subscribers</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Schedule Send (Optional)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={campaignScheduleDate}
                onChange={(e) => setCampaignScheduleDate(e.target.value)}
              />
              <Form.Text className="text-muted">
                Leave blank to save as draft
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email Content</Form.Label>
              <ReactQuill
                theme="snow"
                value={campaignContent}
                onChange={setCampaignContent}
                modules={quillModules}
                style={{ height: '300px', marginBottom: '50px' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCampaignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCampaignSubmit}
            disabled={campaignFormLoading}
          >
            {campaignFormLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Campaign'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Campaign Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewCampaign && (
            <>
              <div className="mb-3 pb-3 border-bottom">
                <strong>Subject:</strong> {previewCampaign.subject}
              </div>
              
              <div className="mb-3 pb-3 border-bottom">
                <strong>Status:</strong>{' '}
                {previewCampaign.isSent ? (
                  <Badge bg="success">Sent</Badge>
                ) : previewCampaign.scheduledFor ? (
                  <Badge bg="info">
                    Scheduled for {new Date(previewCampaign.scheduledFor).toLocaleString()}
                  </Badge>
                ) : (
                  <Badge bg="secondary">Draft</Badge>
                )}
              </div>
              
              {previewCampaign.isSent && previewCampaign.stats && (
                <div className="mb-3 pb-3 border-bottom">
                  <strong>Performance:</strong>
                  <div className="d-flex flex-wrap mt-2">
                    <div className="me-3 mb-2">
                      <Badge bg="primary" className="me-1">Sent:</Badge>
                      {previewCampaign.stats.totalSent || 0}
                    </div>
                    <div className="me-3 mb-2">
                      <Badge bg="success" className="me-1">Opened:</Badge>
                      {previewCampaign.stats.openCount || 0}
                      {' '}
                      ({previewCampaign.stats.openRate || '0'}%)
                    </div>
                    <div className="me-3 mb-2">
                      <Badge bg="info" className="me-1">Clicked:</Badge>
                      {previewCampaign.stats.clickCount || 0}
                      {' '}
                      ({previewCampaign.stats.clickRate || '0'}%)
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <strong>Content:</strong>
                <div 
                  className="email-preview-content mt-3 p-3 border rounded"
                  dangerouslySetInnerHTML={{ __html: previewCampaign.content }}
                ></div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Send Confirmation Modal */}
      <Modal show={showSendModal} onHide={() => setShowSendModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExclamationTriangle className="text-warning me-2" />
            Confirm Send Campaign
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to send this campaign? This action cannot be undone.
          </p>
          <p>
            <strong>Subject:</strong> {campaignToSend?.subject}
          </p>
          <p>
            <strong>Target:</strong> {campaignToSend?.targetAudience === 'all' ? 'All Subscribers' : campaignToSend?.targetAudience}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSendModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSendCampaign}
            disabled={sendingCampaign}
          >
            {sendingCampaign ? (
              <>
                <Spinner size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              'Send Campaign'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <style jsx="true">{`
        .stats-icon {
          opacity: 0.8;
        }
        
        .email-preview-content {
          max-height: 500px;
          overflow-y: auto;
          background-color: #fff;
        }
        
        .email-preview-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </>
  );
};

export default EmailMarketingScreen; 