import { Helmet } from 'react-helmet-async';

const Meta = ({ title, description, keywords, canonical, ogImage, ogType }) => {
  const siteName = 'ProMayoufSuits';
  const defaultDescription = 'Premium men\'s suits, shoes, and accessories. Find the perfect fit for any occasion with our expert tailoring services.';
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content={ogType || 'website'} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description || defaultDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Structured Data for E-commerce */}
      <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "${siteName}",
            "url": "${window.location.origin}",
            "logo": "${window.location.origin}/logo.png",
            "description": "${defaultDescription}",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "${window.location.origin}/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        `}
      </script>
    </Helmet>
  );
};

Meta.defaultProps = {
  title: 'ProMayoufSuits - Premium Men\'s Fashion',
  description: 'Premium men\'s suits, shoes, and accessories. Find the perfect fit for any occasion with our expert tailoring services.',
  keywords: 'suits, men\'s suits, formal wear, tuxedos, blazers, dress shirts, shoes, accessories, tailoring, premium fashion',
};

export default Meta;
