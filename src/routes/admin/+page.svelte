<script>
  import AdminNavbar from '$lib/components/AdminNavbar.svelte';
  import UserTable from '$lib/components/AdminTable.svelte';
</script>

<style>
  :global(html) {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(to right, #f5f7fa, #e6ebf3);
      color: #333;
  }

  .dashboard-content {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
  }

  h1 {
      text-align: center;
      font-size: 36px;
      margin: 20px 0;
      color: #5e5e5e;
  }
</style>

<AdminNavbar />

<div class="dashboard-content">
  <h1>Smart-reviewer: Admin</h1>
  <UserTable />
</div>