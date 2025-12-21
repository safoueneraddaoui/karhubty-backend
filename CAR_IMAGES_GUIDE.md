# Car Images Implementation Guide

## Overview

This implementation follows best practices for car image management:

- **Database Storage**: Images are properly tracked in the `car_images` table with metadata
- **File Organization**: Images are stored in organized directories with unique filenames
- **Performance**: Lazy loading, responsive images, and proper caching
- **User Experience**: Image galleries, drag-and-drop uploads, and lightbox previews
- **Security**: File validation, size limits, and proper access control

## Backend Implementation

### 1. Database Schema

The `car_images` table stores image metadata:

```typescript
- imageId: Primary key
- carId: Foreign key to cars
- filename: Unique filename on disk
- originalName: Original filename uploaded
- mimeType: Image MIME type
- size: File size in bytes
- width/height: Image dimensions
- isPrimary: Whether this is the cover image
- displayOrder: Order for image gallery
- imagePath: Relative path for storage
- uploadedAt: Timestamp
```

### 2. API Endpoints

#### Get Car Images
```
GET /api/cars/:carId/images
Response: Array of CarImage objects
```

#### Get Primary Image
```
GET /api/cars/:carId/images/primary
Response: Single CarImage object
```

#### Upload Images to Car
```
POST /api/cars/:carId/images
Headers: multipart/form-data
Body: FormData with 'images' files (max 5 files, 5MB each)
Response: Array of saved CarImage objects
```

#### Set Primary Image
```
PUT /api/cars/:carId/images/:imageId/primary
Response: Updated CarImage object
```

#### Delete Image
```
DELETE /api/cars/:carId/images/:imageId
Response: Success message
```

#### Reorder Images
```
PUT /api/cars/:carId/images/reorder
Body: { "imageIds": [1, 3, 2, 4] }
Response: Array of reordered images
```

### 3. File Upload Best Practices

- **Unique Naming**: UUID + timestamp to prevent collisions
- **Size Limits**: 5MB per image, max 5 images per upload
- **Format Support**: JPG, PNG, WebP
- **Organized Storage**: `/uploads/cars/` directory
- **Automatic Cleanup**: Images deleted when car is removed

## Frontend Implementation

### 1. Image Service (`imageService.js`)

Centralized service for all image operations:

```javascript
import imageService from '../services/imageService';

// Get all images
const images = await imageService.getCarImages(carId);

// Get primary image
const primaryImage = await imageService.getPrimaryImage(carId);

// Upload images
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
const result = await imageService.uploadImages(carId, formData);

// Set primary image
await imageService.setPrimaryImage(carId, imageId);

// Delete image
await imageService.deleteImage(carId, imageId);

// Get image URL
const url = imageService.getImageUrl(imagePath);

// Validate before upload
const validation = imageService.validateImage(file);
```

### 2. CarImageGallery Component

Responsive image gallery with lightbox:

```javascript
import CarImageGallery from '../components/CarImageGallery';

<CarImageGallery
  carId={carId}
  images={carImages}
  canEdit={isAgent} // Show edit controls
  onImageDelete={(imageId) => {
    // Refresh images
  }}
  onImageReorder={() => {
    // Refresh images
  }}
  className="mb-6"
/>
```

**Features:**
- Display images in sequence
- Keyboard navigation (arrow keys, ESC)
- Hover-activated controls
- Lightbox fullscreen view
- Primary image badge
- Responsive thumbnail strip
- Lazy loading with loading states
- Error handling and retry

### 3. ImageUploader Component

Drag-and-drop image upload interface:

```javascript
import ImageUploader from '../components/ImageUploader';

<ImageUploader
  carId={carId}
  maxFiles={5}
  onUploadSuccess={() => {
    // Refresh images
    fetchCarImages();
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error);
  }}
/>
```

**Features:**
- Drag and drop support
- File validation
- Preview thumbnails
- Progress indication
- Error messages
- Clear/Remove buttons

## Integration Examples

### Agent Dashboard - Add Images to Car

