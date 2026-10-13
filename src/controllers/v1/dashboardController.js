const db = require('../../utils/dbQuery');
const { sendListResponse } = require('../../utils/responseHelper');

/**
 * Helper to parse fruit_yield whether stored as a number (e.g. 25)
 * or a PostgreSQL int4range / range string (e.g. "[10,21)", "[10,20]", "10-20")
 */
function formatFruitYield(rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '') return 0;
  if (typeof rawVal === 'number') return Number(rawVal.toFixed(2));

  const str = String(rawVal).trim();
  // Match PostgreSQL range "[lower,upper)" or "[lower,upper]"
  const pgRangeMatch = str.match(/^([[(])\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*([\])])$/);
  if (pgRangeMatch) {
    const lowerBracket = pgRangeMatch[1];
    let lower = parseFloat(pgRangeMatch[2]);
    let upper = parseFloat(pgRangeMatch[3]);
    const upperBracket = pgRangeMatch[4];
    if (lowerBracket === '(') lower += 1;
    if (upperBracket === ')') upper -= 1;
    return Number(((upper + lower) / 2.0).toFixed(2));
  }

  // Match simple "lower-upper" range
  const hyphenMatch = str.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (hyphenMatch) {
    const lower = parseFloat(hyphenMatch[1]);
    const upper = parseFloat(hyphenMatch[2]);
    return Number(((upper + lower) / 2.0).toFixed(2));
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Number(num.toFixed(2));
}

/**
 * GET request - api/dashboard/individual-tree
 */
exports.individualTreeValue = async (req, res, next) => {
  try {
    const treeName = req.query.treeName;
    const age = req.query.age;

    // validation for age
    if (isNaN(age)) {
      const err = new Error('age should be a number');
      err.statusCode = 400;
      throw err;
    }
    if (!age) {
      const err = new Error('age is required');
      err.statusCode = 400;
      throw err;
    }
    // validation for treeName
    if (!treeName) {
      const err = new Error('treename is required');
      err.statusCode = 400;
      throw err;
    }

    const config = TREE_MAP[treeName.toLowerCase()];

    if (!config) {
      const err = new Error('Invalid Tree');
      err.statusCode = 400;
      throw err;
    }

    const tableName = config.tableName;
    const targetAge = Number(age);
    const rows = await db.readTable(tableName);

    const individualTreeValue = rows
      .filter((row) => Number(row.age) === targetAge)
      .map((row) => ({
        id: row.id,
        harvest_year: row.harvest_year,
        age: row.age,
        tree_er: row.tree_er,
        height: row.height,
        canopy_dia: row.canopy_dia,
        soc_incr: row.soc_incr,
        total_combined_er: row.total_combined_er,
        fruit_yield: formatFruitYield(row.fruit_yield)
      }));

    return sendListResponse(res, individualTreeValue, 'Data fetched successfully.');
  } catch (err) {
    next(err);
  }
};

exports.combinedTreeValue = async (req, res, next) => {
  try {
    const { treeName, age } = req.query;

    const treeNames = (treeName || '')
      .split(',')
      .map((tree) => tree.replace(/\s/g, ''))
      .filter(Boolean);

    // validation
    if (!Array.isArray(treeNames) || treeNames.length === 0) {
      const err = new Error('trees is required');
      err.statusCode = 400;
      throw err;
    }
    // validation for age
    if (isNaN(age)) {
      const err = new Error('age should be a number');
      err.statusCode = 400;
      throw err;
    }
    if (!age) {
      const err = new Error('age is required');
      err.statusCode = 400;
      throw err;
    }

    const entries = await Promise.all(
      treeNames.map(async (t) => await fetchTreeValueByAge(t, age))
    );
    const combinedTreeValue = entries.flat();
    return sendListResponse(res, combinedTreeValue, 'Data fetched successfully.');
  } catch (err) {
    next(err);
  }
};

async function fetchTreeValueByAge(treeName, age) {
  const config = TREE_MAP[treeName.toLowerCase()];
  if (!config) {
    const err = new Error('unknown tree.');
    err.statusCode = 400;
    throw err;
  }

  const tableName = config.tableName;
  const targetAge = Number(age);
  const rows = await db.readTable(tableName);

  return rows
    .filter((row) => Number(row.age) === targetAge)
    .map((row) => ({
      id: row.id,
      harvest_year: row.harvest_year,
      age: row.age,
      tree_er: row.tree_er,
      height: row.height,
      canopy_dia: row.canopy_dia,
      soc_incr: row.soc_incr,
      total_combined_er: row.total_combined_er,
      fruit_yield: formatFruitYield(row.fruit_yield),
      tree_name: treeName
    }));
}

const TREE_MAP = {
  mango: { tableName: 'mango', isRange: false },
  guava: { tableName: 'guava', isRange: true },
  jackfruit: { tableName: 'jackfruit', isRange: false },
  jamun: { tableName: 'jamun', isRange: false },
  sapota: { tableName: 'sapota', isRange: false }
};