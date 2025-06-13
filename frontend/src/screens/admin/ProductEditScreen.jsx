import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Card, ProgressBar } from 'react-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import MultipleImageUploader from '../../components/MultipleImageUploader';
import { toast } from 'react-toastify';
import {
  useGetProductDetailsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useCreateProductMutation,
} from '../../slices/productsApiSlice';
import { FaArrowLeft, FaArrowRight, FaSave, FaImage, FaTimes, FaInfoCircle } from 'react-icons/fa';

const ProductEditScreen = () => {
  const { id: productId } = useParams();
  // Check if in create mode or edit mode
  const isCreateMode = productId === 'create';

  // Form step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Product fields state
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [regularPrice, setRegularPrice] = useState(0);
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [fit, setFit] = useState('');
  const [style, setStyle] = useState('');
  const [pieces, setPieces] = useState(2);
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState(0);
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [sizes, setSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [productLoaded, setProductLoaded] = useState(false);
  const fileInputRef = useRef(null);

  const productQueryOptions = useMemo(() => ({
    skip: isCreateMode, // Only skip if we're in create mode
    refetchOnMountOrArgChange: false, // Prevent unnecessary refetches
    refetchOnFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
    pollingInterval: 0, // Disable polling completely
  }), [isCreateMode]);

  const {
    data: product,
    isLoading,
    refetch,
    error,
  } = useGetProductDetailsQuery(productId, productQueryOptions);

  const [updateProduct, { isLoading: loadingUpdate }] = useUpdateProductMutation();
  const [createProduct, { isLoading: loadingCreate }] = useCreateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] = useUploadProductImageMutation();
  const navigate = useNavigate();

  // Enhanced useEffect to guide user to top of screen when step changes
  useEffect(() => {
    // Smooth scroll to top when step changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Add visual feedback for step change
    const stepIndicator = document.querySelector('.progress-bar');
    if (stepIndicator) {
      stepIndicator.style.transition = 'all 0.3s ease';
      stepIndicator.style.transform = 'scale(1.02)';
      setTimeout(() => {
        stepIndicator.style.transform = 'scale(1)';
      }, 300);
    }
    
    // Focus on the first input of the new step for better accessibility
    setTimeout(() => {
      const firstInput = document.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput && typeof firstInput.focus === 'function') {
        firstInput.focus();
      }
    }, 400);
  }, [currentStep]);

  // Initialize empty product state for create mode
  const initialProduct = {
    name: '',
    price: 0,
    description: '',
    image: '/images/sample.jpg', // Use sample.jpg as default placeholder
    brand: '',
    category: '',
    subCategory: '',
    countInStock: 0,
    color: '',
    material: '',
    fit: '',
    style: '',
    pieces: 1,
    isOnSale: false,
    sizes: []
  };

  // Initialize state with either product data or initial values
  useEffect(() => {
    if (!isCreateMode && product && !productLoaded) {
      setName(product.name || '');
      setPrice(product.price || 0);
      setRegularPrice(product.regularPrice || product.price || 0);
      setImage(product.image || '/images/sample.jpg');
      setImages(product.images || []);
      setBrand(product.brand || '');
      setCategory(product.category || '');
      setSubCategory(product.subCategory || '');
      setCountInStock(product.countInStock || 0);
      setDescription(product.description || '');
      setColor(product.color || '');
      setMaterial(product.material || '');
      setFit(product.fit || 'Regular');
      setStyle(product.style || 'Business');
      setPieces(product.pieces || 2);
      setIsOnSale(product.isOnSale || false);
      setSalePrice(product.salePrice || (product.price ? product.price * 0.9 : 0));
      setSaleStartDate(product.saleStartDate ? new Date(product.saleStartDate).toISOString().split('T')[0] : '');
      setSaleEndDate(product.saleEndDate ? new Date(product.saleEndDate).toISOString().split('T')[0] : '');
      
      // Set sizes if they exist
      if (product.sizes && product.sizes.length > 0) {
        setSizes(product.sizes);
      }
      setProductLoaded(true);
    } else if (isCreateMode && !productLoaded) {
      // Set initial values for create mode
      setName('');
      setPrice(0);
      setRegularPrice(0);
      setImage('/images/sample.jpg'); // Use sample.jpg as default for create mode
      setBrand('');
      setCategory('');
      setSubCategory('');
      setCountInStock(0);
      setDescription('');
      setColor('');
      setMaterial('');
      setFit('Regular');
      setStyle('Business');
      setPieces(2);
      setIsOnSale(false);
      setSalePrice(0);
      setSaleStartDate('');
      setSaleEndDate('');
      setSizes([]);
      setProductLoaded(true);
    }
  }, [isCreateMode, product, productLoaded]);

  // Get appropriate sizes for the selected category - only set once when category changes
  useEffect(() => {
    if (category && productLoaded) {
      if (category === 'Suits' || category === 'Tuxedos' || category === 'Blazers') {
        // Only set sizes if we're creating a new product or if the product doesn't have sizes yet
        if (isCreateMode || (!isCreateMode && (!product?.sizes || product.sizes.length === 0))) {
          setSizes([
            { size: '38R', quantity: 0 },
            { size: '40R', quantity: 0 },
            { size: '42R', quantity: 0 },
            { size: '44R', quantity: 0 },
            { size: '46R', quantity: 0 },
            { size: '48R', quantity: 0 }
          ]);
        }
      } else if (category === 'Shoes') {
        if (isCreateMode || (!isCreateMode && (!product?.sizes || product.sizes.length === 0))) {
          setSizes([
            { size: 'US 7 / EU 40', quantity: 0 },
            { size: 'US 8 / EU 41', quantity: 0 },
            { size: 'US 9 / EU 42', quantity: 0 },
            { size: 'US 10 / EU 43', quantity: 0 },
            { size: 'US 11 / EU 44', quantity: 0 },
            { size: 'US 12 / EU 45', quantity: 0 }
          ]);
        }
              } else if (category === 'Dress Shirts' || category === 'Shirts') {
        if (isCreateMode || (!isCreateMode && (!product?.sizes || product.sizes.length === 0))) {
          setSizes([
            { size: 'S', quantity: 0 },
            { size: 'M', quantity: 0 },
            { size: 'L', quantity: 0 },
            { size: 'XL', quantity: 0 },
            { size: 'XXL', quantity: 0 }
          ]);
        }
      } else {
        // For Accessories and other categories that don't have sizes
        if (isCreateMode) {
          setSizes([]);
        }
      }

      // Reset subcategory when category changes
      if (isCreateMode) {
        setSubCategory('');
      }
    }
  }, [category, productLoaded, isCreateMode]);

  // Handle whether product needs sizes
  const productNeedsSizes = () => {
    return ['Suits', 'Tuxedos', 'Blazers', 'Shoes', 'Dress Shirts', 'Shirts'].includes(category);
  };

  // Handle next step with validation
  const handleNextStep = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // Validate current step
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!category) {
          toast.error('Please select a category');
          return false;
        }
        if (category !== 'Accessories' && !subCategory) {
          toast.error('Please select a sub-category');
          return false;
        }
        if (!name || name.trim() === '') {
          toast.error('Please enter a product name');
          return false;
        }
        if (!brand || brand.trim() === '') {
          toast.error('Please enter a brand');
          return false;
        }
        if (!description || description.trim() === '') {
          toast.error('Please enter a description');
          return false;
        }
        return true;

      case 2:
        // Allow default sample image or uploaded image
        if (!image && !isCreateMode) {
          toast.error('Please provide an image');
          return false;
        }
        if (!color || color.trim() === '') {
          toast.error('Please enter a color');
          return false;
        }
        if (!material || material.trim() === '') {
          toast.error('Please enter a material');
          return false;
        }
        if (!fit) {
          toast.error('Please select a fit');
          return false;
        }
        if (!style) {
          toast.error('Please select a style');
          return false;
        }
        if ((category === 'Suits' || category === 'Tuxedos') && !pieces) {
          toast.error('Please select number of pieces');
          return false;
        }
        return true;

      case 3:
        if (!price || price <= 0) {
          toast.error('Please enter a valid price');
          return false;
        }
        if (!countInStock || countInStock < 0) {
          toast.error('Please enter a valid stock count');
          return false;
        }
        return true;

      case 4:
        // Final validation before submission
        if (productNeedsSizes() && sizes.length === 0) {
          toast.error('Please add at least one size for this product type');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (currentStep < totalSteps) {
      handleNextStep();
      return;
    }

    // Validate final step before submission
    if (!validateCurrentStep()) {
      return;
    }

    try {
      const productData = {
        name,
        price: Number(price),
        regularPrice: Number(regularPrice),
        image,
        images,
        brand,
        category,
        subCategory,
        countInStock: Number(countInStock),
        description,
        color,
        material,
        fit,
        style,
        pieces: Number(pieces),
        isOnSale,
        salePrice: isOnSale ? Number(salePrice) : null,
        saleStartDate: isOnSale ? saleStartDate : null,
        saleEndDate: isOnSale ? saleEndDate : null,
        sizes: productNeedsSizes() ? sizes : []
      };

      if (isCreateMode) {
        await createProduct(productData).unwrap();
        toast.success('Product created successfully');
      } else {
        await updateProduct({
          _id: productId,
          ...productData,
        }).unwrap();
        toast.success('Product updated');
      }

      refetch();
      navigate('/admin/productlist');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadFileHandler = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the file input
      return;
    }

    // Validate file type - include more supported formats
    const validTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/svg+xml', 
      'image/bmp', 
      'image/tiff'
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF, WebP, SVG, BMP, or TIFF)');
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the file input
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await uploadProductImage(formData).unwrap();
      if (res.imageUrl) {
        setImage(res.imageUrl);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err?.data?.message || 'Failed to upload image. Please try again.');
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the file input
    }
  }, [uploadProductImage, fileInputRef]);

  const handleImagesUploaded = useCallback((uploadedImages) => {
    if (uploadedImages && uploadedImages.length > 0) {
      setImages(prev => [...prev, ...uploadedImages]);
      toast.success(`${uploadedImages.length} images added successfully`);
    } else {
      toast.error('No images were uploaded. Please try again.');
    }
  }, []);

  const removeImage = useCallback((indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  // Handle deleting existing uploaded images
  const handleDeleteExistingImage = useCallback((imageUrl) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setImages(prev => prev.filter(img => img !== imageUrl));
      toast.success('Image removed from product');
    }
  }, []);

  // Memoized input handlers to prevent re-renders
  const handleImageUrlChange = useCallback((e) => {
    setImage(e.target.value);
  }, []);

  const handleColorChange = useCallback((e) => {
    setColor(e.target.value);
  }, []);

  const handleMaterialChange = useCallback((e) => {
    setMaterial(e.target.value);
  }, []);

  const handleFitChange = useCallback((e) => {
    setFit(e.target.value);
  }, []);

  const handleStyleChange = useCallback((e) => {
    setStyle(e.target.value);
  }, []);

  // Memoize static arrays to prevent re-renders
  const categories = useMemo(() => ['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts', 'Accessories', 'Shoes'], []);
  
  const fitOptions = useMemo(() => ['Regular', 'Slim', 'Relaxed'], []);
  const styleOptions = useMemo(() => ['Business', 'Casual', 'Sport'], []);
  const piecesOptions = useMemo(() => [2, 3], []);
  
  const subCategoryOptions = useMemo(() => ({
    'Suits': ['business', 'wedding', 'formal', 'casual'],
    'Tuxedos': ['tuxedos'],
    'Blazers': ['blazers'],
    'Shoes': ['oxford', 'derby', 'loafers', 'boots'],
    'Accessories': ['ties', 'belts', 'cufflinks', 'pocketsquares'],
    'Dress Shirts': ['formal', 'casual'],
    'Shirts': ['dress-shirts', 'casual-shirts', 'polo-shirts', 't-shirts', 'henley-shirts', 'button-down-shirts'],
  }), []);
  
  // Memoize the image preview to prevent unnecessary re-renders
  const imagePreview = useMemo(() => {
    if (!image) return null;
    
    return (
      <div className="mb-3" key="image-preview-container">
        <img
          src={image}
          alt="Product preview"
          style={{ 
            width: '200px', 
            height: '200px', 
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/sample.jpg';
          }}
        />
        {image === '/images/sample.jpg' && (
          <small className="text-muted d-block">Default placeholder image</small>
        )}
      </div>
    );
  }, [image]);
  


  // Go to previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="mb-4">
            <Card.Header as="h5">Step 1: Basic Product Information</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group controlId='category'>
                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                    <Form.Select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value=''>Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId='subCategory'>
                    <Form.Label>Sub-Category <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      disabled={!category}
                      required
                    >
                      <option value=''>Select Sub-Category</option>
                      {category && subCategoryOptions[category]?.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Group controlId='name'>
                    <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter product name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group controlId='brand'>
                    <Form.Label>Brand <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter brand'
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId='description'>
                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as='textarea'
                      rows={3}
                      placeholder='Enter description'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      case 2:
        return (
          <Card className="mb-4">
            <Card.Header as="h5">Step 2: Product Details</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group controlId='image' key="main-image-upload">
                    <Form.Label>Image {!isCreateMode && <span className="text-danger">*</span>}</Form.Label>
                    {imagePreview}
                    <Form.Control
                      type='text'
                      placeholder='Enter image url'
                      value={image}
                      onChange={handleImageUrlChange}
                      required={!isCreateMode}
                      key="image-url-input"
                    />
                    <Form.Control
                      ref={fileInputRef}
                      type='file'
                      onChange={uploadFileHandler}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff"
                      className="mt-2"
                      key="image-file-input"
                    />
                    {loadingUpload && <Loader />}
                    <Form.Text className="text-muted">
                      Supported formats: JPG, PNG, GIF, WebP, SVG, BMP, TIFF (Max 5MB)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-4" key="multiple-image-uploader-row">
                <Col md={12}>
                  <div key="multi-uploader-container">
                    <MultipleImageUploader
                      onImagesUploaded={handleImagesUploaded}
                      existingImages={images}
                      maxFiles={10}
                      allowDelete={true}
                      onDeleteImage={handleDeleteExistingImage}
                      key="multiple-image-uploader"
                    />
                  </div>
                </Col>
              </Row>
              
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group controlId='color'>
                    <Form.Label>Color <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter color'
                      value={color}
                      onChange={handleColorChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group controlId='material'>
                    <Form.Label>Material <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter material'
                      value={material}
                      onChange={handleMaterialChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId='fit'>
                    <Form.Label>Fit <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={fit}
                      onChange={handleFitChange}
                      required
                    >
                      <option value=''>Select Fit</option>
                      {fitOptions.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group controlId='style'>
                    <Form.Label>Style <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={style}
                      onChange={handleStyleChange}
                      required
                    >
                      <option value=''>Select Style</option>
                      {styleOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                {(category === 'Suits' || category === 'Tuxedos') && (
                  <Col md={6}>
                    <Form.Group controlId='pieces'>
                      <Form.Label>Pieces <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={pieces}
                        onChange={(e) => setPieces(e.target.value)}
                        required
                      >
                        <option value=''>Select Pieces</option>
                        {piecesOptions.map((p) => (
                          <option key={p} value={p}>{p}-piece</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        );
      case 3:
        return (
          <Card className="mb-4">
            <Card.Header as="h5">Step 3: Pricing and Inventory</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group controlId='price'>
                    <Form.Label>Price <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type='number'
                      step="0.01"
                      placeholder='Enter price'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId='regularPrice'>
                    <Form.Label>Regular Price</Form.Label>
                    <Form.Control
                      type='number'
                      step="0.01"
                      placeholder='Enter regular price'
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-4">
                <Col md={12}>
                  <h5>Sale Settings</h5>
                </Col>
              </Row>
              
              <Row className="mt-2">
                <Col md={3}>
                  <Form.Group controlId='isOnSale'>
                    <Form.Check
                      type='checkbox'
                      label='On Sale'
                      checked={isOnSale}
                      onChange={(e) => {
                        setIsOnSale(e.target.checked);
                        if (e.target.checked && !salePrice) {
                          setSalePrice((price * 0.9).toFixed(2));
                        }
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId='salePrice'>
                    <Form.Label>Sale Price</Form.Label>
                    <Form.Control
                      type='number'
                      step='0.01'
                      placeholder='Enter sale price'
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      disabled={!isOnSale}
                    />
                    {isOnSale && price && salePrice && (
                      <Form.Text className="text-muted">
                        Discount: {((1 - (salePrice / price)) * 100).toFixed(0)}% off
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId='saleStartDate'>
                    <Form.Label>Sale Start Date</Form.Label>
                    <Form.Control
                      type='date'
                      value={saleStartDate}
                      onChange={(e) => setSaleStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={!isOnSale}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId='saleEndDate'>
                    <Form.Label>Sale End Date</Form.Label>
                    <Form.Control
                      type='date'
                      value={saleEndDate}
                      onChange={(e) => setSaleEndDate(e.target.value)}
                      min={saleStartDate || new Date().toISOString().split('T')[0]}
                      disabled={!isOnSale}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-4">
                <Col md={12}>
                  <Form.Group controlId='countInStock'>
                    <Form.Label>Total Inventory</Form.Label>
                    <Form.Control
                      type='number'
                      placeholder='Enter total inventory'
                      value={countInStock}
                      onChange={(e) => setCountInStock(e.target.value)}
                      disabled={sizes.length > 0}
                    />
                    {sizes.length > 0 && (
                      <Form.Text className="text-muted">
                        Total inventory is calculated from sizes below
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      case 4:
        return (
          <Card className="mb-4">
            <Card.Header as="h5">Step 4: Inventory Management</Card.Header>
            <Card.Body>
              {productNeedsSizes() ? (
                <>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group controlId='sizes_list'>
                        <Form.Label>Available Sizes</Form.Label>
                        <Form.Control 
                          as="select"
                          multiple={true}
                          value={selectedSizes}
                          onChange={handleSizeSelection}
                          className="mb-3"
                        >
                          {category === 'Suits' || category === 'Tuxedos' || category === 'Blazers' ? (
                            <>
                              <option value="38R">38R</option>
                              <option value="40R">40R</option>
                              <option value="42R">42R</option>
                              <option value="44R">44R</option>
                              <option value="46R">46R</option>
                              <option value="48R">48R</option>
                              <option value="38S">38S</option>
                              <option value="40S">40S</option>
                              <option value="42S">42S</option>
                              <option value="44S">44S</option>
                              <option value="46S">46S</option>
                              <option value="38L">38L</option>
                              <option value="40L">40L</option>
                              <option value="42L">42L</option>
                              <option value="44L">44L</option>
                              <option value="46L">46L</option>
                              <option value="48L">48L</option>
                            </>
                          ) : category === 'Shoes' ? (
                            <>
                              <option value="US 7 / EU 40">US 7 / EU 40</option>
                              <option value="US 8 / EU 41">US 8 / EU 41</option>
                              <option value="US 9 / EU 42">US 9 / EU 42</option>
                              <option value="US 10 / EU 43">US 10 / EU 43</option>
                              <option value="US 11 / EU 44">US 11 / EU 44</option>
                              <option value="US 12 / EU 45">US 12 / EU 45</option>
                            </>
                          ) : (
                            <>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                            </>
                          )}
                        </Form.Control>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={addSelectedSizes}
                          className="mb-3"
                        >
                          Add Selected Sizes
                        </Button>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {sizes.length > 0 ? (
                    <>
                      <p className="mb-3">Set inventory quantities for each size:</p>
                      <Form.Group controlId='sizes'>
                        {sizes.map((sizeObj, index) => (
                          <Row key={sizeObj.size} className='mb-2 align-items-center'>
                            <Col md={4}>
                              <Form.Control
                                value={sizeObj.size}
                                readOnly
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Control
                                type='number'
                                placeholder='Quantity'
                                value={sizeObj.quantity}
                                onChange={(e) => {
                                  const newSizes = [...sizes];
                                  newSizes[index].quantity = Number(e.target.value);
                                  setSizes(newSizes);
                                  
                                  // Update total countInStock
                                  const total = newSizes.reduce((sum, size) => sum + Number(size.quantity), 0);
                                  setCountInStock(total);
                                }}
                              />
                            </Col>
                            <Col md={2}>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => removeSize(index)}
                              >
                                Remove
                              </Button>
                            </Col>
                          </Row>
                        ))}
                      </Form.Group>
                      
                      <Row className="mt-3">
                        <Col md={12}>
                          <p>Total inventory: {countInStock}</p>
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <Message variant="info">
                      Please add some sizes from the dropdown above to set inventory quantities.
                    </Message>
                  )}
                </>
              ) : (
                // For products without sizes (e.g., accessories)
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId='countInStock'>
                      <Form.Label>Total Inventory</Form.Label>
                      <Form.Control
                        type='number'
                        placeholder='Enter total inventory'
                        value={countInStock}
                        onChange={(e) => setCountInStock(Number(e.target.value))}
                      />
                      <Form.Text className="text-muted mt-2">
                        This product category doesn't require sizes. Just enter the total inventory quantity.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        );
      default:
        return null;
    }
  };

  // Add these functions to handle sizes
  const handleSizeSelection = (e) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedSizes(values);
  };

  const addSelectedSizes = () => {
    if (selectedSizes.length === 0) return;
    
    const newSizes = [...sizes];
    selectedSizes.forEach(size => {
      if (!newSizes.some(s => s.size === size)) {
        newSizes.push({ size, quantity: 0 });
      }
    });
    
    setSizes(newSizes);
    setSelectedSizes([]);
  };

  const removeSize = (index) => {
    const newSizes = [...sizes];
    newSizes.splice(index, 1);
    setSizes(newSizes);
    
    // Update total countInStock
    const total = newSizes.reduce((sum, size) => sum + Number(size.quantity), 0);
    setCountInStock(total);
  };

  return (
    <>
      <Link to='/admin/productlist' className='btn btn-light my-3'>
        Go Back
      </Link>
      <FormContainer>
        <h1>{isCreateMode ? 'Create Product' : 'Edit Product'}</h1>
        
        {/* Progress bar */}
        <ProgressBar 
          className="mb-4" 
          now={(currentStep / totalSteps) * 100} 
          label={`Step ${currentStep} of ${totalSteps}`} 
        />
        
        {loadingUpdate && <Loader />}
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error?.data?.message || 'Error loading product'}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            {renderStepContent()}
            
            <div className="d-flex justify-content-between mt-3">
              {currentStep > 1 && (
                <Button 
                  variant="secondary" 
                  onClick={handlePrevStep}
                  disabled={loadingUpdate || loadingUpload}
                >
                  <FaArrowLeft className="me-1" /> Previous
                </Button>
              )}
              
              <div className="ms-auto">
                {currentStep < totalSteps ? (
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={loadingUpdate || loadingUpload}
                  >
                    Next <FaArrowRight className="ms-1" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    variant="success"
                    disabled={loadingUpdate || loadingUpload}
                  >
                    <FaSave className="me-1" /> {isCreateMode ? 'Create Product' : 'Update Product'}
                  </Button>
                )}
              </div>
            </div>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ProductEditScreen;
