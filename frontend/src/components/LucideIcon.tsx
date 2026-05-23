import React from 'react';
import * as Lucide from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 16 }: LucideIconProps) {
  // Safe mapping of standard action and gesture icons used in our components
  const iconMap: Record<string, React.ReactNode> = {
    ArrowLeft: <Lucide.ArrowLeft className={className} size={size} />,
    ArrowRight: <Lucide.ArrowRight className={className} size={size} />,
    Scissors: <Lucide.Scissors className={className} size={size} />,
    Fingerprint: <Lucide.Fingerprint className={className} size={size} />,
    Hand: <Lucide.Hand className={className} size={size} />,
    RotateCw: <Lucide.RotateCw className={className} size={size} />,
    ChevronsLeft: <Lucide.ChevronsLeft className={className} size={size} />,
    ChevronsRight: <Lucide.ChevronsRight className={className} size={size} />,
    ArrowDown: <Lucide.ArrowDown className={className} size={size} />,
    ArrowUp: <Lucide.ArrowUp className={className} size={size} />,
    RefreshCw: <Lucide.RefreshCw className={className} size={size} />,
    PlayPause: (
      <div className={`flex items-center gap-0.5 ${className}`}>
        <Lucide.Play size={size - 2} />
        <Lucide.Pause size={size - 2} />
      </div>
    ),
    SkipForward: <Lucide.SkipForward className={className} size={size} />,
    Volume2: <Lucide.Volume2 className={className} size={size} />,
    Volume1: <Lucide.Volume1 className={className} size={size} />,
    VolumeX: <Lucide.VolumeX className={className} size={size} />,
    Grid: <Lucide.Grid className={className} size={size} />,
    Lock: <Lucide.Lock className={className} size={size} />,
    Sparkles: <Lucide.Sparkles className={className} size={size} />,
    Terminal: <Lucide.Terminal className={className} size={size} />,
    Activity: <Lucide.Activity className={className} size={size} />,
    Zap: <Lucide.Zap className={className} size={size} />,
    Sliders: <Lucide.Sliders className={className} size={size} />,
    ChevronDown: <Lucide.ChevronDown className={className} size={size} />,
    Check: <Lucide.Check className={className} size={size} />,
    Plus: <Lucide.Plus className={className} size={size} />,
    Trash2: <Lucide.Trash2 className={className} size={size} />,
    Video: <Lucide.Video className={className} size={size} />,
    VideoOff: <Lucide.VideoOff className={className} size={size} />,
    Radio: <Lucide.Radio className={className} size={size} />,
    Gauge: <Lucide.Gauge className={className} size={size} />,
  };

  const matched = iconMap[name];
  if (matched) {
    return <>{matched}</>;
  }

  // Fallback to Sparkles or safe dynamic if anything
  const DynamicIcon = (Lucide as any)[name];
  if (DynamicIcon) {
    return <DynamicIcon className={className} size={size} />;
  }

  return <Lucide.Sparkles className={className} size={size} />;
}
