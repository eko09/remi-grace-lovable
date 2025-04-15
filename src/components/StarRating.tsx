
import React from 'react';
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  value, 
  onChange, 
  maxStars = 7 
}) => {
  return (
    <div className="flex justify-center gap-1">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onChange(starValue)}
            className="focus:outline-none"
          >
            <Star 
              className={cn(
                "w-8 h-8 transition-colors",
                starValue <= value 
                  ? "fill-therapy-blue stroke-therapy-blue" 
                  : "stroke-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
