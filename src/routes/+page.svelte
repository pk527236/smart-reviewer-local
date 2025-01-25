<script>
  let username = '';
  let password = '';

  const handleLogin = async () => {
    if (username === 'admin' && password === 'password') {
      window.location.href = '/admin';
    } else {
      alert('Invalid credentials!');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };
</script>

<div class="container">
  <div class="login-card">
    <h1>Admin Panel</h1>
    <div class="form-group">
      <input
        type="text"
        placeholder="Username"
        bind:value={username}
        on:keypress={handleKeyPress}
      />
      <input
        type="password"
        placeholder="Password"
        bind:value={password}
        on:keypress={handleKeyPress}
      />
      <button on:click={handleLogin}>Login</button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: linear-gradient(to right, #f5f7fa, #e6ebf3);
    font-family: Arial, sans-serif;
  }

  .container {
    width: 100%;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .login-card {
    background: #fff;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 350px;
    margin: 1rem;
  }

  h1 {
    font-size: 2.25rem;
    color: #333;
    font-weight: 600;
    letter-spacing: -1px;
    margin-bottom: 1.5rem;
    text-align: center;
    position: relative;
    padding-bottom: 0.75rem;
  }

  h1::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(to right, #ff9966, #ff5e62);
    border-radius: 2px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1rem;
    box-sizing: border-box;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: border 0.3s, box-shadow 0.3s;
  }

  input:focus {
    border-color: #ff9966;
    box-shadow: 0 0 8px rgba(255, 94, 98, 0.5);
    outline: none;
  }

  button {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(to right, #ff9966, #ff5e62);
    border: none;
    border-radius: 5px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, background 0.3s;
    margin-top: 0.5rem;
  }

  button:hover {
    background: linear-gradient(to right, #ff5e62, #ff9966);
  }

  button:active {
    transform: scale(0.98);
  }
</style>