// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const uploadPath = path.join(process.cwd(), 'uploads/profileImages');

// // ✅ ensure folder exists
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// // ✅ storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName =
//       Date.now() +
//       '-' +
//       Math.round(Math.random() * 1E9) +
//       path.extname(file.originalname);

//     cb(null, uniqueName);
//   }
// });

// // ✅ file type validation
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     'image/jpeg',
//     'image/png',
//     'image/jpg',
//     'image/webp'
//   ];

//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPEG, PNG, JPG, WEBP images are allowed'), false);
//   }
// };

// // ✅ multer config
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 20 * 1024 * 1024 // ✅ 10MB limit
//   }
// });

// module.exports = upload;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (folderName) => {
  const uploadPath = path.join(
    process.cwd(),
    'uploads',
    folderName
  );

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

      cb(null, uniqueName);
    }
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp'
      ];
      const ext = path.extname(file.originalname).toLowerCase();

      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, JPG, PNG and WEBP images are allowed'));
      }
    },
    limits: {
      fileSize: 20 * 1024 * 1024
    }
  });
};


module.exports = {
  uploadProfileImage: createUploader('profileImages'),
  uploadFarmImage: createUploader('farmImages')
};
