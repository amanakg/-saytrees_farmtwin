const db = require('../../utils/dbQuery');
const { sendListResponse } = require('../../utils/responseHelper');
const fs = require('fs').promises;
const path = require('path');

/**
 * POST /api/land/create-land
 */
exports.createLand = async (req, res, next) => {
  try {
    const { profile_id, land_name, land_size, land_unit } = req.body;
    const targetProfileId = Number(profile_id);

    // Check profile exists
    const profiles = await db.readTable('profiles');
    const profile = profiles.filter((p) => Number(p.profile_id) === targetProfileId);

    if (!profile.length) {
      const err = new Error('Profile not found');
      err.statusCode = 404;
      throw err;
    }

    const lands = await db.readTable('land_details');
    const landExists = lands.filter(
      (l) =>
        Number(l.profile_id) === targetProfileId &&
        String(l.land_name).toLowerCase() === String(land_name).trim().toLowerCase()
    );

    if (landExists.length > 0) {
      const err = new Error('Land name already exists');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const createdLand = await db.insertRow('land_details', {
      profile_id: targetProfileId,
      land_name: land_name.trim(),
      land_size: Number(land_size),
      land_unit: land_unit || 'ACRE',
      status: true,
      created_at: now,
      updated_at: now
    });

    createdLand.land_size = Number(createdLand.land_size);
    return res.status(200).json({
      status: 1,
      message: 'Land created successfully',
      data: createdLand
    });
  } catch (error) {
    console.error('Create Land Error:', error);
    next(error);
  }
};

/**
 * GET /api/land/land-list?profile_id=1
 */
exports.getLandList = async (req, res, next) => {
  try {
    const { profile_id, plantation_model_id } = req.query;
    const targetProfileId = Number(profile_id);
    const hasPlantationFilter =
      plantation_model_id !== undefined &&
      plantation_model_id !== null &&
      String(plantation_model_id).trim() !== '';
    const targetPlantationModelId = hasPlantationFilter ? Number(plantation_model_id) : null;

    const [lands, simulations] = await Promise.all([
      db.readTable('land_details'),
      db.readTable('simulation')
    ]);

    const filteredLands = lands
      .filter((ld) => {
        if (Number(ld.profile_id) !== targetProfileId) return false;
        if (targetPlantationModelId === null) return true;
        return simulations.some(
          (s) =>
            Number(s.land_id) === Number(ld.land_id) &&
            Number(s.plantation_model_id) === targetPlantationModelId
        );
      })
      .sort((a, b) => Number(b.land_id) - Number(a.land_id));

    const formattedLandlist = filteredLands.map((item) => ({
      land_id: item.land_id,
      profile_id: item.profile_id,
      land_name: item.land_name,
      land_size: item.land_size ? Number(item.land_size) : 0,
      land_unit: item.land_unit,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return sendListResponse(res, formattedLandlist);
  } catch (error) {
    console.error('Get Land List Error:', error);
    next(error);
  }
};

exports.renameLand = async (req, res, next) => {
  try {
    const { profile_id, land_id } = req.params;
    const { land_name } = req.body;

    // validation for land_id
    if (!land_id || isNaN(land_id)) {
      const err = new Error('land_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    // validation for profile_id
    if (!profile_id || isNaN(profile_id)) {
      const err = new Error('profile_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const targetLandId = Number(land_id);
    const targetProfileId = Number(profile_id);

    const lands = await db.readTable('land_details');
    const landExist = lands.filter((l) => Number(l.land_id) === targetLandId);

    if (landExist.length === 0) {
      const err = new Error('No land found');
      err.statusCode = 404;
      throw err;
    }

    const duplicateCheck = lands.filter(
      (l) =>
        Number(l.profile_id) === targetProfileId &&
        l.land_name === land_name &&
        Number(l.land_id) !== targetLandId
    );

    if (duplicateCheck.length > 0) {
      const err = new Error('A land with this name already exists for this profile.');
      err.statusCode = 409;
      throw err;
    }

    const updatedRows = await db.updateRows(
      'land_details',
      (l) => Number(l.profile_id) === targetProfileId && Number(l.land_id) === targetLandId,
      { land_name, updated_at: new Date().toISOString() }
    );

    if (updatedRows.length === 0) {
      const err = new Error('No land found for this profile');
      err.statusCode = 404;
      throw err;
    }

    return sendListResponse(
      res,
      { land_id: updatedRows[0].land_id, newLandName: land_name },
      'Land name updated successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.deleteLand = async (req, res, next) => {
  try {
    const { land_id } = req.params;

    if (!land_id || isNaN(land_id)) {
      const err = new Error('land_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const targetLandId = Number(land_id);
    const lands = await db.readTable('land_details');
    const landExists = lands.filter((l) => Number(l.land_id) === targetLandId);

    if (landExists.length === 0) {
      const err = new Error("Land doesn't exist.");
      err.statusCode = 404;
      throw err;
    }

    // Get all farm images for this land
    const allModels = await db.readTable('saved_model');
    const models = allModels.filter((m) => Number(m.land_id) === targetLandId);

    // Delete physical files
    for (const model of models) {
      if (model.farm_image_url) {
        const filePath = path.join(
          process.cwd(),
          model.farm_image_url.replace(/^\/+/, '')
        );
        await fs.unlink(filePath).catch(() => {});
      }
    }

    // Cascade delete related simulations, tree details, and saved models
    const simulations = await db.readTable('simulation');
    const simIdsToDelete = new Set(
      simulations
        .filter((s) => Number(s.land_id) === targetLandId)
        .map((s) => Number(s.simulation_id))
    );

    if (simIdsToDelete.size > 0) {
      await db.deleteRows('simulation_tree_detail', (std) =>
        simIdsToDelete.has(Number(std.simulation_id))
      );
      await db.deleteRows('simulation', (s) => Number(s.land_id) === targetLandId);
    }

    if (models.length > 0) {
      await db.deleteRows('saved_model', (m) => Number(m.land_id) === targetLandId);
    }

    await db.deleteRows('land_details', (l) => Number(l.land_id) === targetLandId);

    return sendListResponse(res, { land_id: land_id }, 'Land is removed successfully');
  } catch (err) {
    next(err);
  }
};

exports.saveModel = async (req, res, next) => {
  let uploadedFilePath = null;

  try {
    const { landId, modelName, created_by } = req.body;

    if (req.file) {
      uploadedFilePath = req.file.path;
    }

    if (!req.file) {
      const err = new Error('Farm image is required');
      err.statusCode = 400;
      throw err;
    }

    const targetLandId = Number(landId);
    const targetCreatedBy = Number(created_by);

    // Check Land Exists
    const lands = await db.readTable('land_details');
    const landResult = lands.filter((l) => Number(l.land_id) === targetLandId);
    if (landResult.length === 0) {
      const err = new Error('Land not found');
      err.statusCode = 404;
      throw err;
    }

    // Check Profile Exists
    const profiles = await db.readTable('profiles');
    const profileResult = profiles.filter((p) => Number(p.profile_id) === targetCreatedBy);
    if (profileResult.length === 0) {
      const err = new Error('Profile not found');
      err.statusCode = 404;
      throw err;
    }

    // Duplicate Model Name Check
    const savedModels = await db.readTable('saved_model');
    const duplicateModel = savedModels.filter(
      (m) =>
        String(m.model_name).toLowerCase() === String(modelName).trim().toLowerCase() &&
        Number(m.created_by) === targetCreatedBy
    );

    if (duplicateModel.length > 0) {
      const err = new Error('Model name already exists');
      err.statusCode = 409;
      throw err;
    }

    const farmImageUrl = `uploads/farmImages/${req.file.filename}`;

    const insertedModel = await db.insertRow('saved_model', {
      land_id: targetLandId,
      model_name: modelName.trim(),
      farm_image_url: farmImageUrl,
      created_by: targetCreatedBy,
      created_at: new Date().toISOString()
    });

    const landInfo = landResult[0];

    return res.status(200).json({
      status: 1,
      message: 'Model saved successfully',
      data: {
        model_id: insertedModel.model_id,
        land_id: insertedModel.land_id,
        model_name: insertedModel.model_name,
        farm_image_url: insertedModel.farm_image_url
          ? `${req.protocol}://${req.get('host')}/${insertedModel.farm_image_url}`
          : null,
        created_by: insertedModel.created_by,
        created_at: insertedModel.created_at,
        land_size: Number(landInfo.land_size),
        land_unit: landInfo.land_unit
      }
    });
  } catch (err) {
    if (uploadedFilePath) {
      await fs.unlink(uploadedFilePath).catch(() => {});
    }

    next(err);
  }
};
