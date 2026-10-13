const Joi = require('joi');

/**
 * ✅ CREATE PROFILE (POST)
 */
exports.createProfileSchema = Joi.object({
 
  contact: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.base': 'Contact must be a valid string',
      'string.empty': 'Contact is required',
      'string.pattern.base': 'Contact must be a valid 10-digit number'
    }),
 
  preferred_language: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.empty': 'preferred_language is required',
      'string.max': 'preferred_language must not exceed 50 characters'
    }),
 
  state_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'state_id must be numeric',
      'any.required': 'state_id is required'
    }),
 
  district_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'district_id must be numeric',
      'any.required': 'district_id is required'
    }),
 
  block_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'block_id must be numeric',
      'any.required': 'block_id is required'
    }),
 
  village_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'village_id must be numeric'
    })
 
});


/**
 * ✅ GET PROFILE (GET)
 */
exports.getProfileSchema = Joi.object({
  profile_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'profile_id is required',
      'number.base': 'profile_id must be numeric'
    })
});

exports.updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(150)
    .optional()
    .empty()
    .messages({
      'string.base': 'Name must be a valid string',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 150 characters'
    }),

  email: Joi.string()
    .email()
    .optional()
    .empty()
    .messages({
      'string.base': 'Email must be a valid string',
      'string.email': 'Please enter a valid email address'
    }),

  preferred_language: Joi.string()
    .optional()
    .empty()
    .messages({
      'string.base': 'Preferred language must be a valid string'
    }),

  state_id: Joi.number()
    .integer()
    .optional()
    .messages({
      'number.base': 'State ID must be a number',
      'number.integer': 'State ID must be an integer'
    }),

  district_id: Joi.number()
    .integer()
    .optional()
    .messages({
      'number.base': 'District ID must be a number',
      'number.integer': 'District ID must be an integer'
    }),

  block_id: Joi.number()
    .integer()
    .optional()
    .messages({
      'number.base': 'Block ID must be a number',
      'number.integer': 'Block ID must be an integer'
    }),

  village_id: Joi.number()
    .integer()
    .optional()
    .messages({
      'number.base': 'Village ID must be a number',
      'number.integer': 'Village ID must be an integer'
    })
});
