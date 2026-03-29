import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FeatureNavbarProps {
  featureName: string;
  showBackButton?: boolean;
}

const FeatureNavbar = ({ featureName, showBackButton = true }: FeatureNavbarProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 w-full border-b border-white/20 bg-gradient-to-r from-purple-500/30 via-pink-400/30 to-purple-500/30 backdrop-blur-xl shadow-lg shadow-purple-500/10">
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-white/20 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
        )}

        {/* Feature Name */}
        <h1 className="flex-1 text-center text-2xl font-bold text-white drop-shadow-lg">
          {featureName}
        </h1>

        {/* Home Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="hover:bg-white/20 transition-all duration-200"
        >
          <Home className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default FeatureNavbar;
