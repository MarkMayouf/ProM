import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumb } from 'react-bootstrap';
import { FaHome } from 'react-icons/fa';

const BreadcrumbNav = ({ category, subcategory, product }) => {
  const location = useLocation();

  // Extract breadcrumb parts from URL if not provided as props
  if (!category && location.pathname.includes('/category/')) {
    const pathParts = location.pathname.split('/');
    category = pathParts[pathParts.indexOf('category') + 1];
  }

  if (!subcategory && location.search.includes('subcategory=')) {
    subcategory = new URLSearchParams(location.search).get('subcategory');
  }

  const formatName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <Breadcrumb className='app-breadcrumb my-3'>
      <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
        <FaHome className='me-1' /> Home
      </Breadcrumb.Item>

      {category && (
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: `/category/${category}` }}
          active={!subcategory && !product}
        >
          {formatName(category)}
        </Breadcrumb.Item>
      )}

      {subcategory && (
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{
            to: {
              pathname: `/page/1`,
              search: `?category=${category}&subcategory=${subcategory}`,
            },
            state: { from: `/category/${category}` },
          }}
          active={!product}
        >
          {formatName(subcategory)}
        </Breadcrumb.Item>
      )}

      {product && <Breadcrumb.Item active>{product}</Breadcrumb.Item>}
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
