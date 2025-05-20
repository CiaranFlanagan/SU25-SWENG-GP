import { type InferSchemaType, model, Schema } from 'mongoose';
import { type PopulateArgs } from '../types.ts';

export type UserRecord = InferSchemaType<typeof userSchema>;
const userSchema = new Schema({
  username: { type: String, required: true, unique: true, immutable: true },
  password: { type: String, required: true },
  display: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

/**
 * Represents a user document in the database.
 * - `username`: user's password
 * - `password`: user's password
 * - `display`: A display name
 * - `createdAt`: when this user registered.
 */
export const UserModel = model<UserRecord>('User', userSchema);

/**
 * MongoDB options that will cause a populated User path to match the
 * SafeUserInfo interface, without any extras.
 */
export const populateArgsForSafeUserInfo: PopulateArgs = {
  select: '-__v -_id -password',
  populate: [],
};
