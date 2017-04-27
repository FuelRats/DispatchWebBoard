# Reporting Issues

Always check the JIRA board before beginning work, as your planned feature or bug fix might already have an issue!
Please refrain from using GitHub to report Issues, as our issue tracking is handled on the FuelRats JIRA. Feel free to report any Issues [there.](https://jira.fuelrats.com/projects/DWB/issues)


# Contributing

* You are free to commit to the develop branch directly if you are a Tech Rat Team member.

1. Fork the main repo on github
2. Create a feature branch off of the develop branch
3. Develop your feature/fix/whatever
4. Rebase onto upstream develop
5. Submit a PR

## Feature branches

Make a feature branch off of master using `git checkout -b feature/my-awesome-feature`. Instead of 'feature' you can also put 'fix' in front of the branch name if it's a bugfix or 'doc' if you only add documentation.

## Hygiene

After branching, you should immediately use `git push -u origin feature/my-awesome-feature` to make that the default upstream ref.

Before opening a PR, rebase onto develop so your PR can be merged fast-forward only, without merge commits. The easiest way to do that is to make the main repo a remote using `git remote add upstream git@github.com:fuelrats/pipsqueak` and then running `git pull --rebase upstream develop`. Your PR should have sensible commits with sensible commit messages. It is *not* required or appreciated to squash PRs into a single commit. Every commit by itself should leave the codebase in a working state.

## Documentation

Use comments and docstrings, even though not all of the project is documented too well :smile:
