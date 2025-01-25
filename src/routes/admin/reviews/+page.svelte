
<script>
   import AdminNavbar from '$lib/components/AdminNavbar.svelte';
   /** @type {import('./$types').PageData} */
   export let data;

   let reviews = data.reviews.map(review => ({
       id: review.id,
       name: review.customer_name || 'Anonymous',
       stars: review.rating,
       reason: review.feedback_text || '-',
       date: new Date(review.created_at).toLocaleDateString(),
       propertyName: review.property_name
   }));
</script>

<style>
   :global(html) {
       font-family: Arial, sans-serif;
       margin: 0;
       padding: 0;
       background: linear-gradient(to right, #f5f7fa, #e6ebf3);
       color: #333;
   }

   .reviews-container {
       max-width: 1150px;
       margin: 0 auto;
       padding: 20px;
   }

   h1 {
       text-align: center;
       color: #5e5e5e;
       margin-bottom: 30px;
   }

   .reviews-table {
       width: 100%;
       border-collapse: collapse;
       background: white;
       border-radius: 10px;
       box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
       overflow: hidden;
   }

   .reviews-table th,
   .reviews-table td {
       padding: 12px;
       border-bottom: 1px solid #ddd;
       text-align: center;
   }

   .reviews-table th {
       background-color: #90CAF9;
       color: #333;
       font-weight: bold;
   }

   .reviews-table tbody tr:nth-child(even) {
       background-color: #f9f9f9;
   }

   .reviews-table tbody tr:hover {
       background-color: #f1f1f1;
   }
</style>

<AdminNavbar />

<div class="reviews-container">
   <h1>User Reviews</h1>
   <table class="reviews-table">
       <thead>
           <tr>
               <th>SL No</th>
               <th>Business Name</th>
               <th>Customer Name</th>
               <th>Stars Given</th>
               <th>Feedback</th>
               <th>Date</th>
           </tr>
       </thead>
       <tbody>
           {#each reviews as review, index}
               <tr>
                   <td>{index + 1}</td>
                   <td>{review.propertyName}</td>
                   <td>{review.name}</td>
                   <td>{review.stars}</td>
                   <td>{review.reason}</td>
                   <td>{review.date}</td>
               </tr>
           {/each}
       </tbody>
   </table>
</div>