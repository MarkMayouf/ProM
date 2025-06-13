import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Form, Card, Tab, Tabs, Modal, Badge, Alert, InputGroup } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch } from 'react-redux';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaTag, FaPercentage, FaCalendarAlt, FaList, FaBoxOpen, FaChartLine, FaSave, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiSlice } from '../../slices/apiSlice';
import { useGetProductsQuery } from '../../slices/productsApiSlice';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';
import { useUpdateProductMutation } from '../../slices/productsApiSlice';
import Meta from '../../components/Meta';

// Create the coupon endpoints as a subslice
const couponsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: (params = {}) => {
        const { type } = params;
        let url = '/api/coupons';
        
        // If type is specified, add as query parameter
        if (type) {
          url = `/api/coupons?type=${type}`;
        }
        
        return {
          url,
        };
      },
      providesTags: ['Coupon'],
      keepUnusedDataFor: 5,
    }),
    createCoupon: builder.mutation({
      query: (data) => ({
        url: '/api/coupons',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: builder.mutation({
      query: ({ couponId, ...data }) => ({
        url: `/api/coupons/${couponId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/api/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupon'],
    }),
  }),
});

// Create the promotions endpoints as a subslice
const promotionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPromotions: builder.query({
      query: () => '/api/promotions',
      keepUnusedDataFor: 5,
    }),
    createPromotion: builder.mutation({
      query: (data) => ({
        url: '/api/promotions',
        method: 'POST',
        body: data,
      }),
    }),
    updatePromotion: builder.mutation({
      query: ({ promotionId, ...data }) => ({
        url: `/api/promotions/${promotionId}`,
        method: 'PUT',
        body: data,
      }),
    }),
    deletePromotion: builder.mutation({
      query: (id) => ({
        url: `/api/promotions/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

// Export the hooks
export const {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApiSlice;

export const {
  useGetPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} = promotionsApiSlice;

const MarketingDashboardScreen = () => {
  const dispatch = useDispatch();
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('coupons');
  
  // Coupon state
  const { data: coupons, isLoading: loadingCoupons, error: errorCoupons, refetch: refetchCoupons } = useGetCouponsQuery();
  const { data: promoCodes, isLoading: loadingPromoCodes, error: errorPromoCodes, refetch: refetchPromoCodes } = useGetCouponsQuery({ type: 'promo' });
  const [deleteCoupon, { isLoading: loadingDelete }] = useDeleteCouponMutation();
  const [createCoupon, { isLoading: loadingCreate }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: loadingUpdate }] = useUpdateCouponMutation();
  
  // Promo code state (separate from coupons)
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editPromoId, setEditPromoId] = useState(null);
  const [promoData, setPromoData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 15,
    minimumPurchaseAmount: 50,
    isActive: true,
    validFrom: new Date(),
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    usageLimitPerCoupon: 100,
    usageLimitPerUser: 1,
    isPromoCode: true
  });
  
  // Products state for sales
  const { data: productsData, isLoading: loadingProducts } = useGetProductsQuery({});
  const [updateProduct] = useUpdateProductMutation();
  
  // Flash sale state
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [flashSaleData, setFlashSaleData] = useState({
    title: 'Flash Sale',
    discountPercent: 20,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    products: []
  });
  
  // Coupon form state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editCouponId, setEditCouponId] = useState(null);
  const [couponData, setCouponData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchaseAmount: 0,
    isActive: true,
    validFrom: new Date(),
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    usageLimitPerCoupon: '',
    usageLimitPerUser: '',
    productCategories: []
  });
  
  // Filtered products for flash sale selection
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Load filtered products when search changes
  useEffect(() => {
    if (productsData && productsData.products) {
      setFilteredProducts(
        productsData.products
          .filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 50) // Limit to first 50 matches
      );
    }
  }, [searchTerm, productsData]);
  
  // Set selected products when flashSaleData.products changes
  useEffect(() => {
    if (flashSaleData.products && productsData?.products) {
      const selectedIds = flashSaleData.products.map(p => p.productId);
      setSelectedProducts(selectedIds);
    }
  }, [flashSaleData.products, productsData]);

  // Automatic code generation functions
  const generateCouponCode = () => {
    const prefixes = ['SAVE', 'DEAL', 'OFFER', 'SHOP', 'BUY'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(Math.random() * 90) + 10; // 10-99
    return `${prefix}${randomNum}`;
  };

  const generatePromoCode = () => {
    const prefixes = ['PROMO', 'SPECIAL', 'WELCOME', 'NEW', 'EXTRA'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
    return `${prefix}${randomNum}`;
  };

  // Handle coupon delete
  const deleteCouponHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id).unwrap();
        toast.success('Coupon deleted');
        refetchCoupons();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };
  
    // Reset coupon form
  const resetCouponForm = () => {
    setEditCouponId(null);
    setCouponData({
      code: generateCouponCode(),
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minimumPurchaseAmount: 0,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      usageLimitPerCoupon: '',
      usageLimitPerUser: '',
      productCategories: []
    });
  };

  // Open coupon modal for create
  const openCreateCouponModal = () => {
    resetCouponForm();
    setShowCouponModal(true);
  };
  
  // Open coupon modal for edit
  const openEditCouponModal = (coupon) => {
    setEditCouponId(coupon._id);
    setCouponData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumPurchaseAmount: coupon.minimumPurchaseAmount || 0,
      isActive: coupon.isActive,
      validFrom: new Date(coupon.validFrom),
      validUntil: new Date(coupon.validUntil),
      usageLimitPerCoupon: coupon.usageLimitPerCoupon || '',
      usageLimitPerUser: coupon.usageLimitPerUser || '',
      productCategories: coupon.productCategories || []
    });
    setShowCouponModal(true);
  };

  // Promo code handlers
  const resetPromoForm = () => {
    setEditPromoId(null);
    setPromoData({
      code: generatePromoCode(),
      description: '',
      discountType: 'percentage',
      discountValue: 15,
      minimumPurchaseAmount: 50,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      usageLimitPerCoupon: 100,
      usageLimitPerUser: 1,
      isPromoCode: true
    });
  };

  const openCreatePromoModal = () => {
    resetPromoForm();
    setShowPromoModal(true);
  };

  const openEditPromoModal = (promo) => {
    setEditPromoId(promo._id);
    setPromoData({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumPurchaseAmount: promo.minimumPurchaseAmount || 0,
      isActive: promo.isActive,
      validFrom: new Date(promo.validFrom),
      validUntil: new Date(promo.validUntil),
      usageLimitPerCoupon: promo.usageLimitPerCoupon || 100,
      usageLimitPerUser: promo.usageLimitPerUser || 1,
      isPromoCode: true
    });
    setShowPromoModal(true);
  };

  const deletePromoHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await deleteCoupon(id).unwrap();
        toast.success('Promo code deleted');
        refetchPromoCodes();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };
  
  // Handle coupon form submit
  const submitCouponHandler = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(couponData.validFrom) > new Date(couponData.validUntil)) {
      toast.error("Valid From date cannot be after Valid Until date.");
      return;
    }
    
    try {
      const formattedData = {
        ...couponData,
        code: couponData.code.toUpperCase(),
        discountValue: parseFloat(couponData.discountValue),
        minimumPurchaseAmount: parseFloat(couponData.minimumPurchaseAmount),
        usageLimitPerCoupon: couponData.usageLimitPerCoupon === "" ? null : parseInt(couponData.usageLimitPerCoupon, 10),
        usageLimitPerUser: couponData.usageLimitPerUser === "" ? null : parseInt(couponData.usageLimitPerUser, 10),
      };
      
      if (editCouponId) {
        // Update existing coupon
        await updateCoupon({
          couponId: editCouponId,
          ...formattedData
        }).unwrap();
        toast.success('Coupon updated successfully');
      } else {
        // Create new coupon
        await createCoupon(formattedData).unwrap();
        toast.success('Coupon created successfully');
      }
      
      setShowCouponModal(false);
      refetchCoupons();
      resetCouponForm();
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'An error occurred');
    }
  };

  // Handle promo code form submit
  const submitPromoHandler = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(promoData.validFrom) > new Date(promoData.validUntil)) {
      toast.error("Valid From date cannot be after Valid Until date.");
      return;
    }
    
    try {
      const formattedData = {
        ...promoData,
        code: promoData.code.toUpperCase(),
        discountValue: parseFloat(promoData.discountValue),
        minimumPurchaseAmount: parseFloat(promoData.minimumPurchaseAmount),
        usageLimitPerCoupon: promoData.usageLimitPerCoupon === "" ? null : parseInt(promoData.usageLimitPerCoupon, 10),
        usageLimitPerUser: promoData.usageLimitPerUser === "" ? null : parseInt(promoData.usageLimitPerUser, 10),
        isPromoCode: true
      };
      
      if (editPromoId) {
        // Update existing promo code
        await updateCoupon({
          couponId: editPromoId,
          ...formattedData
        }).unwrap();
        toast.success('Promo code updated successfully');
      } else {
        // Create new promo code
        await createCoupon(formattedData).unwrap();
        toast.success('Promo code created successfully');
      }
      
      setShowPromoModal(false);
      refetchPromoCodes();
      resetPromoForm();
    } catch (err) {
      console.error('Error:', err);
      toast.error(err?.data?.message || err.error || 'Failed to save promo code');
    }
  };
  
  // Handle flash sale create
  const submitFlashSaleHandler = async (e) => {
    e.preventDefault();
    
    try {
      // Validate dates
      if (new Date(flashSaleData.startDate) >= new Date(flashSaleData.endDate)) {
        toast.error('End date must be after start date');
        return;
      }

      // Validate discount percentage
      const discountPercent = Number(flashSaleData.discountPercent);
      if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 90) {
        toast.error('Discount percentage must be between 1 and 90');
        return;
      }

      // Get selected products
      const selectedProductsData = filteredProducts.filter(product => selectedProducts.includes(product._id));
      
      if (selectedProductsData.length === 0) {
        toast.error('Please select at least one product for the flash sale');
        return;
      }

      // Update each product one at a time
      let successCount = 0;
      let failureCount = 0;

      for (const product of selectedProductsData) {
        try {
          // Skip if product ID is invalid
          if (!product._id?.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`Invalid product ID: ${product._id}`);
            failureCount++;
            continue;
          }

          const salePrice = Number((product.price * (1 - discountPercent / 100)).toFixed(2));

          // Format data according to the API expectations
          const updateData = {
            _id: product._id,
            name: product.name,
            price: salePrice,
            regularPrice: product.price,
            isOnSale: true, // Fixed: was 'onSale', should be 'isOnSale'
            salePrice: salePrice, // Added explicit salePrice field
            saleStartDate: flashSaleData.startDate.toISOString(),
            saleEndDate: flashSaleData.endDate.toISOString(),
            // Preserve other important product fields
            brand: product.brand,
            category: product.category,
            description: product.description,
            image: product.image,
            countInStock: product.countInStock
          };

          const result = await updateProduct(updateData).unwrap();
          
          if (result) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error(`Failed to update product ${product._id}:`, error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Flash sale created successfully with ${successCount} products!`);
        if (failureCount > 0) {
          toast.warning(`Note: ${failureCount} products could not be updated.`);
        }
        setShowFlashSaleModal(false);
        
        // Reset form
        setFlashSaleData({
          title: 'Flash Sale',
          discountPercent: 20,
          startDate: new Date(),
          endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
          products: []
        });
        setSelectedProducts([]);
        setSearchTerm('');
      } else {
        toast.error(`Failed to create flash sale. None of the ${selectedProductsData.length} products could be updated.`);
      }
    } catch (err) {
      console.error('Flash sale creation error:', err);
      toast.error(err?.data?.message || err.message || 'An error occurred creating the flash sale');
    }
  };
  
  // Toggle product selection for flash sale
  const toggleProductSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };
  
  return (
    <>
      <Meta title="Marketing Dashboard | Admin" />
      <h1>Marketing Dashboard</h1>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        fill
      >
        <Tab eventKey="coupons" title={<><FaTag className="me-2" /> Coupons</>}>
          <Row className="align-items-center mb-3">
            <Col>
              <h2>Coupons</h2>
            </Col>
            <Col className="text-end">
              <Button 
                variant="primary" 
                className="my-3"
                onClick={openCreateCouponModal}
              >
                <FaPlus /> Create Coupon
              </Button>
            </Col>
          </Row>
          
          {loadingDelete && <Loader />}
          {loadingCoupons ? (
            <Loader />
          ) : errorCoupons ? (
            <Message variant="danger">{errorCoupons?.data?.message || errorCoupons.error}</Message>
          ) : (
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>TYPE</th>
                  <th>VALUE</th>
                  <th>MIN PURCHASE</th>
                  <th>VALIDITY</th>
                  <th>STATUS</th>
                  <th>USAGE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {coupons?.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>
                      <strong>{coupon.code}</strong>
                      {coupon.description && (
                        <div className="small text-muted">{coupon.description}</div>
                      )}
                    </td>
                    <td>{coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                    <td>
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%` 
                        : `$${coupon.discountValue.toFixed(2)}`}
                    </td>
                    <td>${coupon.minimumPurchaseAmount?.toFixed(2) || '0.00'}</td>
                    <td>
                      <div className="small">
                        From: {new Date(coupon.validFrom).toLocaleDateString()}
                      </div>
                      <div className="small">
                        Until: {new Date(coupon.validUntil).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {coupon.isActive ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      <div className="small">
                        Used: {coupon.timesUsed || 0} times
                      </div>
                      {coupon.usageLimitPerCoupon && (
                        <div className="small">
                          Limit: {coupon.usageLimitPerCoupon}
                        </div>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="light"
                        className="btn-sm me-2"
                        onClick={() => openEditCouponModal(coupon)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={() => deleteCouponHandler(coupon._id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
        
        <Tab eventKey="promocodes" title={<><FaTag className="me-2" /> Promo Codes</>}>
          <Row className="align-items-center mb-3">
            <Col>
              <h2>Promo Codes</h2>
            </Col>
            <Col className="text-end">
              <Button 
                variant="success" 
                className="my-3"
                onClick={openCreatePromoModal}
              >
                <FaPlus /> Create Promo Code
              </Button>
            </Col>
          </Row>
          
          {loadingPromoCodes ? (
            <Loader />
          ) : errorPromoCodes ? (
            <Message variant="danger">
              {errorPromoCodes?.data?.message || errorPromoCodes.error || 'Failed to load promo codes'}
            </Message>
          ) : (
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>TYPE</th>
                  <th>VALUE</th>
                  <th>MIN PURCHASE</th>
                  <th>VALIDITY</th>
                  <th>STATUS</th>
                  <th>USAGE LIMITS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(promoCodes) && promoCodes.map((promo) => (
                  <tr key={promo._id}>
                    <td>
                      <strong className="text-success">{promo.code}</strong>
                      {promo.description && (
                        <div className="small text-muted">{promo.description}</div>
                      )}
                    </td>
                    <td>{promo.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                    <td>
                      <Badge bg="success">
                        {promo.discountType === 'percentage' 
                          ? `${promo.discountValue}%` 
                          : `$${promo.discountValue.toFixed(2)}`}
                      </Badge>
                    </td>
                    <td>${promo.minimumPurchaseAmount?.toFixed(2) || '0.00'}</td>
                    <td>
                      <div className="small">
                        From: {new Date(promo.validFrom).toLocaleDateString()}
                      </div>
                      <div className="small">
                        Until: {new Date(promo.validUntil).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {promo.isActive ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      <div className="small">
                        Used: {promo.timesUsed || 0} times
                      </div>
                      <div className="small">
                        Per Coupon: {promo.usageLimitPerCoupon || 'Unlimited'}
                      </div>
                      <div className="small">
                        Per User: {promo.usageLimitPerUser || 'Unlimited'}
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="light"
                        className="btn-sm me-2"
                        onClick={() => openEditPromoModal(promo)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={() => deletePromoHandler(promo._id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          {promoCodes?.length === 0 && !loadingPromoCodes && !errorPromoCodes && (
            <Alert variant="info">
              <h5>No Promo Codes Yet</h5>
              <p>Create your first promo code to start offering special discounts to your customers!</p>
            </Alert>
          )}
        </Tab>
        
        <Tab eventKey="sales" title={<><FaPercentage className="me-2" /> Flash Sales</>}>
          <Row className="align-items-center mb-3">
            <Col>
              <h2>Flash Sales</h2>
            </Col>
            <Col className="text-end">
              <Button 
                variant="primary" 
                className="my-3"
                onClick={() => setShowFlashSaleModal(true)}
              >
                <FaPlus /> Create Flash Sale
              </Button>
            </Col>
          </Row>
          
          {loadingProducts ? (
            <Loader />
          ) : (
            <>
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h3 className="h5 mb-0">Active Sales</h3>
                </Card.Header>
                <Card.Body>
                  {productsData?.products?.filter(p => p.isOnSale)?.length > 0 ? (
                    <Table responsive className="table-sm">
                      <thead>
                        <tr>
                          <th>PRODUCT</th>
                          <th>REGULAR PRICE</th>
                          <th>SALE PRICE</th>
                          <th>DISCOUNT</th>
                          <th>ENDS</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsData?.products
                          ?.filter(p => p.isOnSale)
                          ?.map((product) => {
                            const discount = product.regularPrice 
                              ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
                              : 0;
                            return (
                              <tr key={product._id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <img 
                                      src={product.image} 
                                      alt={product.name} 
                                      style={{ width: '50px', marginRight: '10px' }}
                                    />
                                    <div>
                                      <div>{product.name}</div>
                                      <div className="small text-muted">{product.category}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>${product.regularPrice?.toFixed(2) || product.price.toFixed(2)}</td>
                                <td>${product.price.toFixed(2)}</td>
                                <td>
                                  <Badge bg="danger">{discount}% OFF</Badge>
                                </td>
                                <td>
                                  {product.saleEndDate 
                                    ? new Date(product.saleEndDate).toLocaleDateString() 
                                    : 'No end date'
                                  }
                                </td>
                                <td>
                                  <Badge bg="success">Active</Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">No active sales at the moment.</Alert>
                  )}
                </Card.Body>
              </Card>
              
              <Card className="shadow-sm">
                <Card.Header className="bg-secondary text-white">
                  <h3 className="h5 mb-0">Recent Sales Performance</h3>
                </Card.Header>
                <Card.Body>
                  <Alert variant="light">
                    <FaChartLine className="me-2" /> 
                    Sales analytics feature coming soon!
                  </Alert>
                </Card.Body>
              </Card>
            </>
          )}
        </Tab>
        
        <Tab eventKey="promotions" title={<><FaCalendarAlt className="me-2" /> Seasonal Promotions</>}>
          <Row className="align-items-center mb-3">
            <Col>
              <h2>Seasonal Promotions</h2>
            </Col>
            <Col className="text-end">
              <Button 
                variant="primary" 
                className="my-3"
                disabled
              >
                <FaPlus /> Create Promotion
              </Button>
            </Col>
          </Row>
          
          <Alert variant="info">
            <h4>Coming Soon</h4>
            <p>
              The Seasonal Promotions feature is under development. This will allow you to create special 
              promotional campaigns tied to holidays, seasons, or special events.
            </p>
            <p className="mb-0">
              Features will include:
            </p>
            <ul className="mb-0">
              <li>Holiday-themed banners</li>
              <li>Special category discounts</li>
              <li>Bundle offers</li>
              <li>Gift with purchase</li>
              <li>Free shipping thresholds</li>
            </ul>
          </Alert>
        </Tab>
      </Tabs>
      
      {/* Coupon Modal */}
      <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editCouponId ? 'Edit Coupon' : 'Create New Coupon'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitCouponHandler}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Coupon Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Auto-generated code"
                    value={couponData.code}
                    onChange={(e) => setCouponData({...couponData, code: e.target.value})}
                    required
                  />
                  <Form.Text className="text-muted">
                    Codes will be converted to uppercase. Click "Generate New" for a random code.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <div>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setCouponData({...couponData, code: generateCouponCode()})}
                      className="w-100"
                    >
                      Generate New
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type</Form.Label>
                  <Form.Select
                    value={couponData.discountType}
                    onChange={(e) => setCouponData({...couponData, discountType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Value</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder={couponData.discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
                      value={couponData.discountValue}
                      onChange={(e) => setCouponData({...couponData, discountValue: e.target.value})}
                      min="0"
                      max={couponData.discountType === 'percentage' ? "100" : "1000"}
                      step="0.01"
                      required
                    />
                    <InputGroup.Text>
                      {couponData.discountType === 'percentage' ? '%' : '$'}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Purchase Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      placeholder="0.00 for no minimum"
                      value={couponData.minimumPurchaseAmount}
                      onChange={(e) => setCouponData({...couponData, minimumPurchaseAmount: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional description for this coupon"
                value={couponData.description}
                onChange={(e) => setCouponData({...couponData, description: e.target.value})}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid From</Form.Label>
                  <DatePicker
                    selected={couponData.validFrom}
                    onChange={(date) => setCouponData({...couponData, validFrom: date})}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid Until</Form.Label>
                  <DatePicker
                    selected={couponData.validUntil}
                    onChange={(date) => setCouponData({...couponData, validUntil: date})}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    minDate={couponData.validFrom}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit Per Coupon</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={couponData.usageLimitPerCoupon}
                    onChange={(e) => setCouponData({...couponData, usageLimitPerCoupon: e.target.value})}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit Per User</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={couponData.usageLimitPerUser}
                    onChange={(e) => setCouponData({...couponData, usageLimitPerUser: e.target.value})}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="isActive"
                label="Active"
                checked={couponData.isActive}
                onChange={(e) => setCouponData({...couponData, isActive: e.target.checked})}
              />
            </Form.Group>
            
            <Button variant="primary" type="submit" disabled={loadingCreate || loadingUpdate}>
              {loadingCreate || loadingUpdate ? 'Saving...' : 'Save Coupon'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Promo Code Modal */}
      <Modal show={showPromoModal} onHide={() => setShowPromoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editPromoId ? 'Edit Promo Code' : 'Create New Promo Code'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitPromoHandler}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Promo Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Auto-generated code"
                    value={promoData.code}
                    onChange={(e) => setPromoData({...promoData, code: e.target.value})}
                    required
                  />
                  <Form.Text className="text-muted">
                    Codes will be converted to uppercase. Click "Generate New" for a random code.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <div>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setPromoData({...promoData, code: generatePromoCode()})}
                      className="w-100"
                    >
                      Generate New
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type</Form.Label>
                  <Form.Select
                    value={promoData.discountType}
                    onChange={(e) => setPromoData({...promoData, discountType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Value</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder={promoData.discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
                      value={promoData.discountValue}
                      onChange={(e) => setPromoData({...promoData, discountValue: e.target.value})}
                      min="0"
                      max={promoData.discountType === 'percentage' ? "100" : "1000"}
                      step="0.01"
                      required
                    />
                    <InputGroup.Text>
                      {promoData.discountType === 'percentage' ? '%' : '$'}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Minimum Purchase Amount</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Minimum order value to use this promo"
                  value={promoData.minimumPurchaseAmount}
                  onChange={(e) => setPromoData({...promoData, minimumPurchaseAmount: e.target.value})}
                  min="0"
                  step="0.01"
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional description for this promo code"
                value={promoData.description}
                onChange={(e) => setPromoData({...promoData, description: e.target.value})}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid From</Form.Label>
                  <DatePicker
                    selected={promoData.validFrom}
                    onChange={(date) => setPromoData({...promoData, validFrom: date})}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid Until</Form.Label>
                  <DatePicker
                    selected={promoData.validUntil}
                    onChange={(date) => setPromoData({...promoData, validUntil: date})}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    minDate={promoData.validFrom}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit Per Promo</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Total uses allowed"
                    value={promoData.usageLimitPerCoupon}
                    onChange={(e) => setPromoData({...promoData, usageLimitPerCoupon: e.target.value})}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit Per User</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Uses per customer"
                    value={promoData.usageLimitPerUser}
                    onChange={(e) => setPromoData({...promoData, usageLimitPerUser: e.target.value})}
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="isPromoActive"
                label="Active"
                checked={promoData.isActive}
                onChange={(e) => setPromoData({...promoData, isActive: e.target.checked})}
              />
            </Form.Group>
            
            <Button variant="success" type="submit" disabled={loadingCreate || loadingUpdate}>
              {loadingCreate || loadingUpdate ? 'Saving...' : 'Save Promo Code'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Flash Sale Modal */}
      <Modal show={showFlashSaleModal} onHide={() => setShowFlashSaleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Flash Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitFlashSaleHandler}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sale Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="E.g., 48-Hour Flash Sale"
                    value={flashSaleData.title}
                    onChange={(e) => setFlashSaleData({...flashSaleData, title: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Percentage</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder="Enter discount percentage"
                      value={flashSaleData.discountPercent}
                      onChange={(e) => setFlashSaleData({...flashSaleData, discountPercent: e.target.value})}
                      min="1"
                      max="90"
                      required
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <DatePicker
                    selected={flashSaleData.startDate}
                    onChange={(date) => setFlashSaleData({...flashSaleData, startDate: date})}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <DatePicker
                    selected={flashSaleData.endDate}
                    onChange={(date) => setFlashSaleData({...flashSaleData, endDate: date})}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    minDate={flashSaleData.startDate}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <hr />
            
            <h5>Select Products for Sale</h5>
            <Form.Group className="mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search products by name, brand or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
            
            {loadingProducts ? (
              <Loader />
            ) : (
              <>
                <div className="selected-count mb-2">
                  <Badge bg="primary" className="p-2">
                    {selectedProducts.length} products selected
                  </Badge>
                </div>
                
                <div style={{ maxHeight: '300px', overflow: 'auto' }} className="border rounded p-2">
                  <Table hover>
                    <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                      <tr>
                        <th></th>
                        <th>Product</th>
                        <th>Regular Price</th>
                        <th>Sale Price</th>
                        <th>Discount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const discountedPrice = (product.price * (1 - flashSaleData.discountPercent / 100)).toFixed(2);
                        
                        return (
                          <tr 
                            key={product._id} 
                            onClick={() => toggleProductSelection(product._id)}
                            className={selectedProducts.includes(product._id) ? 'table-primary' : ''}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedProducts.includes(product._id)}
                                onChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                                />
                                <div>
                                  <div>{product.name}</div>
                                  <small className="text-muted">{product.category}</small>
                                </div>
                              </div>
                            </td>
                            <td>${product.price.toFixed(2)}</td>
                            <td>${discountedPrice}</td>
                            <td>
                              <Badge bg="danger">{flashSaleData.discountPercent}% OFF</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  
                  {filteredProducts.length === 0 && (
                    <Alert variant="info" className="m-3">
                      No products found matching "{searchTerm}". Try a different search term.
                    </Alert>
                  )}
                </div>
              </>
            )}
            
            <div className="d-grid gap-2 mt-3">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={selectedProducts.length === 0}
              >
                <FaSave className="me-2" />
                Create Flash Sale with {selectedProducts.length} Products
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MarketingDashboardScreen; 