<script>
    import { enhance } from '$app/forms';
    let { data } = $props();
</script>

<div class="container d-flex justify-content-center align-items-center" style="min-height: 70vh;">
    <div class="card shadow-sm text-center" style="max-width: 400px; width: 100%;">
        <div class="card-body p-4">
            <i class="bi bi-box-arrow-right fs-1 text-dark mb-3"></i>
            <h4>Goodbye, {data.user?.name}!</h4>
            <p class="text-muted">Are you sure you want to log out?</p>

            <form method="POST" use:enhance>
                <button type="submit" class="btn btn-dark w-100">
                    <i class="bi bi-box-arrow-right me-1"></i> Yes, Log Out
                </button>
            </form>

            <a href="/" class="btn btn-outline-secondary w-100 mt-2">Cancel</a>
        </div>
    </div>
</div>