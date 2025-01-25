<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    const navItems = [
        { label: 'Business Onboard', path: '/admin' },
        { label: 'User Reviews', path: '/admin/reviews' }
    ];

    const handleLogout = () => {
        // Clear authentication tokens or session data
        localStorage.removeItem('authToken');
        goto('/'); // Redirect to login page
    };

    // const handleQRCode = () => {
    //     // Redirect to QR Code page (update the path later as per your need)
    //     window.open('/customer_rating', '_blank'); //this is for cstomer rating
    // };
</script>

<nav>
    <!-- Left Navigation Links -->
    <div class="nav-links">
        {#each navItems as item}
            <a 
                href={item.path} 
                class="nav-link"
                class:active={$page.url.pathname === item.path}
            >
                {item.label}
            </a>
        {/each}
    </div>

    <!-- Right Controls -->
    <div class="right-controls">
        <!-- {#if $page.url.pathname === '/admin/reviews'}
            <button class="qrcode-btn" on:click={handleQRCode}>
                QR Code
            </button>
        {/if} -->
        <button class="logout-btn" on:click={handleLogout}>
            Logout
        </button>
    </div>
</nav>
<style>
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(to right, #2575fc, #6a11cb);
        color: white;
        padding: 15px 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .nav-links {
        display: flex;
        gap: 20px;
    }

    .nav-link {
        color: white;
        text-decoration: none;
        font-weight: 500;
        padding: 8px 15px;
        border-radius: 5px;
        transition: background-color 0.3s ease;
    }

    .nav-link:hover {
        background-color: rgba(255,255,255,0.2);
    }

    .nav-link.active {
        background-color: rgba(255,255,255,0.3);
    }

    .logout-btn{
        background-color: rgba(255,255,255,0.1);
        border: none;
        color: white;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .logout-btn:hover{
        background-color: rgba(255,255,255,0.2);
    }

    .right-controls {
        display: flex;
        gap: 10px;
    }
</style>