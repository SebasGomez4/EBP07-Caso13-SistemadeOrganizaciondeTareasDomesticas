interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  variant?: "horizontal" | "icon";
  className?: string;
}

export function AppLogo({
  size = "md",
  showTagline = true,
  variant = "horizontal",
  className = ""
}: AppLogoProps) {
  const sizeClasses = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  // Logo icon SVG - Casa con check (tareas completadas)
  const LogoIcon = ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Casa simplificada */}
      <path
        d="M20 4L6 16V36H16V26H24V36H34V16L20 4Z"
        className="fill-purple-600"
      />
      {/* Check mark dentro de la casa */}
      <path
        d="M12 22L17 27L28 16"
        className="stroke-blue-500"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Elementos de organización (líneas sutiles) */}
      <circle cx="10" cy="20" r="1.5" className="fill-purple-400" />
      <circle cx="10" cy="24" r="1.5" className="fill-purple-400" />
    </svg>
  );

  // Variante solo icono
  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <LogoIcon className={iconSizes[size]} />
      </div>
    );
  }

  // Variante horizontal (icono + nombre)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoIcon className={iconSizes[size]} />
      <div className={showTagline ? "" : "flex items-center"}>
        <h1 className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight`}>
          Soyla
        </h1>
        {showTagline && (
          <p className="text-gray-600 text-sm mt-0.5">
            Sistema de gestión de tareas domésticas
          </p>
        )}
      </div>
    </div>
  );
}
