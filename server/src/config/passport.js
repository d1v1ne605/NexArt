import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import config from './config.js';
import User from '../models/User.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserialized User:', user);
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
    // Check if user already exists
    let existingUser = await User.findByGoogleId(profile.id);

    if (existingUser) {
      // User exists, update their information
      existingUser = await User.updateUser(existingUser.id, {
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        accessToken,
        refreshToken,
        lastLogin: new Date()
      });
      return done(null, existingUser);
    }

    // Create new user
    const newUser = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      accessToken,
      refreshToken,
      provider: 'google',
      createdAt: new Date(),
      lastLogin: new Date()
    });

    done(null, newUser);
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    done(error, null);
  }
}));

export default passport;