<script>
  import { users } from '$lib/stores/users';
  import bcrypt from 'bcryptjs';

  export let showModal = false;
  export let modalType = 'add';
  export let formData = {
    id: null,
    ownerName: '',
    propertyName: '',
    propertyAddress: '',
    googleMapLink: '',
    contactNumber: '',
    customFeedbackMessage: '',
    username: '',
    password: ''
  };

  let loading = false;
  let error = '';

  const handleSave = async () => {
    loading = true;
    error = '';

    try {
      let success;
      let dataToSend = { ...formData };

      if (modalType === 'add') {
        // For new users, hash the password
        const hashedPassword = await bcrypt.hash(formData.password, 10);
        dataToSend.password = hashedPassword;
      } else if (modalType === 'edit' && formData.id) {
        // For editing, only include password if it was changed
        if (formData.password) {
          dataToSend.password = await bcrypt.hash(formData.password, 10);
        } else {
          // Remove password if not changed
          delete dataToSend.password;
        }

        // Only include username if it was changed
        if (!formData.username) {
          delete dataToSend.username;
        }
      }

      if (modalType === 'add') {
        success = await users.addUser(dataToSend);
      } else if (modalType === 'edit' && formData.id) {
        success = await users.editUser(formData.id, dataToSend);
      }

      if (success) {
        showModal = false;
      } else {
        error = 'Failed to save user data. Please try again.';
      }
    } catch (e) {
      error = `Error: ${e.message}`;
    } finally {
      loading = false;
    }
  };

  const handleCancel = () => {
    showModal = false;
  };
</script>

{#if showModal}
<div class="modal">
  <div class="modal-content">
    <h3>{modalType === 'add' ? 'Add New Business' : 'Edit Details'}</h3>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleSave}>
      <label for="ownerName">Enter the Owner Name</label>
      <input
        id="ownerName"
        type="text"
        placeholder="Owner Name"
        bind:value={formData.ownerName}
        required
      />

      <label for="propertyName">Enter the Property Name</label>
      <input
        id="propertyName"
        type="text"
        placeholder="Property Name"
        bind:value={formData.propertyName}
        required
      />

      <label for="propertyAddress">Enter the Property Address</label>
      <textarea
        id="propertyAddress"
        placeholder="Property Address"
        bind:value={formData.propertyAddress}
        required
      ></textarea>

      <label for="googleMapLink">Enter the Google Map Link</label>
      <input
        id="googleMapLink"
        type="url"
        placeholder="Google Map Link"
        bind:value={formData.googleMapLink}
      />

      <label for="contactNumber">Enter the Contact Number</label>
      <input
        id="contactNumber"
        type="tel"
        placeholder="Contact Number"
        bind:value={formData.contactNumber}
        required
      />

      <label for="customFeedbackMessage">Enter the Custom Feedback Message</label>
      <textarea
        id="customFeedbackMessage"
        placeholder="Custom Feedback Message"
        bind:value={formData.customFeedbackMessage}
      ></textarea>

      <label for="username">
        {modalType === 'add' ? 'Enter the Username' : 'Enter the Username (Optional for edit)'}
      </label>
      <input
        id="username"
        type="text"
        placeholder="Username"
        bind:value={formData.username}
        required={modalType === 'add'}
      />

      <label for="password">
        {modalType === 'add' ? 'Enter the Password' : 'Enter the Password (Optional for edit)'}
      </label>
      <input
        id="password"
        type="password"
        placeholder={modalType === 'add' ? 'Password' : 'Leave blank to keep current password'}
        bind:value={formData.password}
        required={modalType === 'add'}
      />

      <div class="button-group">
        <button class="save" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button class="cancel" type="button" on:click={handleCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 10px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .modal-content input,
  .modal-content textarea {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 14px;
  }

  label {
    display: block;
    margin-top: 15px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .error {
    color: #f44336;
    background: #ffecec;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #f5c6cb;
    border-radius: 5px;
    font-size: 14px;
  }

  .button-group {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }

  .button-group button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }

  .button-group .save {
    background: #4caf50;
    color: white;
  }

  .button-group .cancel {
    background: #f44336;
    color: white;
  }

  .button-group button[disabled] {
    background: #ccc;
    cursor: not-allowed;
  }
</style>