const db = require('../../utils/dbQuery');
const { sendListResponse } = require('../../utils/responseHelper');
const { formatAssetUrl } = require('../../utils/urlHelper');

exports.startSimulation = async (req, res, next) => {
  try {
    const {
      landId,
      modelId,
      plantationModelId,
      simulationYears,
      createdBy,
      trees
    } = req.body;

    const targetModelId = Number(modelId);

    // Duplicate simulation Check
    const simulations = await db.readTable('simulation');
    const duplicateModel = simulations.filter(
      (s) => Number(s.model_id) === targetModelId
    );

    if (duplicateModel.length > 0) {
      const err = new Error('Simulation already exists for this plantation model');
      err.statusCode = 409;
      throw err;
    }

    const simulationRow = await db.insertRow('simulation', {
      land_id: Number(landId),
      model_id: targetModelId,
      plantation_model_id: Number(plantationModelId),
      simulation_years: Number(simulationYears),
      created_by: createdBy !== undefined && createdBy !== null ? Number(createdBy) : null,
      created_at: new Date().toISOString()
    });

    const simulationId = simulationRow.simulation_id;

    const treeRowsToInsert = trees.map((tree) => ({
      simulation_id: simulationId,
      tree_category_id: Number(tree.treeCategoryId),
      tree_category_name: tree.treeCategoryName,
      tree_id: Number(tree.treeId),
      tree_name: tree.treeName,
      tree_count: Number(tree.count)
    }));

    await db.insertMany('simulation_tree_detail', treeRowsToInsert);

    const totalTrees = trees.reduce((sum, tree) => sum + Number(tree.count), 0);

    return res.status(200).json({
      status: 1,
      message: 'Simulation started successfully',
      data: {
        simulationId,
        landId,
        modelId,
        plantationModelId,
        simulationYears,
        totalTrees
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getModelList = async (req, res, next) => {
  try {
    const { land_id, plantation_model_id } = req.query;
    const targetLandId = Number(land_id);
    const hasPlantationFilter =
      plantation_model_id !== undefined &&
      plantation_model_id !== null &&
      String(plantation_model_id).trim() !== '';
    const targetPlantationModelId = hasPlantationFilter
      ? Number(plantation_model_id)
      : null;

    const [savedModels, lands, simulations, simTrees] = await Promise.all([
      db.readTable('saved_model'),
      db.readTable('land_details'),
      db.readTable('simulation'),
      db.readTable('simulation_tree_detail')
    ]);

    const landMap = new Map(lands.map((l) => [Number(l.land_id), l]));

    const filteredModels = savedModels
      .filter((sm) => Number(sm.land_id) === targetLandId && landMap.has(Number(sm.land_id)))
      .sort((a, b) => Number(b.model_id) - Number(a.model_id));

    const formattedModelList = [];

    for (const sm of filteredModels) {
      const ld = landMap.get(Number(sm.land_id));
      const sim = simulations.find((s) => Number(s.model_id) === Number(sm.model_id));

      if (targetPlantationModelId !== null) {
        if (!sim || Number(sim.plantation_model_id) !== targetPlantationModelId) {
          continue;
        }
      }

      const treesForSim = sim
        ? simTrees.filter((std) => Number(std.simulation_id) === Number(sim.simulation_id))
        : [];

      const modelEntry = {
        model_id: sm.model_id,
        model_name: sm.model_name,
        land_size:
          ld && ld.land_size !== undefined && ld.land_size !== null && ld.land_size !== ''
            ? Number(Number(ld.land_size).toFixed(2))
            : 0,
        land_unit: ld.land_unit,
        plantation_model_id: sim ? Number(sim.plantation_model_id) : 0,
        total_no_of_trees: 0,
        trees_planted: []
      };

      for (const std of treesForSim) {
        if (Number(std.tree_id) > 0) {
          modelEntry.total_no_of_trees += Number(std.tree_count);
          modelEntry.trees_planted.push({
            tree_category_id: Number(std.tree_category_id),
            tree_category_name: std.tree_category_name || '',
            tree_id: Number(std.tree_id),
            tree_name: std.tree_name || '',
            tree_count: Number(std.tree_count)
          });
        }
      }

      formattedModelList.push(modelEntry);
    }

    return sendListResponse(res, formattedModelList);
  } catch (error) {
    next(error);
  }
};

exports.getModelDetails = async (req, res, next) => {
  try {
    const { model_id } = req.query;
    const targetModelId = Number(model_id);

    const [savedModels, lands, simulations, simTrees] = await Promise.all([
      db.readTable('saved_model'),
      db.readTable('land_details'),
      db.readTable('simulation'),
      db.readTable('simulation_tree_detail')
    ]);

    const sm = savedModels.find((m) => Number(m.model_id) === targetModelId);
    if (!sm) {
      const error = new Error('Model not found');
      error.statusCode = 404;
      throw error;
    }

    const ld = lands.find((l) => Number(l.land_id) === Number(sm.land_id));
    if (!ld) {
      const error = new Error('Model not found');
      error.statusCode = 404;
      throw error;
    }

    const sim = simulations.find((s) => Number(s.model_id) === targetModelId);
    const treesForSim = sim
      ? simTrees.filter((std) => Number(std.simulation_id) === Number(sim.simulation_id))
      : [];

    const data = {
      model_id: sm.model_id,
      model_name: sm.model_name,
      farm_image_url: sm.farm_image_url
        ? formatAssetUrl(req, sm.farm_image_url)
        : null,
      land_id: sm.land_id,
      land_name: ld.land_name,
      land_size:
        ld && ld.land_size !== undefined && ld.land_size !== null && ld.land_size !== ''
          ? Number(Number(ld.land_size).toFixed(2))
          : 0,
      land_unit: ld.land_unit,
      plantation_model_id: sim ? Number(sim.plantation_model_id) : 0,
      simulation_years: sim ? Number(sim.simulation_years) : 0,
      total_no_of_trees: 0,
      trees_planted: []
    };

    for (const std of treesForSim) {
      if (Number(std.tree_id) > 0) {
        data.total_no_of_trees += Number(std.tree_count);
        data.trees_planted.push({
          tree_category_id: Number(std.tree_category_id),
          tree_category_name: std.tree_category_name || '',
          tree_id: Number(std.tree_id),
          tree_name: std.tree_name || '',
          tree_count: Number(std.tree_count)
        });
      }
    }

    return res.status(200).json({
      status: 1,
      message: 'Model details fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSimulation = async (req, res, next) => {
  try {
    const { model_id } = req.params;
    const { plantationModelId, simulationYears, trees } = req.body;

    if (!model_id || isNaN(model_id)) {
      const err = new Error('Model ID must be numeric');
      err.statusCode = 400;
      throw err;
    }

    const targetModelId = Number(model_id);

    // Check model exists
    const savedModels = await db.readTable('saved_model');
    const modelExists = savedModels.find(
      (m) => Number(m.model_id) === targetModelId
    );

    if (!modelExists) {
      const err = new Error('Model not found');
      err.statusCode = 404;
      throw err;
    }

    const landId = Number(modelExists.land_id);
    const createdBy = modelExists.created_by ? Number(modelExists.created_by) : null;

    // Check simulation exists
    const simulations = await db.readTable('simulation');
    const existingSim = simulations.find(
      (s) => Number(s.model_id) === targetModelId
    );

    let simulationId;

    if (existingSim) {
      simulationId = Number(existingSim.simulation_id);

      await db.updateRows(
        'simulation',
        (s) => Number(s.model_id) === targetModelId,
        {
          plantation_model_id: Number(plantationModelId),
          simulation_years: Number(simulationYears),
          updated_at: new Date().toISOString()
        }
      );

      await db.deleteRows(
        'simulation_tree_detail',
        (std) => Number(std.simulation_id) === simulationId
      );
    } else {
      const newSim = await db.insertRow('simulation', {
        land_id: landId,
        model_id: targetModelId,
        plantation_model_id: Number(plantationModelId),
        simulation_years: Number(simulationYears),
        created_by: createdBy,
        created_at: new Date().toISOString()
      });

      simulationId = Number(newSim.simulation_id);
    }

    // Insert Tree Details
    if (Array.isArray(trees) && trees.length > 0) {
      const treeRowsToInsert = trees.map((tree) => ({
        simulation_id: simulationId,
        tree_category_id: Number(tree.treeCategoryId),
        tree_category_name: tree.treeCategoryName,
        tree_id: Number(tree.treeId),
        tree_name: tree.treeName,
        tree_count: Number(tree.count)
      }));

      await db.insertMany('simulation_tree_detail', treeRowsToInsert);
    }

    return res.status(200).json({
      status: 1,
      message: 'Simulation updated successfully'
    });
  } catch (error) {
    next(error);
  }
};