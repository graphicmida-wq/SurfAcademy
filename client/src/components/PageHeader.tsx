interface PageHeaderProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  paddingTop?: string;
  paddingBottom?: string;
  minHeight?: string;
  isLoading?: boolean;
}

export function PageHeader({ imageUrl, title, subtitle, paddingTop = 'py-16', paddingBottom = 'py-24', minHeight = 'min-h-96', isLoading = false }: PageHeaderProps) {
  const paddingClass = `${paddingTop.replace('py-', 'pt-')} ${paddingBottom.replace('py-', 'pb-')}`;
  
  return (
    <div className={`relative w-full overflow-hidden ${minHeight}`} style={{ marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))' }}>
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#13a294]/50" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#13a294]" />
      )}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center px-4 text-center ${paddingClass} transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white pt-[-16px] pb-[-16px] mt-[6px] mb-[6px] uppercase"
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
