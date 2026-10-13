// const fs = require('fs').promises;
// const path = require('path');

// /**
//  * ✅ Profile Image Cleanup Middleware
//  * Deletes uploaded profile image if request fails
//  */
// const profileImageCleanup = (req, res, next) => {

//   // ✅ track uploaded file
//   if (req.file) {
//     req.uploadedProfileImage = {
//       fileName: req.file.filename,
//       relativePath: `uploads/profileImages/${req.file.filename}`,
//       absolutePath: path.join(
//         process.cwd(),
//         'uploads',
//         'profileImages',
//         req.file.filename
//       )
//     };
//   }

//   // ✅ run after response finishes
//   res.on('finish', async () => {

//     // ✅ delete only if request failed
//     if (res.statusCode >= 400 && req.uploadedProfileImage) {

//       try {
//         await fs.unlink(req.uploadedProfileImage.absolutePath);

//         console.log("Uploaded profile image removed:",
//           req.uploadedProfileImage.fileName
//         );

//       } catch (err) {

//         if (err.code !== 'ENOENT') {
//           console.error("Cleanup failed:", err.message);
//         }
//       }
//     }

//   });

//   next();
// };

// module.exports = profileImageCleanup;


const fs = require('fs').promises;
const path = require('path');

/**
 * ✅ Generic Image Cleanup Middleware
 * Deletes uploaded file if request fails
 */
const imageCleanup = (folderName, propertyName) => {
  return (req, res, next) => {

    if (req.file) {
      req[propertyName] = {
        fileName: req.file.filename,
        relativePath: `uploads/${folderName}/${req.file.filename}`,
        absolutePath: path.join(
          process.cwd(),
          'uploads',
          folderName,
          req.file.filename
        )
      };
    }

    res.on('finish', async () => {

      if (res.statusCode >= 400 && req[propertyName]) {

        try {
          await fs.unlink(req[propertyName].absolutePath);

          console.log(
            'Uploaded file removed:',
            req[propertyName].fileName
          );

        } catch (err) {

          if (err.code !== 'ENOENT') {
            console.error('Cleanup failed:', err.message);
          }
        }
      }
    });

    next();
  };
};

module.exports = {
  profileImageCleanup: imageCleanup(
    'profileImages',
    'uploadedProfileImage'
  ),

  farmImageCleanup: imageCleanup(
    'farmImages',
    'uploadedFarmImage'
  )
};