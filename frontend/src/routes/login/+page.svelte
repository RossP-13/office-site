<script>
    let loading = false;
    export let form;
</script>

<div>
<div class="min-h-screen flex flex-col items-center justify-center">
		<div class="logo-section">
			<img src="/images/glt_logo.png" alt="Genesee Land Trust" class="logo" />
			<h1>Bird Box Monitoring</h1>
		</div>
    <form class="mx-auto w-full max-w-md space-y-4" method="POST">
        <label class="label">
            <span class="label-text text-gray-700">Username</span>
            <input class="input text-gray-700" type="text" placeholder="Username" name="username" required />
        </label>
        <label class="label">
            <span class="label-text text-gray-700">Password</span>
            <input class="input text-gray-700" type="password" placeholder="Password" name="password" required />
        </label>
        {#if form?.error}
            <div class="text-red-500 text-center font-semibold">{form.error}</div>
        {/if}
        <div class="flex justify-center">
            <button class="bg-[var(--color-logo-green-100)] hover:bg-[var(--color-logo-green-200)] text-white font-semibold px-4 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all flex gap-2 items-center" type="submit" disabled={loading}>
            {#if loading}
            <span class="loader"></span>
            Logging in...
            {:else}
            Login
            {/if}
            </button>
        </div>
    </form>
    </div>
</div>

<style>

.loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: inline-block;
    margin-right: 8px;
    animation: spin 1s linear infinite;
    vertical-align: middle;
}
@keyframes spin {
    0% { transform: rotate(0deg);}
    100% { transform: rotate(360deg);}
}
</style>