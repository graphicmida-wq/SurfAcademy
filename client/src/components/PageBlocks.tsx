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
    imageUrl: string;
    alt?: string;
    caption?: string;
  };
}

export function ImageBlock({ content }: ImageBlockProps) {
  return (
    <figure className="space-y-3" data-testid="block-image">
      <img
        src={content.imageUrl}
        alt={content.alt || ""}
        className="w-full h-auto rounded-lg object-cover"
      />
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
