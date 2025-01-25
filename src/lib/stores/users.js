import { writable } from 'svelte/store';

function createUsersStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    
    fetchUsers: async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        set(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        set([]);
      }
    },

    addUser: async (user) => {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        if (!res.ok) throw new Error('Failed to add user');
        const result = await res.json();
        
        if (result.success) {
          update(users => [...users, { id: result.id, ...user }]);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error adding user:', error);
        return false;
      }
    },

    editUser: async (id, updatedUser) => {
      try {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updatedUser })
        });

        if (!res.ok) throw new Error('Failed to update user');
        const result = await res.json();
        
        if (result.success) {
          update(users =>
            users.map(user =>
              user.id === id ? { ...user, ...updatedUser } : user
            )
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error updating user:', error);
        return false;
      }
    },

    deleteUser: async (id) => {
      try {
        const res = await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });

        if (!res.ok) throw new Error('Failed to delete user');
        const result = await res.json();
        
        if (result.success) {
          update(users => users.filter(user => user.id !== id));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error deleting user:', error);
        return false;
      }
    }
  };
}

export const users = createUsersStore();