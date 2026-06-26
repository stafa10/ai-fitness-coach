<script>
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-md-6 col-lg-5">

			<div class="card bg-dark text-white shadow-lg border-0">
				<div class="card-body p-5">

					<!-- Logo / Heading -->
					<div class="text-center mb-4">
						<div
							class="rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-3"
							style="width:70px;height:70px;"
						>
							<span style="font-size:2rem;">💪</span>
						</div>

						<h1 class="h3 fw-bold">
							AI Fitness Coach
						</h1>

						<p class="text-secondary">
							Welcome back. Let's crush today's workout.
						</p>
					</div>

					<h2 class="h5 mb-4 text-center">
						Sign In
					</h2>

					<form method="post" action="?/signInEmail" use:enhance>

						<div class="mb-3">
							<label for="email" class="form-label">
								Email
							</label>

							<input
								id="email"
								type="email"
								name="email"
								class="form-control bg-secondary border-0 text-white"
								placeholder="you@example.com"
								required
							/>
						</div>

						<div class="mb-4">
							<label for="password" class="form-label">
								Password
							</label>

							<input
								id="password"
								type="password"
								name="password"
								class="form-control bg-secondary border-0 text-white"
								placeholder="••••••••"
								required
							/>
						</div>

						{#if form?.message}
							<div class="alert alert-danger">
								{form.message}
							</div>
						{/if}

						<button
							type="submit"
							class="btn btn-success w-100 fw-semibold"
						>
							Sign In
						</button>

					</form>

					<hr class="my-4 border-secondary" />

					<p class="text-center text-secondary mb-0">
						Don't have an account?
						<a
							href="/auth/register"
							class="text-success text-decoration-none fw-semibold"
						>
							Register here
						</a>
					</p>

				</div>
			</div>

		</div>
	</div>
</div>