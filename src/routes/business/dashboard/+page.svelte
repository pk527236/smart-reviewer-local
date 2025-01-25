<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto';

    /** @type {import('./$types').PageData} */
    export let data;

    let reviews = data.reviews.map(review => ({
        id: review.id,
        name: review.customer_name || 'Anonymous',
        stars: review.rating,
        reason: review.feedback_text || '-',
        date: new Date(review.created_at).toLocaleDateString()
    }));

    let dailyReviewsData = [];
    const last30Days = new Array(30).fill(null).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });

    dailyReviewsData = last30Days.map(date => {
        const found = data.dailyReviews.find(review => review.date === date);
        return {
            date: new Date(date).toLocaleDateString(),
            reviews: found ? found.count : 0
        };
    });

    let businessName = data.businessName;
    let totalReviews = reviews.length;
    let averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, rev) => acc + rev.stars, 0) / reviews.length).toFixed(1)
        : 0;

    let chartCanvas;

    onMount(() => {
        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyReviewsData.map(d => d.date),
                datasets: [{
                    label: 'Daily Reviews',
                    data: dailyReviewsData.map(d => d.reviews),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 7,
                            maxRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    });

    const handleLogout = async () => {
        localStorage.removeItem('businessToken');
        localStorage.removeItem('businessId');
        localStorage.removeItem('businessName');

        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        goto('/business/login');
    };
</script>

<div class="dashboard">
    <header>
        <h1>{businessName}</h1>
        <button class="logout-btn" on:click={handleLogout}>Logout</button>
    </header>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">{totalReviews}</div>
            <div class="stat-label">Total Reviews</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{averageRating}</div>
            <div class="stat-label">Average Rating</div>
        </div>
    </div>

    <div class="chart-card">
        <h2>Review Trends</h2>
        <div class="chart">
            <canvas bind:this={chartCanvas}></canvas>
        </div>
    </div>

    <div class="reviews-card">
        <h2>Recent Reviews</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Rating</th>
                        <th>Feedback</th>
                    </tr>
                </thead>
                <tbody>
                    {#each reviews as review}
                        <tr>
                            <td>{review.date}</td>
                            <td>{review.name}</td>
                            <td class="stars">
                                <span class="filled">{'★'.repeat(review.stars)}</span>
                                <span class="empty">{'☆'.repeat(5 - review.stars)}</span>
                            </td>
                            <td>{review.reason}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
    .dashboard {
        min-height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #fff;
        padding: 2rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    h1 {
        background: linear-gradient(to right, #6366f1, #22d3ee);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-size: 2rem;
        font-weight: bold;
    }

    .logout-btn {
        padding: 0.5rem 1rem;
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background 0.3s;
    }

    .logout-btn:hover {
        background: rgba(239, 68, 68, 0.3);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .stat-card, .chart-card, .reviews-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.5rem;
    }

    .stat-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #6366f1;
    }

    .stat-label {
        color: #9ca3af;
        margin-top: 0.25rem;
    }

    .chart {
        height: 300px;
    }

    .table-container {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        text-align: left;
        padding: 1rem;
        color: #9ca3af;
        font-weight: 500;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    td {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    tr:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .stars .filled {
        color: #fbbf24;
    }

    .stars .empty {
        color: #4b5563;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }
</style>