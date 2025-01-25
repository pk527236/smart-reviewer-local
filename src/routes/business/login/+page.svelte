<!-- src/routes/business/login/+page.svelte -->
<script>
    import { goto } from '$app/navigation';

    let username = '';
    let password = '';
    let error = '';
    let loading = false;

    const handleSubmit = async (e) => {
        e.preventDefault();
        loading = true;
        error = '';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'  // Important for cookie handling
            });

            const data = await res.json();

            if (data.success) {
                // Only store non-sensitive data in localStorage
                localStorage.setItem('businessId', data.businessId);
                localStorage.setItem('businessName', data.propertyName);
                
                await goto('/business/dashboard');
            } else {
                error = data.error || 'Invalid username or password';
            }
        } catch (err) {
            console.error('Error during login:', err);
            error = 'An unexpected error occurred. Please try again.';
        } finally {
            loading = false;
        }
    };
</script>

<div class="login-container">
    <form on:submit={handleSubmit} class="login-form">
        <h2>Business Login</h2>

        {#if error}
            <div class="error">{error}</div>
        {/if}

        <input
            type="text"
            placeholder="Username"
            bind:value={username}
            required
        />

        <input
            type="password"
            placeholder="Password"
            bind:value={password}
            required
        />

        <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
        </button>
    </form>
</div>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(to right, #f5f7fa, #e6ebf3);
    }

    .login-form {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }

    h2 {
        text-align: center;
        margin-bottom: 2rem;
    }

    input {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    button {
        width: 100%;
        padding: 10px;
        background: linear-gradient(to right, #2575fc, #6a11cb);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 1rem;
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .error {
        color: red;
        background: #ffebee;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 1rem;
    }
</style>