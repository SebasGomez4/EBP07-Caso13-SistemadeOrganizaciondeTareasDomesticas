import { Shield, Lock } from "lucide-react";

interface SecurityIndicatorProps {
  variant?: "minimal" | "detailed";
  className?: string;
}

export function SecurityIndicator({ variant = "minimal", className = "" }: SecurityIndicatorProps) {
  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center gap-1.5 text-xs text-gray-500 ${className}`}>
        <Shield className="h-3.5 w-3.5 text-green-600" />
        <span>Conexión segura</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-purple-100 bg-purple-50/40 p-3 ${className}`}>
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="h-3.5 w-3.5 text-purple-600" />
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-xs font-medium text-purple-900">
            Tus datos están protegidos
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tu información se transmite de forma cifrada y se almacena de manera segura.
          </p>
        </div>
      </div>
    </div>
  );
}
