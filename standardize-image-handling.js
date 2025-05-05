
const fs = require('fs');
const path = require('path');

const imageUtilsContent = `

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    
    return \`\${BASE_URL}/assets/images/\${type}-placeholder.jpg\`;
  }
  
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  
  let fullPath = imagePath;
  
  
  if (!fullPath.startsWith('uploads/')) {
    if (type) {
      fullPath = \`uploads/\${type}/\${imagePath}\`;
    } else {
      fullPath = \`uploads/\${imagePath}\`;
    }
  }
  
  return \`\${BASE_URL}/\${fullPath}\`;
};

const processImagePath = (imagePath) => {
  if (!imagePath) return null;
  
  
  let processedPath = imagePath;
  if (processedPath.startsWith(BASE_URL)) {
    processedPath = processedPath.substring(BASE_URL.length);
  }
  
  
  if (!processedPath.startsWith('/')) {
    processedPath = '/' + processedPath;
  }
  
  
  return processedPath.replace(/\\/\\\
};

module.exports = {
  getImageUrl,
  processImagePath
};
`;

const backendImageUtilsPath = path.join(__dirname, 'backend/src/utils/imageUtils.js');

fs.writeFileSync(backendImageUtilsPath, imageUtilsContent);

const frontendImageUtilsPath = path.join(__dirname, 'frontend/src/utils/imageUtils.js');

fs.writeFileSync(frontendImageUtilsPath, `

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    
    return \`/assets/images/\${type}-placeholder.jpg\`;
  }
  
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  
  let fullPath = imagePath;
  
  
  if (!fullPath.startsWith('uploads/')) {
    if (type) {
      fullPath = \`uploads/\${type}/\${imagePath}\`;
    } else {
      fullPath = \`uploads/\${imagePath}\`;
    }
  }
  
  return \`\${BASE_URL}/\${fullPath}\`;
};

export const getPlaceholderImage = (type = 'car') => {
  return \`/assets/images/\${type}-placeholder.jpg\`;
};
`);

const carApiPath = path.join(__dirname, 'frontend/src/api/cars.js');
let carApiContent = fs.readFileSync(carApiPath, 'utf8');

if (!carApiContent.includes('import { getImageUrl }')) {
  carApiContent = `import axios from '../utils/axiosConfig';
import { getImageUrl } from '../utils/imageUtils';

${carApiContent.replace('import axios from \'../utils/axiosConfig\';', '')}`;
}

carApiContent = carApiContent.replace(
  /if \(car\.image && !car\.image_url\) \{[\s\S]*?\}/g,
  `if (car.image && !car.image_url) {
      car.image_url = getImageUrl(car.image, 'cars');
    }`
);

fs.writeFileSync(carApiPath, carApiContent);

const componentsToUpdate = [
  'frontend/src/components/cars/CarCard.jsx',
  'frontend/src/pages/CarDetails.jsx',
  'frontend/src/pages/ManageCars.jsx'
];

componentsToUpdate.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    
    if (!content.includes('import { getImageUrl }')) {
      const importStatement = `import { getImageUrl } from '../utils/imageUtils';`;
      content = content.replace(/import React[^;]*;/, match => `${match}\n${importStatement}`);
    }
    
    
    content = content.replace(/(`|'|")\${(?:process\.env\.REACT_APP_API_URL|'[^']*'|"[^"]*")}\/uploads\/[^`'"]*(`|'|")/g, 
      `getImageUrl(car.image, 'cars')`);
    
    
    content = content.replace(/\${baseUrl}\/\${imagePath}/g, 'getImageUrl(imagePath, "cars")');
    
    fs.writeFileSync(fullPath, content);
  }
});

console.log('Image handling has been standardized successfully');
