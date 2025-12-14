import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 'icon',
  className,
  showLabel = false,
}: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'transition-all duration-200',
        isFavorite && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
    >
      <Star
        className={cn(
          'h-4 w-4 transition-all duration-200',
          isFavorite && 'fill-yellow-500'
        )}
      />
      {showLabel && <span className="ml-1">{isFavorite ? 'Favorited' : 'Favorite'}</span>}
    </Button>
  );
}
