// @ts-check
import { isValidObjectId } from 'mongoose';

/**
 * Checks if the req.params.id is a valid Mongoose ObjectId.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {Error} Throws an error if the ObjectId is invalid.
 */

function checkObjectId(req, res, next) {
  if (!isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error(`Invalid ObjectId format: ${req.params.id}. MongoDB ObjectIds must be 24-character hexadecimal strings.`);
  }
  next();
}

export default checkObjectId;
