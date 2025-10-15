import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { TextBlock, ImageBlock, CTABlock, GalleryBlock, VideoBlock } from "@/components/PageBlocks";
import type { CustomPage, PageBlock } from "@shared/schema";

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading: pageLoading, error: pageError } = useQuery<CustomPage>({
    queryKey: ['/api/custom-pages/slug', slug],
    enabled: !!slug,
  });

  const { data: blocks = [], isLoading: blocksLoading } = useQuery<PageBlock[]>({
    queryKey: page?.id ? ['/api/custom-pages', page.id, 'blocks'] : ['disabled-blocks'],
    enabled: !!page?.id,
  });

  useEffect(() => {
    if (page) {
      document.title = page.seoTitle || page.title || "Scuola di Longboard";
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && page.seoDescription) {
        metaDescription.setAttribute('content', page.seoDescription);
      } else if (page.seoDescription) {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = page.seoDescription;
        document.head.appendChild(meta);
      }
    }
  }, [page]);

  if (pageLoading || blocksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (pageError || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Pagina non trovata</h1>
          <p className="text-muted-foreground mb-6">
            La pagina che stai cercando non esiste o non è stata pubblicata.
          </p>
          <a href="/" className="text-primary hover:underline">
            Torna alla home
          </a>
        </div>
      </div>
    );
  }

  const renderBlock = (block: PageBlock) => {
    const content = block.contentJson as any;

    switch (block.type) {
      case 'text':
        return <TextBlock key={block.id} content={content} />;
      case 'image':
        return <ImageBlock key={block.id} content={content} />;
      case 'cta':
        return <CTABlock key={block.id} content={content} />;
      case 'gallery':
        return <GalleryBlock key={block.id} content={content} />;
      case 'video':
        return <VideoBlock key={block.id} content={content} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={page.headerImageUrl || undefined}
        title={page.headerTitle || page.title}
        subtitle={page.headerSubtitle || undefined}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {blocks.map(renderBlock)}
        </div>
      </div>
    </div>
  );
}
