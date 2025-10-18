class User {
  constructor() {
    this.users = new Map();
    this.idCounter = 1;
  }

  // Find user by Google ID
  async findByGoogleId(googleId) {
    for (const [id, user] of this.users) {
      if (user.googleId === googleId) {
        return { id, ...user };
      }
    }
    return null;
  }

  // Find user by ID
  async findById(id) {
    const user = this.users.get(parseInt(id));
    return user ? { id, ...user } : null;
  }

  // Find user by email
  async findByEmail(email) {
    for (const [id, user] of this.users) {
      if (user.email === email) {
        return { id, ...user };
      }
    }
    return null;
  }

  // Create new user
  async create(userData) {
    const id = this.idCounter++;
    const user = {
      ...userData,
      id,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  // Update user
  async updateUser(id, updateData) {
    const existingUser = this.users.get(parseInt(id));
    if (!existingUser) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...existingUser,
      ...updateData,
      updatedAt: new Date()
    };

    this.users.set(parseInt(id), updatedUser);
    return { id: parseInt(id), ...updatedUser };
  }

  // Delete user
  async deleteUser(id) {
    return this.users.delete(parseInt(id));
  }

  // Get all users (for admin purposes)
  async getAllUsers() {
    const allUsers = [];
    for (const [id, user] of this.users) {
      allUsers.push({ id, ...user });
    }
    return allUsers;
  }

  // Get user stats
  async getUserStats() {
    return {
      totalUsers: this.users.size,
      googleUsers: Array.from(this.users.values()).filter(user => user.provider === 'google').length
    };
  }
}

export default new User();