import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, ProgressBar, Spinner } from 'react-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import MultipleImageUploader from '../../components/MultipleImageUploader';
import { toast } from 'react-toastify';
import {
  useUploadProductImageMutation,
  useCreateProductMutation,
} from '../../slices/productsApiSlice';
import { FaArrowLeft, FaArrowRight, FaSave, FaTimes, FaCloudUploadAlt, FaImage, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import './ProductCreateScreen.css';

const ProductCreateScreen = () => {
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
  const [fit, setFit] = useState('Regular');
  const [style, setStyle] = useState('Business');
  const [pieces, setPieces] = useState(2);
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState(0);
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [sizes, setSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const [createProduct, { isLoading: loadingCreate }] =
    useCreateProductMutation();

  const [uploadProductImage, { isLoading: loadingUpload }] =
    useUploadProductImageMutation();

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

  // Get appropriate sizes for the selected category
  useEffect(() => {
    if (category) {
      if (category === 'Suits' || category === 'Tuxedos' || category === 'Blazers') {
        setSizes([
          { size: '38R', quantity: 0 },
          { size: '40R', quantity: 0 },
          { size: '42R', quantity: 0 },
          { size: '44R', quantity: 0 },
          { size: '46R', quantity: 0 },
          { size: '48R', quantity: 0 }
        ]);
      } else if (category === 'Shoes') {
        setSizes([
          { size: 'US 7 / EU 40', quantity: 0 },
          { size: 'US 8 / EU 41', quantity: 0 },
          { size: 'US 9 / EU 42', quantity: 0 },
          { size: 'US 10 / EU 43', quantity: 0 },
          { size: 'US 11 / EU 44', quantity: 0 },
          { size: 'US 12 / EU 45', quantity: 0 }
        ]);
      } else if (category === 'Dress Shirts' || category === 'Shirts') {
        setSizes([
          { size: 'S', quantity: 0 },
          { size: 'M', quantity: 0 },
          { size: 'L', quantity: 0 },
          { size: 'XL', quantity: 0 },
          { size: 'XXL', quantity: 0 }
        ]);
      } else {
        // For Accessories and other categories that don't have sizes
        setSizes([]);
      }

      // Reset subcategory when category changes
      setSubCategory('');
    }
  }, [category]);

  // Handle whether product needs sizes
  const productNeedsSizes = () => {
    return ['Suits', 'Tuxedos', 'Blazers', 'Shoes', 'Dress Shirts', 'Shirts'].includes(category);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    // Validate form based on current step
    if (currentStep < totalSteps) {
      // Step 1 validation
      if (currentStep === 1) {
        if (!name.trim()) {
          toast.error('Please enter a product name');
          return;
        }
        if (!category) {
          toast.error('Please select a category');
          return;
        }
        if (!subCategory && category !== 'Accessories') {
          toast.error('Please select a subcategory');
          return;
        }
        if (!brand.trim()) {
          toast.error('Please enter a brand name');
          return;
        }
        if (!description.trim()) {
          toast.error('Please enter a description');
          return;
        }
      }
      
      // Step 2 validation
      if (currentStep === 2) {
        if (!image || image === '') {
          toast.error('Please upload a product image');
          return;
        }
        if (!color.trim()) {
          toast.error('Please enter a color');
          return;
        }
        if (!material.trim()) {
          toast.error('Please enter a material');
          return;
        }
        if (!fit) {
          toast.error('Please select a fit');
          return;
        }
        if (!style) {
          toast.error('Please select a style');
          return;
        }
      }

      // Step 3 validation
      if (currentStep === 3) {
        if (!price || price <= 0) {
          toast.error('Please enter a valid price');
          return;
        }
        if (isOnSale) {
          if (!salePrice || salePrice <= 0) {
            toast.error('Please enter a valid sale price');
            return;
          }
          // Compare sale price with regular price (or current price if no regular price is set)
          const priceToCompare = regularPrice || price;
          if (salePrice >= priceToCompare) {
            toast.error('Sale price must be less than regular price');
            return;
          }
          if (!saleStartDate) {
            toast.error('Please enter a sale start date');
            return;
          }
          if (!saleEndDate) {
            toast.error('Please enter a sale end date');
            return;
          }
          if (new Date(saleEndDate) <= new Date(saleStartDate)) {
            toast.error('Sale end date must be after start date');
            return;
          }
        }
      }

      // Step 4 validation
      if (currentStep === 4) {
        if (productNeedsSizes()) {
          if (sizes.length === 0) {
            toast.error('Please add at least one size');
            return;
          }
          const hasQuantity = sizes.some(size => size.quantity > 0);
          if (!hasQuantity) {
            toast.error('Please add quantity for at least one size');
            return;
          }
        } else if (countInStock <= 0) {
          toast.error('Please enter a valid inventory quantity');
          return;
        }
      }
      
      // Go to next step if validation passes
      setCurrentStep(currentStep + 1);
      return;
    }
    
    try {
      const productData = {
        name: name.trim(),
        price: Number(price),
        regularPrice: Number(regularPrice || price),
        image,
        images,
        brand: brand.trim(),
        category,
        subCategory: category === 'Accessories' ? undefined : subCategory,
        countInStock: Number(countInStock),
        description: description.trim(),
        color: color.trim(),
        material: material.trim(),
        fit,
        style,
        pieces: ['Suits', 'Tuxedos'].includes(category) ? Number(pieces) : undefined,
        isOnSale,
        salePrice: isOnSale ? Number(salePrice) : undefined,
        saleStartDate: isOnSale ? saleStartDate : undefined,
        saleEndDate: isOnSale ? saleEndDate : undefined,
        sizes: productNeedsSizes() ? sizes : []
      };

      const result = await createProduct(productData).unwrap();
      toast.success('Product created successfully');
      navigate('/admin/productlist');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'An error occurred while creating the product');
    }
  };

  const uploadFileHandler = async (formData) => {
    try {
      const res = await uploadProductImage(formData).unwrap();
      toast.success(res.message);
      setImage(res.imageUrl);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleImagesUploaded = (uploadedImages) => {
    if (uploadedImages && uploadedImages.length > 0) {
      setImages(prev => [...prev, ...uploadedImages]);
      toast.success(`${uploadedImages.length} images added successfully`);
    } else {
      toast.error('No images were uploaded. Please try again.');
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Handle deleting existing uploaded images
  const handleDeleteExistingImage = (imageUrl) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setImages(prev => prev.filter(img => img !== imageUrl));
      toast.success('Image removed from product');
    }
  };

  const handleImageError = (e) => {
    console.error('Image load error:', e);
    const img = e.target;
    const placeholder = img.parentElement;
    
    // Hide the failed image
    img.style.display = 'none';
    
    // Add placeholder content
    if (placeholder) {
      placeholder.classList.add('placeholder-active');
      const placeholderContent = document.createElement('div');
      placeholderContent.className = 'placeholder-content';
      placeholderContent.innerHTML = `
        <div class="placeholder-icon">
          <FaImage size={40} />
        </div>
        <p class="placeholder-text">Image not available</p>
      `;
      placeholder.appendChild(placeholderContent);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = ''; // Clear the file input
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only image files are allowed (JPG, PNG, GIF, WebP, SVG, BMP, TIFF)');
        e.target.value = ''; // Clear the file input
        return;
      }

      const formData = new FormData();
      formData.append('image', file);
      uploadFileHandler(formData);
    }
  };

  const categories = ['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts', 'Accessories', 'Shoes'];
  
  const subCategoryOptions = {
    'Suits': ['business', 'wedding', 'formal', 'casual'],
    'Tuxedos': ['tuxedos'],
    'Blazers': ['blazers'],
    'Shoes': ['oxford', 'derby', 'loafers', 'boots'],
    'Accessories': ['ties', 'belts', 'cufflinks', 'pocketsquares'],
    'Dress Shirts': ['formal', 'casual'],
    'Shirts': ['dress-shirts', 'casual-shirts', 'polo-shirts', 't-shirts', 'henley-shirts', 'button-down-shirts'],
  };

  const fitOptions = ['Regular', 'Slim', 'Relaxed'];
  const styleOptions = ['Business', 'Casual', 'Sport'];
  const piecesOptions = [2, 3];

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
                <Col md={12}>
                  <Form.Group controlId='image'>
                    <Form.Label>Main Product Image <span className="text-danger">*</span></Form.Label>
                    <div className="image-upload-container">
                      {image ? (
                        <div className="image-preview">
                          <img 
                            src={image}
                            alt="Product preview" 
                            className="preview-image"
                            onError={handleImageError}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="remove-image-btn"
                            onClick={() => {
                              setImage('');
                              // Clear the file input
                              const fileInput = document.querySelector('input[type="file"]');
                              if (fileInput) {
                                fileInput.value = '';
                              }
                              // Remove any placeholder content
                              const preview = document.querySelector('.image-preview');
                              if (preview) {
                                preview.classList.remove('placeholder-active');
                                const placeholderContent = preview.querySelector('.placeholder-content');
                                if (placeholderContent) {
                                  placeholderContent.remove();
                                }
                              }
                            }}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      ) : (
                        <div className="image-placeholder">
                          <div className="placeholder-text">
                            <FaImage className="placeholder-icon" />
                            <span>No main image selected</span>
                          </div>
                        </div>
                      )}
                      <div className="upload-controls">
                        <Form.Control
                          type="file"
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="mb-2"
                        />
                        <small className="text-muted d-block mt-2">
                          <FaInfoCircle className="me-1" />
                          Upload the main product image (required)<br/>
                          Supported: JPG, PNG, GIF, WebP, SVG, BMP, TIFF (Max 5MB)
                        </small>
                      </div>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mt-4">
                <Col md={12}>
                  <MultipleImageUploader
                    onImagesUploaded={handleImagesUploaded}
                    existingImages={images}
                    maxFiles={10}
                    allowDelete={true}
                    onDeleteImage={handleDeleteExistingImage}
                  />
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
                      onChange={(e) => setColor(e.target.value)}
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
                      onChange={(e) => setMaterial(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId='fit'>
                    <Form.Label>Fit <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={fit}
                      onChange={(e) => setFit(e.target.value)}
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
                      onChange={(e) => setStyle(e.target.value)}
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
                        onChange={(e) => setPieces(Number(e.target.value))}
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
        <h1>Create Product</h1>
        
        {/* Progress bar */}
        <ProgressBar 
          className="mb-4" 
          now={(currentStep / totalSteps) * 100} 
          label={`Step ${currentStep} of ${totalSteps}`} 
        />
        
        {loadingCreate && <Loader />}
        
        <Form onSubmit={submitHandler}>
          {renderStepContent()}
          
          <div className="d-flex justify-content-between mt-3">
            {currentStep > 1 && (
              <Button 
                variant="secondary" 
                onClick={handlePrevStep}
              >
                <FaArrowLeft className="me-1" /> Previous
              </Button>
            )}
            
            <div className="ms-auto">
              {currentStep < totalSteps ? (
                <Button type="submit" variant="primary">
                  Next <FaArrowRight className="ms-1" />
                </Button>
              ) : (
                <Button type="submit" variant="success">
                  <FaSave className="me-1" /> Create Product
                </Button>
              )}
            </div>
          </div>
        </Form>
      </FormContainer>
    </>
  );
};

export default ProductCreateScreen;

<style jsx="true">{`
  .image-preview {
    position: relative;
    width: 200px;
    height: 200px;
    border: 2px dashed #ddd;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1rem;
    background-color: #f8f9fa;
    transition: all 0.3s ease;
  }

  .image-preview.placeholder-active {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    padding: 1rem;
    text-align: center;
  }

  .placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    animation: fadeIn 0.3s ease;
  }

  .placeholder-content .placeholder-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #adb5bd;
  }

  .placeholder-content .placeholder-text {
    margin: 0;
    font-size: 0.9rem;
    color: #6c757d;
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .preview-image:hover {
    transform: scale(1.05);
  }

  .image-placeholder {
    width: 200px;
    height: 200px;
    border: 2px dashed #ddd;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .image-placeholder:hover {
    border-color: #adb5bd;
    background-color: #e9ecef;
    transform: translateY(-2px);
  }

  .placeholder-text {
    text-align: center;
    color: #6c757d;
  }

  .placeholder-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
    color: #adb5bd;
  }

  .remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    border-radius: 50%;
    padding: 0.25rem;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .image-preview:hover .remove-image-btn {
    opacity: 1;
  }

  .upload-controls {
    margin-top: 1rem;
  }

  .upload-controls input[type="file"] {
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #495057;
    background-color: #fff;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    transition: all 0.3s ease;
  }

  .upload-controls input[type="file"]:focus {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .upload-controls input[type="file"]:hover {
    border-color: #adb5bd;
  }

  .upload-controls .text-muted {
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style> 