import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface TextBlockProps {
  content: {
    html: string;
  };
}

export function TextBlock({ content }: TextBlockProps) {
  return (
    <div 
      className="prose prose-lg max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: content.html }}
      data-testid="block-text"
    />
  );
}

interface ImageBlockProps {
  content: {
    url: string;
    alt?: string;
    caption?: string;
    link?: string;
    dimensions?: {
      width?: string;
      height?: string;
      aspectRatio?: string;
    };
    alignment?: 'left' | 'center' | 'right';
    spacing?: Record<string, string>;
  };
}

export function ImageBlock({ content }: ImageBlockProps) {
  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto'
  };
  
  const imageStyle: CSSProperties = {
    width: content.dimensions?.width || 'auto',
    height: content.dimensions?.height || 'auto',
    aspectRatio: content.dimensions?.aspectRatio || undefined,
    ...content.spacing
  };

  const img = (
    <img
      src={content.url}
      alt={content.alt || ""}
      style={imageStyle}
      className={`rounded-lg object-cover ${content.alignment ? alignmentClasses[content.alignment] : ''}`}
    />
  );

  return (
    <figure className="space-y-3" data-testid="block-image">
      {content.link ? (
        <a href={content.link} target={content.link.startsWith('http') ? '_blank' : undefined} rel={content.link.startsWith('http') ? 'noopener noreferrer' : undefined}>
          {img}
        </a>
      ) : img}
      {content.caption && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}

interface CTABlockProps {
  content: {
    title: string;
    description?: string;
    buttonText: string;
    buttonUrl: string;
    variant?: 'default' | 'outline' | 'secondary';
  };
}

export function CTABlock({ content }: CTABlockProps) {
  const isExternal = content.buttonUrl.startsWith('http');
  
  return (
    <div 
      className="bg-card rounded-lg p-8 text-center border"
      data-testid="block-cta"
    >
      <h3 className="text-2xl font-display font-bold mb-3">{content.title}</h3>
      {content.description && (
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {content.description}
        </p>
      )}
      <Button
        variant={content.variant || 'default'}
        size="lg"
        asChild
        data-testid="button-cta"
      >
        <a 
          href={content.buttonUrl}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {content.buttonText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

interface GalleryBlockProps {
  content: {
    images: Array<{
      url: string;
      alt?: string;
      caption?: string;
    }>;
    columns?: number;
  };
}

export function GalleryBlock({ content }: GalleryBlockProps) {
  const columns = content.columns || 3;
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4`} data-testid="block-gallery">
      {content.images.map((image, index) => (
        <figure key={index} className="space-y-2">
          <img
            src={image.url}
            alt={image.alt || `Gallery image ${index + 1}`}
            className="w-full h-64 object-cover rounded-lg"
          />
          {image.caption && (
            <figcaption className="text-sm text-muted-foreground">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

interface VideoBlockProps {
  content: {
    videoUrl: string;
    title?: string;
    description?: string;
  };
}

export function VideoBlock({ content }: VideoBlockProps) {
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  return (
    <div className="space-y-4" data-testid="block-video">
      {content.title && (
        <h3 className="text-2xl font-display font-bold">{content.title}</h3>
      )}
      {content.description && (
        <p className="text-muted-foreground">{content.description}</p>
      )}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <iframe
          src={getEmbedUrl(content.videoUrl)}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

interface BannerBlockProps {
  content: {
    variant: 'boxed' | 'fullwidth';
    backgroundImage?: string;
    backgroundColor?: string;
    content?: {
      title?: string;
      subtitle?: string;
      titleTypography?: Record<string, string>;
      subtitleTypography?: Record<string, string>;
    };
    cta?: {
      text?: string;
      link?: string;
      buttonStyle?: Record<string, string>;
    };
    spacing?: Record<string, string>;
  };
}

export function BannerBlock({ content }: BannerBlockProps) {
  const containerClass = content.variant === 'boxed' ? 'container mx-auto px-4' : 'w-full';
  
  const bannerStyle: CSSProperties = {
    backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
    backgroundColor: content.backgroundColor || undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    ...content.spacing
  };

  const titleStyle: CSSProperties = content.content?.titleTypography || {};
  const subtitleStyle: CSSProperties = content.content?.subtitleTypography || {};

  return (
    <div className={`relative ${containerClass} rounded-lg overflow-hidden`} style={bannerStyle} data-testid="block-banner">
      <div className="relative z-10 p-12 text-center">
        {content.content?.title && (
          <h2 className="text-4xl font-bold mb-4" style={titleStyle}>
            {content.content.title}
          </h2>
        )}
        {content.content?.subtitle && (
          <p className="text-lg mb-6" style={subtitleStyle}>
            {content.content.subtitle}
          </p>
        )}
        {content.cta?.text && content.cta?.link && (
          <Button
            asChild
            style={content.cta.buttonStyle}
          >
            <a href={content.cta.link}>
              {content.cta.text}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

interface ContainerBlockProps {
  content: {
    layout: 'columns' | 'rows';
    columns?: number;
    gap?: string;
    children?: any[];
    spacing?: Record<string, string>;
  };
}

export function ContainerBlock({ content }: ContainerBlockProps) {
  const columnClasses = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6'
  }[content.columns || 2] || 'md:grid-cols-2';

  const layoutClass = content.layout === 'columns' 
    ? `grid grid-cols-1 ${columnClasses}`
    : 'flex flex-col';
  
  const containerStyle: CSSProperties = {
    gap: content.gap || '1rem',
    ...content.spacing
  };

  const renderChild = (child: any, index: number) => {
    const childContent = child.content || child;
    const key = child.id || index;
    
    switch (child.type) {
      case 'text':
        return <TextBlock key={key} content={childContent} />;
      case 'image':
        return <ImageBlock key={key} content={childContent} />;
      case 'banner':
        return <BannerBlock key={key} content={childContent} />;
      case 'cta':
        return <CTABlock key={key} content={childContent} />;
      case 'gallery':
        return <GalleryBlock key={key} content={childContent} />;
      case 'video':
        return <VideoBlock key={key} content={childContent} />;
      default:
        return <div key={key} className="p-4 border rounded text-muted-foreground">Block type not supported</div>;
    }
  };

  return (
    <div className={layoutClass} style={containerStyle} data-testid="block-container">
      {content.children?.map((child, index) => renderChild(child, index))}
    </div>
  );
}
