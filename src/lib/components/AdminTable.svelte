<script>
  import { onMount } from 'svelte';
  import { users } from '$lib/stores/users';
  import AdminModal from './AdminModal.svelte';
  import QRCode from 'qrcode';

  let showModal = false;
  let modalType = 'add';
  let formData = {};
  let loading = false;

  onMount(async () => {
    loading = true;
    await users.fetchUsers();
    loading = false;
  });

  const handleAddNewUser = () => {
    formData = {
      ownerName: '',
      propertyName: '',
      propertyAddress: '',
      googleMapLink: '',
      contactNumber: '',
      customFeedbackMessage: ''
    };
    modalType = 'add';
    showModal = true;
  };

  const handleEdit = (user) => {
    formData = { ...user };
    modalType = 'edit';
    showModal = true;
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      loading = true;
      await users.deleteUser(id);
      loading = false;
    }
  };

  const generateQRCode = async (uniqueId) => {
  try {
    // Use window.location.origin to get the base URL
    const ratingUrl = `${window.location.origin}/customer_rating/${uniqueId}`;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(ratingUrl);
    
    // Create a temporary anchor element to download the QR code
    const link = document.createElement('a');
    link.download = `qr-code-${uniqueId}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error generating QR code:', err);
    alert('Failed to generate QR code');
  }
};
</script>

<div class="container">
  <button on:click={handleAddNewUser}>Add New User</button>
  
  {#if loading}
    <p>Loading...</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Sl. No</th>
          <th>Active Business</th>
          <th>Unique Code</th>
          <th>No of Reviews</th>
          <th>Message</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $users as user, index}
          <tr>
            <td>{index + 1}</td>
            <td>{user.propertyName}</td>
            <td>{user.uniqueId}</td>
            <td>{user.reviewCount || 0}</td>
            <td>{user.customFeedbackMessage}</td>
            <td>
              <button on:click={() => handleEdit(user)}>Edit</button>
              <button on:click={() => generateQRCode(user.uniqueId)}>QR Code</button>
              <button on:click={() => handleDelete(user.id)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <AdminModal 
    bind:showModal 
    bind:modalType 
    bind:formData 
  />
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  button {
    padding: 10px 15px;
    margin: 5px;
    background: #6a11cb;
    background: linear-gradient(to right, #2575fc, #6a11cb);
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
  }

  button:hover {
    background: linear-gradient(to right, #6a11cb, #2575fc);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  table th,
  table td {
    padding: 10px;
    text-align: left;
    border: 1px solid #ddd;
  }

  table th {
    background: #f4f4f4;
    color: #333;
    font-weight: bold;
  }

  table tr:nth-child(even) {
    background: #f9f9f9;
  }

  table tr:hover {
    background: #f1f1f1;
  }

  table td button {
    padding: 5px 10px;
    font-size: 12px;
  }
    /* Add style for the QR code button */
    button {
    padding: 10px 15px;
    margin: 5px;
    background: #6a11cb;
    background: linear-gradient(to right, #2575fc, #6a11cb);
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
  }
</style>