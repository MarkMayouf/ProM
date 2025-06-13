import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't scroll if there's a hash in the URL (for anchor links)
    if (location.hash) {
      return;
    }

    // Scroll to top when route changes (pathname or search params)
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollToTop();
    });

    // Also handle cases where the page might still be loading
    const timer = setTimeout(() => {
      scrollToTop();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Handle hash changes separately for anchor navigation
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        // Smooth scroll to the target element
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [location.hash]);

  return null;
};

export default ScrollToTop; 