import { Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';

const Paginate = ({ pages, page, isAdmin = false, keyword = '' }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Get all query parameters to preserve them during pagination
  const getPageUrl = (pageNumber) => {
    // Create a copy of the current query parameters
    const newQueryParams = new URLSearchParams(location.search);

    if (isAdmin) {
      return `/admin/productlist/${pageNumber}`;
    }

    if (keyword) {
      return `/search/${keyword}/page/${pageNumber}`;
    }

    // Return URL with preserved query parameters
    const queryString = newQueryParams.toString();
    return `/page/${pageNumber}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    pages > 1 && (
      <Pagination className='justify-content-center my-4'>
        {page > 1 && (
          <LinkContainer to={getPageUrl(page - 1)}>
            <Pagination.Prev />
          </LinkContainer>
        )}

        {page > 2 && (
          <LinkContainer to={getPageUrl(1)}>
            <Pagination.Item>1</Pagination.Item>
          </LinkContainer>
        )}

        {page > 3 && <Pagination.Ellipsis />}

        {[...Array(pages).keys()].map((x) => {
          const pageNum = x + 1;
          // Show current page and one page before and after
          if (pageNum >= page - 1 && pageNum <= page + 1 && pageNum <= pages) {
            return (
              <LinkContainer key={pageNum} to={getPageUrl(pageNum)}>
                <Pagination.Item active={pageNum === page}>
                  {pageNum}
                </Pagination.Item>
              </LinkContainer>
            );
          }
          return null;
        })}

        {page < pages - 2 && <Pagination.Ellipsis />}

        {page < pages - 1 && (
          <LinkContainer to={getPageUrl(pages)}>
            <Pagination.Item>{pages}</Pagination.Item>
          </LinkContainer>
        )}

        {page < pages && (
          <LinkContainer to={getPageUrl(page + 1)}>
            <Pagination.Next />
          </LinkContainer>
        )}
      </Pagination>
    )
  );
};

export default Paginate;
