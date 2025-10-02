import React from 'react';
import Head from 'expo-router/head';

interface PostHeadProps {
  title: string;
  description: string;
  imageUrl?: string;
  postId: string;
}

export default function PostHead({ title, description, imageUrl, postId }: PostHeadProps) {
  const baseUrl = 'https://voxcampusorg.appwrite.network';
  const postUrl = `${baseUrl}/post/${postId}`;
  
  // Clean description for meta tags (remove emojis and extra whitespace)
  const cleanDescription = description
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 160);

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title} | VoxCampus</title>
      <meta name="description" content={cleanDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={postUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:site_name" content="VoxCampus" />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={postUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={cleanDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="VoxCampus" />
      <link rel="canonical" href={postUrl} />
      
      {/* App-specific */}
      <meta name="theme-color" content="#007AFF" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": title,
          "description": cleanDescription,
          "url": postUrl,
          "organizer": {
            "@type": "Organization",
            "name": "VoxCampus"
          },
          ...(imageUrl && { "image": imageUrl })
        })}
      </script>
    </Head>
  );
}