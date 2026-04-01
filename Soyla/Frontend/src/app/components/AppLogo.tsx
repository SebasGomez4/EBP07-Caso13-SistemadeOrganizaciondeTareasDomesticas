interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export function AppLogo({ size = "md", showTagline = true, className = "" }: AppLogoProps) {
  const sizeClasses = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  return (
    <div className={`text-center ${className}`}>
      <h1 className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent py-1 leading-tight`}>
        Soyla
      </h1>
      {showTagline && (
        <p className="text-gray-600 mt-2 text-sm">
          Sistema de gestión de tareas domésticas
        </p>
      )}
    </div>
  );
}