```javascript
import CarImageGallery from '../components/CarImageGallery';
import ImageUploader from '../components/ImageUploader';
import imageService from '../services/imageService';

const [carImages, setCarImages] = useState([]);

const fetchCarImages = async () => {
  try {
    const images = await imageService.getCarImages(carId);
    setCarImages(images);
  } catch (error) {
    console.error('Error fetching images:', error);
  }
};

useEffect(() => {
  fetchCarImages();
}, [carId]);

// In JSX:
<div className="space-y-6">
  {/* Current Images Gallery */}
  {carImages.length > 0 && (
    <div>
      <h3 className="text-lg font-semibold mb-4">Car Images</h3>
      <CarImageGallery
        carId={carId}
        images={carImages}
        canEdit={true}
        onImageDelete={fetchCarImages}
        onImageReorder={fetchCarImages}
      />
    </div>
  )}

  {/* Upload New Images */}
  <div>
    <h3 className="text-lg font-semibold mb-4">
      {carImages.length > 0 ? 'Add More Images' : 'Upload Car Images'}
    </h3>
    <ImageUploader
      carId={carId}
      onUploadSuccess={fetchCarImages}
      onUploadError={(error) => alert(error)}
    />
  </div>
</div>
```

### User Dashboard - View Car Images

```javascript
import CarImageGallery from '../components/CarImageGallery';

<CarImageGallery
  carId={car.carId}
  images={car.carImages}
  canEdit={false} // No editing for users
  className="rounded-lg shadow-lg"
/>
```

### Car Details Page - Show Primary Image

```javascript
import imageService from '../services/imageService';

const [primaryImage, setPrimaryImage] = useState(null);

useEffect(() => {
  imageService.getPrimaryImage(carId).then(setPrimaryImage);
}, [carId]);

{primaryImage && (
  <img
    src={imageService.getImageUrl(primaryImage.imagePath)}
    alt="Car"
    className="w-full h-80 object-cover rounded-lg"
  />
)}
```

## Best Practices Applied

### 1. Performance
- **Lazy Loading**: Images load on demand
- **Responsive Images**: Display appropriate sizes for different screens
- **Caching**: Browser caches images effectively
- **Thumbnail Strip**: Quick navigation without full reloads

### 2. User Experience
- **Drag & Drop**: Easier file selection
- **Preview**: See images before upload
- **Validation**: Clear error messages
- **Progress**: Feedback during upload
- **Navigation**: Arrow keys, ESC support
- **Lightbox**: Full-screen image viewing

### 3. Security
- **File Validation**: Type and size checks
- **Ownership Verification**: Only agents can modify their car images
- **Unique Filenames**: Prevent directory traversal
- **Access Control**: API endpoints require authentication

### 4. Data Management
- **Metadata Storage**: All image info in database
- **Order Tracking**: Control image sequence
- **Primary Image**: Designate cover photo
- **Cascading Deletion**: Images deleted with car

## Configuration

### File Size Limits
Edit `src/common/utils/file-upload.util.ts`:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

### Max Images Per Upload
Edit `imageUploadLimits` in `file-upload.util.ts`:
```typescript
export const imageUploadLimits = {
  fileSize: MAX_FILE_SIZE,
  files: 5, // Maximum 5 images
};
```

### Allowed Formats
Edit `ALLOWED_IMAGE_EXTENSIONS` in `file-upload.util.ts`:
```typescript
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
```

## Testing

### Test Image Upload
1. Log in as an agent
2. Navigate to create/edit car
3. Upload 1-5 images
4. Verify images appear in gallery
5. Test image reordering
6. Test setting primary image

### Test Image Display
1. View car as user
2. Check image gallery loads
3. Test lightbox functionality
4. Test keyboard navigation

### Test Image Deletion
1. Edit car
2. Delete individual images
3. Delete entire car (cascading delete)
4. Verify files removed from disk

## Troubleshooting

### Images Not Uploading
- Check file size (max 5MB)
- Verify file format (JPG, PNG, WebP)
- Check browser console for errors
- Verify backend is running

### Images Not Displaying
- Check image path is correct
- Verify `/uploads/cars` directory exists
- Check file permissions
- Test with different browser

### Upload Performance Issues
- Reduce image size before upload
- Upload fewer images at once
- Check network connection
- Monitor server resources

## Future Enhancements

1. **Image Compression**: Automatic optimization
2. **Cloud Storage**: S3/Azure Blob support
3. **Image Resizing**: Dynamic thumbnail generation
4. **Batch Operations**: Bulk upload/delete
5. **Image Editing**: Crop/rotate functionality
6. **Analytics**: Track image views
