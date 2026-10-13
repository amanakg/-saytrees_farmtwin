const Joi = require('joi');

exports.saveSimulationSchema = Joi.object({
  landId: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Land ID is required',
      'number.base': 'Land ID must be a number'
    }),

  modelId: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Model ID is required',
      'number.base': 'Model ID must be a number'
    }),

  plantationModelId: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Plantation Model ID is required',
      'number.base': 'Plantation Model ID must be a number'
    }),
    simulationYears: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'simulationYears is required',
      'number.base': 'simulationYears must be a number'
    }),

  trees: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        treeCategoryId: Joi.number()
          .integer()
          .required()
          .messages({
            'any.required': 'Tree category ID is required',
            'number.base': 'Tree category ID must be a number'
          }),

        treeCategoryName: Joi.string()
          .trim()
          .required()
          .messages({
            'any.required': 'Tree category name is required',
            'string.empty': 'Tree category name cannot be empty'
          }),

        treeId: Joi.number()
          .integer()
          .required()
          .messages({
            'any.required': 'Tree ID is required',
            'number.base': 'Tree ID must be a number'
          }),

        treeName: Joi.string()
          .trim()
          .required()
          .messages({
            'any.required': 'Tree name is required',
            'string.empty': 'Tree name cannot be empty'
          }),

        count: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'any.required': 'Tree count is required',
            'number.base': 'Tree count must be a number',
            'number.min': 'Tree count must be greater than 0'
          })
      })
    )
    .messages({
      'any.required': 'Trees are required',
      'array.min': 'At least one tree is required'
    })
});

exports.getModelListSchema = Joi.object({
  land_id: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Land ID is required',
      'number.base': 'Land ID must be a number',
      'number.integer': 'Land ID must be an integer'
    }),

  plantation_model_id: Joi.number()
    .integer()
    .optional()
    .allow(null, '')
    .messages({
      'number.base': 'Plantation Model ID must be a number',
      'number.integer': 'Plantation Model ID must be an integer'
    })
});
exports.getModelDetailsSchema = Joi.object({
  model_id: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Model ID is required',
      'number.base': 'Model ID must be a number',
      'number.integer': 'Model ID must be an integer'
    })
});
