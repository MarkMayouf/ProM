import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top of page
 * @param {Object} options - Configuration options
 * @param {boolean} options.smooth - Whether to use smooth scrolling (default: true)
 * @param {Array} options.dependencies - Additional dependencies to trigger scroll (default: [])
 * @param {boolean} options.onMount - Whether to scroll on component mount (default: true)
 * @param {boolean} options.onLocationChange - Whether to scroll on location change (default: false)
 */
export const useScrollToTop = (options = {}) => {
  const {
    smooth = true,
    dependencies = [],
    onMount = true,
    onLocationChange = false
  } = options;

  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'instant'
    });
  };

  // Scroll on component mount
  useEffect(() => {
    if (onMount) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll on location change
  useEffect(() => {
    if (onLocationChange && !location.hash) {
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
  }, [location.pathname, location.search, onLocationChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll on custom dependencies
  useEffect(() => {
    if (dependencies.length > 0) {
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return scrollToTop;
};

/**
 * Hook specifically for scrolling to top when navigating between steps or pages
 * @param {any} currentStep - Current step or page identifier
 * @param {Object} options - Additional options
 */
export const useScrollToTopOnStepChange = (currentStep, options = {}) => {
  const { smooth = true, delay = 0 } = options;

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'instant'
      });
    };

    if (delay > 0) {
      const timer = setTimeout(() => {
        requestAnimationFrame(scrollToTop);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      requestAnimationFrame(scrollToTop);
    }
  }, [currentStep, smooth, delay]);
};

export default useScrollToTop; 