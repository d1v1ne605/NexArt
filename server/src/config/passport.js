import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import config from './config.common.js';
import UserModel from '../models/user.model.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let existingUser = await UserModel.findByProviderId('google', profile.id);

    if (existingUser) {
      existingUser = await UserModel.updateUser(existingUser.id, {
        username: profile.displayName,
        email: profile.emails[0].value,
        avatar_url: profile.photos[0].value,
        last_login: new Date()
      });
      return done(null, existingUser);
    }

    const newUser = await UserModel.createUser({
      provider_id: profile.id,
      username: profile.displayName,
      email: profile.emails[0].value,
      avatar_url: profile.photos[0].value,
      provider: 'google',
      createdAt: new Date(),
      last_login: new Date()
    });

    done(null, newUser);
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    done(error, null);
  }
}));

export default passport;