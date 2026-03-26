import { Link } from "react-router-dom";
import phaosCrown from "@/assets/phaos-crown.png";

interface PhaosLogoProps {
  showImage?: boolean;
  className?: string;
}

const PhaosLogo = ({ showImage = true, className = "" }: PhaosLogoProps) => (
  <Link to="/" className={`flex items-center gap-3 ${className}`}>
    {showImage && (
      <img src={phaosCrown} alt="Phaos AI" className="h-8 w-auto object-contain" />
    )}
    <span className="text-lg tracking-tight text-foreground">
      <span className="font-bold">Phaos</span>
      {" "}
      <span className="italic font-medium text-primary">AI</span>
    </span>
  </Link>
);

export default PhaosLogo;
