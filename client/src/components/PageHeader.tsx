interface PageHeaderProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
}

export function PageHeader({ imageUrl, title, subtitle }: PageHeaderProps) {
  return (
    <div className="relative w-full h-64 md:h-80 overflow-hidden">
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/90" />
      )}
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3"
          data-testid="page-header-title"
        >
          {title}
        </h1>
        {subtitle && (
          <p 
            className="text-lg md:text-xl text-white/90 max-w-2xl"
            data-testid="page-header-subtitle"
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
