// backend/validators.js
const Joi = require('joi');
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

exports.signupSchema = Joi.object({
  name:     Joi.string().trim().min(1).required(),
  email:    Joi.string().email().required(),
  password: Joi.string()
               .pattern(passwordPattern)
               .message('Password must be ≥8 chars, with upper, lower, number & special')
               .required(),
});

exports.loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

exports.forgotSchema = Joi.object({
  email: Joi.string().email().required(),
});

exports.resetSchema = Joi.object({
  token:    Joi.string().hex().length(64).required(),
  password: Joi.string()
               .pattern(passwordPattern)
               .message('Password must be ≥8 chars, with upper, lower, number & special')
               .required(),
});

exports.updateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
});
