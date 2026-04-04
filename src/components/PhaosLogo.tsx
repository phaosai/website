import phaosCrown from "@/assets/phaos-crown.jpg";

interface PhaosLogoProps {
  showImage?: boolean;
  className?: string;
}

const PhaosLogo = ({ showImage = true, className = "" }: PhaosLogoProps) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {showImage && (
      <img
        src={phaosCrown}
        alt=""
        aria-hidden="true"
        role="presentation"
        width={200}
        height={96}
        decoding="async"
        className="h-8 w-auto object-contain"
      />
    )}
    <span className="text-lg tracking-tight text-foreground">
      <span className="font-bold">Phaos</span>
      {" "}
      <span className="italic font-medium text-purple-light">AI</span>
    </span>
  </div>
);

export default PhaosLogo;
