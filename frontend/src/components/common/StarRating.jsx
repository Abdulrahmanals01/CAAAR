import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ rating, size = 'md', interactive = false, onChange }) => {
  
  const sizeMap = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 32
  };
  
  const iconSize = sizeMap[size] || sizeMap.md;
  
  
  const generateStars = () => {
    const stars = [];
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="text-yellow-400" />);
    }
    
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half-star" className="text-yellow-400" />);
    }
    
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-star-${i}`} className="text-yellow-400" />);
    }
    
    return stars;
  };

  
  const handleClick = (selectedRating) => {
    if (interactive && onChange) {
      onChange(selectedRating);
    }
  };

  
  if (interactive) {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className="cursor-pointer" 
            onClick={() => handleClick(star)}
          >
            {star <= rating ? (
              <FaStar size={iconSize} className="text-yellow-400" />
            ) : (
              <FaRegStar size={iconSize} className="text-yellow-400" />
            )}
          </span>
        ))}
      </div>
    );
  }

  
  return (
    <div className="flex items-center">
      {generateStars().map((star, index) => (
        <span key={index} style={{ fontSize: iconSize }}>
          {star}
        </span>
      ))}
    </div>
  );
};

export default StarRating;
