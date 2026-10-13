const csvStore = require('../utils/csvStore');

// Initialize CSV storage (Local or AWS S3 based on STORAGE_TYPE)
(async () => {
  try {
    await csvStore.initCSVStorage();
  } catch (err) {
    console.error('CSV Storage initialization error:', err.message);
  }
})();

module.exports = {
  pool: null,
  csvStore
};
