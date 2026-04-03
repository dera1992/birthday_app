# ── Celnoia monorepo helpers ──────────────────────────────────────────────────

# Push all three sub-repos (backend / frontend / mobile)
push:
	git subtree push --prefix=backend  backend  main
	git subtree push --prefix=frontend frontend main
	git subtree push --prefix=mobile   mobile   main

# Push only the monorepo origin (birthday_app.git)
push-origin:
	git push origin main

# Push everything — monorepo + all three split repos
push-all:
	git push origin main
	git subtree push --prefix=backend  backend  main
	git subtree push --prefix=frontend frontend main
	git subtree push --prefix=mobile   mobile   main

.PHONY: push push-origin push-all
