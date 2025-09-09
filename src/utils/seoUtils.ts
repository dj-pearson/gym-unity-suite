// SEO utility functions for Rep Club

export const generateMetaDescription = (content: string, maxLength: number = 160): string => {
  if (content.length <= maxLength) return content;
  
  // Find the last complete sentence within the limit
  const truncated = content.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.7) {
    return content.substring(0, lastSentence + 1);
  }
  
  // If no good sentence break, truncate at last space
  const lastSpace = truncated.lastIndexOf(' ');
  return content.substring(0, lastSpace) + '...';
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const generateKeywords = (content: string, existingKeywords: string[] = []): string[] => {
  // Extract potential keywords from content
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Count word frequency
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Get most frequent words
  const keywordCandidates = Object.entries(frequency)
    .filter(([word, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  return [...existingKeywords, ...keywordCandidates].slice(0, 15);
};

export const generateStructuredData = {
  article: (article: {
    title: string;
    description: string;
    author: string;
    publishedDate: string;
    modifiedDate?: string;
    image?: string;
    category?: string;
    tags?: string[];
  }) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.description,
    "image": article.image,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Rep Club",
      "logo": {
        "@type": "ImageObject",
        "url": "https://repclub.app/logo.png"
      }
    },
    "datePublished": article.publishedDate,
    "dateModified": article.modifiedDate || article.publishedDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "articleSection": article.category,
    "keywords": article.tags?.join(', ')
  }),

  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rep Club",
    "url": "https://repclub.app",
    "logo": "https://repclub.app/logo.png",
    "description": "Premium fitness management solutions for discerning professionals",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-0123",
      "contactType": "customer service"
    },
    "sameAs": [
      "https://twitter.com/repclub",
      "https://facebook.com/repclub",
      "https://linkedin.com/company/repclub"
    ]
  }),

  breadcrumb: (items: Array<{ name: string; item: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item
    }))
  })
};

export const generateCanonicalUrl = (path?: string): string => {
  const baseUrl = 'https://repclub.app';
  if (!path) return window.location.href;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const validateSEOData = (data: {
  title?: string;
  description?: string;
  keywords?: string;
}) => {
  const issues: string[] = [];
  
  if (!data.title) {
    issues.push('Missing title tag');
  } else if (data.title.length > 60) {
    issues.push('Title tag too long (over 60 characters)');
  } else if (data.title.length < 30) {
    issues.push('Title tag too short (under 30 characters)');
  }
  
  if (!data.description) {
    issues.push('Missing meta description');
  } else if (data.description.length > 160) {
    issues.push('Meta description too long (over 160 characters)');
  } else if (data.description.length < 120) {
    issues.push('Meta description too short (under 120 characters)');
  }
  
  if (!data.keywords) {
    issues.push('Missing keywords');
  } else if (data.keywords.split(',').length < 5) {
    issues.push('Too few keywords (less than 5)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};