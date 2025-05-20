import { type SafeUserInfo, type UserAuth, type UserUpdateRequest } from '@strategy-town/shared';
import { type UserWithId } from '../types.ts';
import { type Types } from 'mongoose';
import { populateArgsForSafeUserInfo, UserModel } from '../models/user.model.ts';

const disallowedUsernames = new Set(['login', 'signup', 'list']);

/**
 * Retrieves a single user from the database.
 *
 * @param _id - Valid user id.
 * @returns the found user object (without the password).
 */
export async function populateSafeUserInfo(_id: Types.ObjectId): Promise<SafeUserInfo> {
  const user = await UserModel.findById(_id).select(populateArgsForSafeUserInfo.select);

  // The type assertion is justified by the precondition that this is a valid id
  return user!.toObject();
}

/**
 * Takes a username and password, and either returns the corresponding user object
 * (without the password) or null if the username/password combination does not
 * match stored values.
 *
 * @param auth - A user's authentication information (username and password)
 * @returns the corresponding user object (without the password) or null.
 */
export async function checkAuth({ username, password }: UserAuth): Promise<UserWithId | null> {
  const user = await UserModel.findOne({ username });
  if (!user) return null;
  if (password !== user.password) return null;
  return { _id: user._id, username: user.username };
}

/**
 * Takes a username and password, and returns the corresponding user
 * (without the password) or an error if the username/password combination
 * doesn't match stored values.
 *
 * @param auth - A user's authentication information (username and password)
 * @returns the corresponding user object (without the password)
 * @throws if the auth information is incorrect
 */
export async function enforceAuth(auth: UserAuth): Promise<UserWithId> {
  const user = await checkAuth(auth);
  if (!user) throw new Error('Invalid auth');
  return user;
}

/**
 * Create and store a new user
 *
 * @param newUser - The user object to be saved, containing user details like username, password, etc.
 * @returns Resolves with the saved user object (without the password) or an error message.
 */
export async function createUser(username: string, password: string, createdAt: Date) {
  if (disallowedUsernames.has(username)) {
    return { error: 'That is not a permitted username' };
  }
  try {
    const user = await UserModel.insertOne({ username, display: username, password, createdAt });
    return populateSafeUserInfo(user._id);
  } catch (e) {
    // Error code 11000 signals a duplicate key
    // https://www.mongodb.com/docs/manual/reference/error-codes/
    if (e instanceof Error && 'code' in e && e.code === 11000) {
      return { error: 'User already exists' };
    }
    // Unexpected mongo error, re-throw it
    throw e;
  }
}

/**
 * Retrieves a single user from the database.
 *
 * @param username - The username of the user to find
 * @returns the found user object (without the password) or null
 */
export async function getUserByUsername(username: string): Promise<SafeUserInfo | null> {
  const user = await UserModel.findOne({ username });
  if (!user) return null;
  return populateSafeUserInfo(user._id);
}

/**
 * Retrieves a list of usernames from the database
 *
 * @param usernames - A list of usernames
 * @returns the SafeUserInfo objects corresponding to those users
 * @throws if any of the usernames are not valid
 */
export function getUsersByUsername(usernames: string[]): Promise<SafeUserInfo[]> {
  return Promise.all(
    usernames.map(async username => {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('No such username');
      return user;
    }),
  );
}

/**
 * Updates user information in the database
 *
 * @param username - A valid username for the user to update
 * @param updates - An object that defines the fields to be updated and their new values
 * @returns the updated user object (without the password)
 * @throws if the username does not exist in the database
 */
export async function updateUser(username: string, { display, password }: UserUpdateRequest) {
  const updates: UserUpdateRequest = {};
  if (display !== undefined) updates.display = display;
  if (password !== undefined) updates.password = password;

  const user = await UserModel.findOneAndUpdate({ username }, updates);
  if (!user) throw new Error('Username does not exist');
  return populateSafeUserInfo(user._id);
}
