# Task Guide 

A checklist to run through for every piece of work — before you start coding, and again before you hand it off to your senior. This is about code quality and not breaking things, not about the git/branch process — see `SETUP.md` for how branching, PRs, and review work. 

## Before coding 

1. Check if there's already an existing method or file for the work assigned to you, or something close to it — don't reimplement from scratch. 

2. Check if there are multiple files which have already implemented it — you don't want to add a third, slightly different copy. 

3. Check for dead code or code that will collide with what you're about to add. 

4. Check the existing tests for the area you're touching — read them before changing behavior, so you know what's already guaranteed and don't break it without realizing. 

5. Check whether anyone else's branch or PR is currently touching the same files — ask in the team channel or check open PRs. With this many people working in parallel, a silent collision on the same file is the most likely source of conflicts. 

6. If your work touches stored data (DB models/schema), check whether existing records will need a one-time backfill/migration once your   change lands — don't assume all existing data already matches the new shape. 

7. Make a proper, detailed plan file for all the changes you have to make. If you want to keep it around for your own use, put it in a `docs/` folder at the repo root rather than leaving it loose in the root. 

8. Make sure no file that's supposed to change is left out of that plan.

## After coding 

1. Verification commands to rerun after each fix: 
   - `cd frontend && npx tsc --noEmit -p tsconfig.app.json` 
   - `cd backend && npx jest` 
   - `node --check <file>` for a quick syntax sanity check on any backend file you touched. 

2. If there are multiple files with the same code and they can be compressed into a single one or made into a utility function, do that. 

3. Make sure the same function isn't implemented differently in different places. 

4. Check for dead code, code not being imported or used on the website.

5. If you changed a rule, validation, or behavior that's duplicated in more than one place, update **all** copies and their test fixtures together — a validation change in one file without updating the matching test literals is exactly the kind of bug that only shows up later in CI. 

6. Remove debug `console.log`s and leftover comments before committing.

7. No secrets, tokens, or `.env` values committed — check the diff for anything that looks like a credential before pushing, not just the filenames. 

8. Error messages shown to users don't leak internal details (stack traces, whether an email/account exists, raw DB error text) — keep them generic. 

9. If you deleted or renamed a file, grep for any remaining imports of the old path so nothing is left dangling. 

10. Your changes are correct and **handle all edge cases** — 
    - long strings, 
    - missing information, 
    - optional information not available for some users, 
    - don't break for existing users,  
    - responsiveness across various devices. 

11. Manually exercise the feature in the browser (or via an API call for backend-only work) — passing `tsc`/`jest` proves the code compiles and old tests still pass, not that the new feature actually works. 

12. Check your changes are not failing any test cases. 

13. Check the changes using `git status` before committing, and also check from GitHub online after pushing.

14. Don't mark your work done just because the code looks right — actually run the commands from step 1 (`tsc`, `jest`, `node --check`) yourself after every fix and confirm they pass before moving on or handing off. A "should work" without having run it is not done.
