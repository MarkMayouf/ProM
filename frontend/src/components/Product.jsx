import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Rating from './Rating';

const Product = ({ product }) => {
  const isOnSale = product.price < product.regularPrice;
  const discountPercentage = isOnSale 
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : 0;

  return (
    <Card className="my-3 p-3 rounded position-relative">
      {isOnSale && (
        <div className="sale-badge">
          {discountPercentage}% OFF
        </div>
      )}
      <Link to={`/product/${product._id}`}>
        <Card.Img src={product.image} variant="top" />
      </Link>

      <Card.Body>
        <Link to={`/product/${product._id}`}>
          <Card.Title as="div" className="product-title">
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>

        <Card.Text as="div">
          <Rating
            value={product.rating}
            text={`${product.numReviews} reviews`}
          />
        </Card.Text>

        <Card.Text as="h3">
          {isOnSale ? (
            <>
              <span className="text-danger">${product.price}</span>
              <small className="text-muted text-decoration-line-through ms-2">
                ${product.regularPrice}
              </small>
            </>
          ) : (
            <>${product.price}</>
          )}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Product;
