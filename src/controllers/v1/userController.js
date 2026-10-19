const db = require('../../utils/dbQuery');
const { formatAssetUrl } = require('../../utils/urlHelper');
const fs = require('fs').promises;
const path = require('path');

/*
 * GET PROFILE BY ID
 * GET /api/public/profile?profile_id=1
 */
exports.getProfile = async (req, res, next) => {
  try {
    const { profile_id } = req.query;
    const targetId = Number(profile_id);

    const [profiles, states, districts, blocks, villages] = await Promise.all([
      db.readTable('profiles'),
      db.readTable('states'),
      db.readTable('districts'),
      db.readTable('blocks'),
      db.readTable('villages')
    ]);

    const found = profiles.find(
      (p) => Number(p.profile_id) === targetId && p.status === true
    );

    if (found) {
      const stateObj = states.find((s) => Number(s.state_id) === Number(found.state_id));
      const districtObj = districts.find((d) => Number(d.district_id) === Number(found.district_id));
      const blockObj = blocks.find((b) => Number(b.block_id) === Number(found.block_id));
      const villageObj = villages.find((v) => Number(v.village_id) === Number(found.village_id));

      const profile = {
        profile_id: found.profile_id,
        name: found.name || '',
        contact: found.contact,
        email: found.email || '',
        preferred_language: found.preferred_language,
        state_name: stateObj ? stateObj.state_name : null,
        district_name: districtObj ? districtObj.district_name : null,
        block_name: blockObj ? blockObj.block_name : null,
        village_name: villageObj ? villageObj.village_name : '',
        created_at: found.created_at,
        profile_pic: found.profile_pic ? formatAssetUrl(req, found.profile_pic) : ''
      };

      return res.status(200).json({
        status: 1,
        data: profile
      });
    } else {
      return res.status(200).json({
        status: 0,
        message: 'No records found'
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE FARMER PROFILE
 * POST /api/v1/user/createProfile
 */
exports.createProfile = async (req, res, next) => {
  try {
    const {
      name,
      contact,
      email,
      preferred_language,
      state_id,
      district_id,
      block_id,
      village_id
    } = req.body;

    // 1. Check existing profile
    const profiles = await db.readTable('profiles');
    const existing = profiles.filter(
      (p) =>
        p.status === true &&
        (String(p.contact) === String(contact) ||
          (email && p.email && String(p.email).toLowerCase() === String(email).toLowerCase()))
    );

    if (existing.length > 0) {
      const profile_id = existing[0].profile_id;

      return res.json({
        status: 1,
        profile_id,
        is_existing: true
      });
    }

    // 2. Insert new profile
    const now = new Date().toISOString();
    const created = await db.insertRow('profiles', {
      name: name || '',
      contact: String(contact),
      email: email || '',
      preferred_language,
      state_id: Number(state_id),
      district_id: Number(district_id),
      block_id: Number(block_id),
      village_id: village_id ? Number(village_id) : null,
      profile_pic: '',
      status: true,
      created_at: now,
      updated_at: now
    });

    return res.json({
      status: 1,
      profile_id: created.profile_id,
      is_existing: false
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE PROFILE
 * PUT /api/v1/user/updateProfile/:profile_id
 */
exports.updateProfile = async (req, res, next) => {
  let uploadedFilePath = null;

  try {
    const { profile_id } = req.params;

    // 1. Validate ID
    if (!profile_id || isNaN(profile_id)) {
      const err = new Error('profile_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const id = Number(profile_id);

    const {
      name,
      email,
      preferred_language,
      state_id,
      district_id,
      block_id,
      village_id
    } = req.body;

    // 2. Check profile existence
    const profiles = await db.readTable('profiles');
    const existing = profiles.filter(
      (p) => Number(p.profile_id) === id && p.status === true
    );

    if (existing.length === 0) {
      const err = new Error('Profile not found');
      err.statusCode = 404;
      throw err;
    }

    const oldProfilePic = existing[0].profile_pic;
    let finalProfilePic = null;

    // 3. File upload
    if (req.file) {
      finalProfilePic = `uploads/profileImages/${req.file.filename}`;
      uploadedFilePath = path.join(process.cwd(), finalProfilePic);
    }

    // 4. Email duplicate check
    if (email) {
      const duplicate = profiles.filter(
        (p) =>
          p.email &&
          String(p.email).toLowerCase() === String(email).toLowerCase() &&
          Number(p.profile_id) !== id
      );

      if (duplicate.length > 0) {
        const err = new Error('Email already exists');
        err.statusCode = 400;
        throw err;
      }
    }

    // 5. Update CSV record
    const updatedRows = await db.updateRows(
      'profiles',
      (p) => Number(p.profile_id) === id,
      (row) => ({
        name: name !== undefined && name !== null ? name : row.name,
        email: email !== undefined && email !== null ? email : row.email,
        preferred_language:
          preferred_language !== undefined && preferred_language !== null
            ? preferred_language
            : row.preferred_language,
        state_id:
          state_id !== undefined && state_id !== null
            ? Number(state_id)
            : row.state_id,
        district_id:
          district_id !== undefined && district_id !== null
            ? Number(district_id)
            : row.district_id,
        block_id:
          block_id !== undefined && block_id !== null
            ? Number(block_id)
            : row.block_id,
        village_id:
          village_id !== undefined && village_id !== null
            ? Number(village_id)
            : row.village_id,
        profile_pic:
          finalProfilePic !== null ? finalProfilePic : row.profile_pic,
        updated_at: new Date().toISOString()
      })
    );

    const updated = updatedRows[0];

    // 6. Delete old image (non-blocking)
    if (req.file && oldProfilePic) {
      const oldPath = path.join(process.cwd(), oldProfilePic);
      fs.unlink(oldPath).catch(() => {});
    }

    // 7. Success response
    return res.json({
      status: 1,
      message: 'Profile updated successfully',
      data: {
        profile_id: updated.profile_id,
        profile_pic: updated.profile_pic ? formatAssetUrl(req, updated.profile_pic) : null
      }
    });
  } catch (err) {
    // 8. Cleanup uploaded file if error
    if (uploadedFilePath) {
      fs.unlink(uploadedFilePath).catch(() => {});
    }

    next(err);
  }
};
