import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  schema?: Record<string, any>;
  keywords?: string;
}

export const SEO = ({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://gymunitysuite.com/assets/og-image.jpg',
  ogImageAlt = 'Gym Unity Suite Dashboard',
  twitterCard = 'summary_large_image',
  noindex = false,
  schema,
  keywords,
}: SEOProps) => {
  const fullTitle = title.includes('Gym Unity Suite') ? title : `${title} | Gym Unity Suite`;
  const url = canonical || `https://gymunitysuite.com${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:site_name" content="Gym Unity Suite" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@GymUnitySuite" />
      <meta name="twitter:creator" content="@GymUnitySuite" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

// Predefined schema templates for common page types
export const createBlogPostSchema = (
  title: string,
  description: string,
  author: string,
  datePublished: string,
  dateModified: string,
  imageUrl: string
) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description: description,
  author: {
    '@type': 'Person',
    name: author,
  },
  datePublished: datePublished,
  dateModified: dateModified,
  publisher: {
    '@type': 'Organization',
    name: 'Gym Unity Suite',
    logo: {
      '@type': 'ImageObject',
      url: 'https://gymunitysuite.com/assets/logo.png',
    },
  },
  image: imageUrl,
});

export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const createProductSchema = (
  name: string,
  description: string,
  price: string,
  imageUrl: string
) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: name,
  description: description,
  brand: {
    '@type': 'Brand',
    name: 'Gym Unity Suite',
  },
  image: imageUrl,
  offers: {
    '@type': 'Offer',
    price: price,
    priceCurrency: 'USD',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
  },
});

export const createHowToSchema = (
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: name,
  description: description,
  step: steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
});
