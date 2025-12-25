/**
 * LocalPage - Dynamic local SEO page component
 *
 * This component renders city-specific landing pages based on the URL slug.
 * It uses programmatic SEO data from the centralized config.
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { LocalSEOTemplate } from '@/components/seo/LocalSEOTemplate';
import { getLocalPageBySlug, localSEOPages } from '@/config/seo.config';

const LocalPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Find the page data for this slug
  const pageData = slug ? getLocalPageBySlug(slug) : undefined;

  // If no page data found, redirect to 404
  if (!pageData) {
    return <Navigate to="/404" replace />;
  }

  return <LocalSEOTemplate pageData={pageData} />;
};

export default LocalPage;

// Export page data for static generation if needed
export { localSEOPages };
