// This file configures webpack to ignore source map warnings for specific packages
if (process.env.NODE_ENV === 'development') {
  // Silence source map warnings from react-datepicker
  const originalWarn = console.warn;
  console.warn = function(message) {
    if (message && typeof message === 'string' && 
        (message.includes('Failed to parse source map from') && 
         message.includes('react-datepicker'))) {
      return;
    }
    originalWarn.apply(console, arguments);
  };
}
