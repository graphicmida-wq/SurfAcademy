interface PageHeaderProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  paddingTop?: string;
  paddingBottom?: string;
  minHeight?: string;
}

export function PageHeader({ imageUrl, title, subtitle, paddingTop = 'py-16', paddingBottom = 'py-24', minHeight = 'min-h-96' }: PageHeaderProps) {
  const paddingClass = `${paddingTop.replace('py-', 'pt-')} ${paddingBottom.replace('py-', 'pb-')}`;
  
  return (
    <div className={`relative w-full overflow-hidden ${minHeight}`}>
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
      
      <div className={`relative w-full h-full flex flex-col items-center justify-center px-4 text-center ${paddingClass}`}>
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
