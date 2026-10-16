const Joi = require('joi');

exports.createLandSchema = Joi.object({
  profile_id: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Profile ID is required',
      'number.base': 'Profile ID must be a number',
      'number.integer': 'Profile ID must be an integer'
    }),

  land_name: Joi.string()
    .trim()
    .max(255)
    .required()
    .messages({
      'any.required': 'Land name is required',
      'string.empty': 'Land name cannot be empty',
      'string.max': 'Land name cannot exceed 255 characters'
    }),

  land_size: Joi.number()
    .positive()
    .required()
    .messages({
      'any.required': 'Land size is required',
      'number.base': 'Land size must be a valid number',
      'number.positive': 'Land size must be greater than 0'
    }),

  land_unit: Joi.string()
    .valid('ACRE', 'HECTARE', 'SQFT')
    .default('ACRE')
    .messages({
      'any.only': 'Land unit must be ACRE, HECTARE, or SQFT'
    })
});

exports.getLandListSchema = Joi.object({
  profile_id: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Profile ID is required',
      'number.base': 'Profile ID must be a number',
      'number.integer': 'Profile ID must be an integer'
    }),
    plantation_model_id: Joi.number()
        .integer()
        .optional()
        .allow(null, '')
        .messages({
          'number.base': 'Plantation Model ID must be a number',
          'number.integer': 'Plantation Model ID must be an integer'
    })

  // page: Joi.number()
  //   .integer()
  //   .min(1)
  //   .default(1)
  //   .messages({
  //     'number.base': 'Page must be a number',
  //     'number.min': 'Page must be greater than 0'
  //   }),

  // limit: Joi.number()
  //   .integer()
  //   .min(1)
  //   .max(100)
  //   .default(10)
  //   .messages({
  //     'number.base': 'Limit must be a number',
  //     'number.min': 'Limit must be greater than 0',
  //     'number.max': 'Limit cannot exceed 100'
  //   })
});

exports.renameLandSchema = Joi.object({
  land_name: Joi.string()
    .trim()
    .max(255)
    .required()
    .messages({
      'any.required': 'Land name is required',
      'string.empty': 'Land name cannot be empty',
      'string.max': 'Land name cannot exceed 255 characters'
    })

})

exports.landRemoveSchema = Joi.object({
  land_id : Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Land Id is required',
      'number.base': 'Land Id must be a number',
      'number.integer': 'Land Id must be an integer'
    })  
})

exports.saveModelSchema = Joi.object({
  landId: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Land ID is required',
      'number.base': 'Land ID must be a number',
      'number.integer': 'Land ID must be an integer'
    }),

  modelName: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'any.required': 'Model name is required',
      'string.base': 'Model name must be a string',
      'string.empty': 'Model name is required',
      'string.min': 'Model name must be at least 3 characters',
      'string.max': 'Model name cannot exceed 200 characters'
    }),

  created_by: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Created By is required',
      'number.base': 'Created By must be a number',
      'number.integer': 'Created By must be an integer'
    })
});

exports.renameModelSchema = Joi.object({
  model_name: Joi.string()
    .trim()
    .max(200)
    .required()
    .messages({
      'any.required': 'Model name is required',
      'string.empty': 'Model name is required',
      'string.max': 'Model name cannot exceed 200 characters'
    })
});

