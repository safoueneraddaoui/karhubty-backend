import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

// File upload configuration for car images
export const carImageStorage = diskStorage({
  destination: './uploads/cars',
  filename: (req, file, callback) => {
    const uniqueName = `${uuid()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

// File filter for images only
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};