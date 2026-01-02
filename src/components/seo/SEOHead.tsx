import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'blog';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  category?: string;
  tags?: string[];
  structuredData?: object;
}

export function SEOHead({
  title = 'Gym Management Software | All-in-One Fitness Management System - Gym Unity Suite',
  description = '#1 gym management software for fitness studios, gyms & boutique fitness centers. Complete member management, class scheduling, billing automation & analytics. Try free today!',
  keywords = 'gym management software, fitness management system, gym scheduling software, fitness studio management, gym billing software, fitness business software, gym CRM, fitness analytics, member management software',
  image = 'https://gymunitysuite.com/assets/og-image.jpg',
  url,
  type = 'website',
  author = 'Gym Unity Suite',
  publishedTime,
  modifiedTime,
  category,
  tags = [],
  structuredData
}: SEOHeadProps) {
  const fullTitle = title.includes('Gym Unity Suite') ? title : `${title} | Gym Unity Suite`;
  const canonicalUrl = url || window.location.href;

  // Generate structured data for the organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Gym Unity Suite",
    "description": description,
    "url": "https://gymunitysuite.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "97",
      "highPrice": "497",
      "priceCurrency": "USD",
      "priceValidUntil": "2026-12-31"
    },
    "provider": {
      "@type": "Organization",
      "name": "Gym Unity Suite",
      "url": "https://gymunitysuite.com",
      "logo": "https://gymunitysuite.com/assets/logo.png",
      "sameAs": [
        "https://twitter.com/GymUnitySuite",
        "https://linkedin.com/company/gym-unity-suite"
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    },
    "featureList": [
      "Member Management",
      "Class Scheduling & Booking",
      "CRM & Sales Pipeline",
      "Automated Billing",
      "Branded Mobile App",
      "Real-time Analytics"
    ]
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Gym Unity Suite" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:site" content="@GymUnitySuite" />
      <meta property="twitter:creator" content="@GymUnitySuite" />
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {category && <meta property="article:section" content={category} />}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
      
      {/* Performance and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Note: Preconnects removed - app uses system fonts, not Google Fonts */}
    </Helmet>
  );
}