# Security review — October 23, 2026

Scope: this repository only. Other applications and live Render services were not inspected.

## Render advisories

This is a static GitHub Pages site with no application build step. No PHP application, Dockerfile, Render blueprint, or production Node server was found outside vendored dependencies. Browser HTTPS requests use the visitor's browser trust store; repository changes cannot patch that store.

The local Node executable reports v20.20.2, below Render's patched versions. `.node-version` now requests 22.23.4 for tools that honor this file. This does not install Node, change an existing shell, or prove any deployed runtime has been upgraded. Check `node --version` after switching runtimes, including when working inside nested projects.

For any separate Render service using this repository, verify its actual settings and logs. `NODE_VERSION` overrides `.node-version`, and a configured subdirectory may need its own version setting. Rebuild and verify the deployed version. Docker services need refreshed certificate stores and runtime images. Python clients using certifi need certifi >=2026.10.19. Inventory workers and cron jobs as well as web services.

Sources:
- https://render.com/docs/advisory-emudhra
- https://render.com/docs/advisory-php2shell
- https://render.com/docs/node-version

## Additional findings

- The root lockfile audit reports 64 vulnerable packages: 4 critical, 41 high, 12 moderate, and 7 low. Critical package findings include form-data, proxy-addr, request, and tar. Many findings run through Cordova tooling. These packages are not evidence of a running server on GitHub Pages. Resolve or remove unused tooling before running it; several suggested fixes require major upgrades, including Cordova and Tailwind. Dependencies were not updated in this review.
- The Svelte experiment's lockfile audit reports 9 vulnerable packages: 7 high and 2 moderate. These are package findings, not proof of an exploitable production service. Findings include Rollup, Svelte, serialize-javascript, ws, and glob-processing dependencies. Some fixes require major upgrades; the experiment needs a separate upgrade and build check before reuse.
- A Google Maps API key is committed in `projects/lilMap/journeyApp/package.json` and `projects/lilMap/journeyApp/www/index.html`. Client Maps keys are visible by design; verify API restrictions, application restrictions, quotas, and usage in Google Cloud. Restrictions and misuse were not checked. Removing the string alone would not revoke it or remove Git history.
- JourneyApp's online dependency audit was blocked by automatic approval review because it exports dependency metadata to npm. No complete all-project dependency clearance is claimed.
- This review does not establish that other Render applications are patched or that no compromise has occurred.

## Cleanup — October 23, 2026

Removed the unused root npm manifests and stopped tracking the vendored `node_modules` tree. Removed the Svelte dashboard and Cordova JourneyApp experiments and the map listing that linked to JourneyApp. These removals eliminate the audited dependency trees from the published repository rather than upgrading unused applications. Other experimental pages remain because existing site pages still link to them.

Removed Experiments from the homepage More menu. Public portfolio content and assets remain in place. The local ignored npm cache is retained, including the pre-existing modified `.DS_Store`; it is no longer published or required by this site. The committed Maps key remains in Git history and still needs restrictions or revocation in Google Cloud. Live Render services and the installed local Node runtime remain outside this cleanup.
