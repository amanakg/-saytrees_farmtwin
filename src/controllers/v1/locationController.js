const db = require('../../utils/dbQuery');
const { sendListResponse } = require('../../utils/responseHelper');

/**
 * GET /api/public/states
 */
exports.getStates = async (req, res, next) => {
  try {
    const allStates = await db.readTable('states');
    const states = allStates
      .filter((row) => row.status === true)
      .sort((a, b) => String(a.state_name).localeCompare(String(b.state_name)))
      .map(({ state_id, state_name }) => ({ state_id, state_name }));

    return sendListResponse(res, states);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/public/districts?state_id=1
 */
exports.getDistricts = async (req, res, next) => {
  try {
    const { state_id } = req.query;

    if (!state_id) {
      const err = new Error('state_id is required');
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(state_id)) {
      const err = new Error('state_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const targetStateId = Number(state_id);
    const allDistricts = await db.readTable('districts');
    const districts = allDistricts
      .filter((row) => Number(row.state_id) === targetStateId && row.status === true)
      .sort((a, b) => String(a.district_name).localeCompare(String(b.district_name)))
      .map(({ district_id, district_name }) => ({ district_id, district_name }));

    return sendListResponse(res, districts);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/public/blocks?district_id=10
 */
exports.getBlocks = async (req, res, next) => {
  try {
    const { district_id } = req.query;

    if (!district_id) {
      const err = new Error('district_id is required');
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(district_id)) {
      const err = new Error('district_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const targetDistrictId = Number(district_id);
    const allBlocks = await db.readTable('blocks');
    const blocks = allBlocks
      .filter((row) => Number(row.district_id) === targetDistrictId && row.status === true)
      .sort((a, b) => String(a.block_name).localeCompare(String(b.block_name)))
      .map(({ block_id, block_name }) => ({ block_id, block_name }));

    return sendListResponse(res, blocks);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/public/villages?block_id=10
 */
exports.getVillages = async (req, res, next) => {
  try {
    const { block_id } = req.query;

    if (!block_id) {
      const err = new Error('block_id is required');
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(block_id)) {
      const err = new Error('block_id must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const targetBlockId = Number(block_id);
    const allVillages = await db.readTable('villages');
    const villages = allVillages
      .filter((row) => Number(row.block_id) === targetBlockId && row.status === true)
      .sort((a, b) => String(a.village_name).localeCompare(String(b.village_name)))
      .map(({ village_id, village_name }) => ({ village_id, village_name }));

    return sendListResponse(res, villages);
  } catch (err) {
    next(err);
  }
};
