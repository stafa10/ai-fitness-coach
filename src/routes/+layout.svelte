<script>
<<<<<<< HEAD
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
=======
    import 'bootstrap/dist/css/bootstrap.min.css';
    import 'bootstrap-icons/font/bootstrap-icons.css';
    let { data, children } = $props();
</script>

<svelte:head>
    <title>AI Fitness Coach</title>
</svelte:head>

<header>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow">
        <div class="container">

            <!-- Logo -->
            <a class="navbar-brand fw-bold" href="/">
                💪 AI Fitness Coach
            </a>

            <!-- Mobile Toggle -->
            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarNav">

                <!-- Left side links -->
                <div class="navbar-nav">
                    <a class="nav-link" href="/">Home</a>
                </div>

                <!-- Right side login -->
                <div class="ms-auto d-flex align-items-center gap-2">

                    {#if data.user}

                        <a href="/dashboard" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-person-circle me-1"></i>
                            Account
                        </a>

                        <a href="/auth/logout" class="btn btn-danger btn-sm">
                            <i class="bi bi-box-arrow-right me-1"></i>
                            Logout
                        </a>

                    {:else}

                        <a href="/auth/login" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-box-arrow-in-right me-1"></i>
                            Login
                        </a>

                        <a href="/auth/register" class="btn btn-success btn-sm">
                            Get Started
                        </a>

                    {/if}

                </div>

            </div>

        </div>
    </nav>
</header>

<slot />
>>>>>>> 68463f0 (Initial commit)
