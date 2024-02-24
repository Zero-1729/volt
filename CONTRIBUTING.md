# Contributing to Volt

> Guideline doc adapted from the [Bitcoin core repo](https://github.com/bitcoin/bitcoin/CONTRIBUTING.md).

Contributions from anyone are welcome in this repo, as it operates an open contributor model which involves open contributions through peer reviews, testing, and writing patches.

Similar to other Open Source projects, our core model remains meritocratic, where individual contributors earn trust from the community over time. However, for practical reasons, a necessary hierarchy is required to maintain stewardship and quality control in the repo; therefore, we have maintainers responsible for managing release cycles, moderation, and merging Pull Requests.

This document highlights the process for contributing to this repo. We recommend new contributors read through it before opening a Pull Request.

## Getting Started

Code review and testing are integral to the development process to ensure quality code is maintained and bugs are spotted and resolved. It also a more effective way for new contributors to contribute to the repo than opening a Pull Request.

Before contributing, we encourage contributors to go through the repo, read the docs, build, test, and tinker around to familiarize themselves with the codebase.

Issues in the repo are labeled to make sorting through change proposals and highlighting bug conversations convenient. It also makes it easy for first-time contributors to search through more trivial changes, marked `good first issue` or `up for grabs`, to get started helping out in the repo.

### Working On Issues

Contributing is open and doesn't require permission. We aim to avoid having multiple open Pull Requests addressing the same Issue, simplify monitoring the progress on Issues and make it easier for the contributors working on it to seek help. Therefore, it is good practice to comment publicly in the Issue thread to declare your intent to work on an Issue.

## Workflow

The workflow to propose a change is as follows:

> **Note**: You'll only need to [fork the repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) the first time you propose a change. Subsequent changes would be on different branches on your fork.

- Fork repo
- Create a Branch topic (e.g. `coin-select-ts-cleanup`)
- Commit changes to your newly created branch

### Commit Structure and Formatting

The commits should be [atomic](https://en.wikipedia.org/wiki/Atomic_commit#Atomic_commit_convention)—should contain single changes, bug fixes, or feature additions. Commit diffs should be easy to go through. Additionally, all commits should build successfully without any errors or warnings.

The commit message title should be limited to 50 chars max. To detail more info, leave a blank line after the commit title and include the protracted change description as separate paragraphs.

If your commit addresses or references an existing Issue, you can include the Issue ref in the commit (i.e., `refs #123`) and or include the words `fixes` or `closes` to have the Issue closed when the Pull Request is merged (e.g., `fixes #122` or `closes #333`).

Avoid including `@` in commit messages. If another author made your changes, include them as a [co-author](https://github.blog/2018-01-29-commit-together-with-co-authors/).

#### Commit Titles

It is expected to commits pre-fixed with one of the following areas or components they affect:

- `app` - Changes to the main app file(s) (i.e. `./App.tsx`, `./index.js`)
-  `screen` - Changes to a screen (files in `./screens/*`)
- `assets` - Changes to app assets such as fonts (files in `./assets/*`)
- `style` - Changes to app styling (including inline styling in `.tsx` files)
- `docs` - Changes to the repo docs
- `build` - Changes to the native Android or IOS folders (`./ios` and `./andoird`) and config files
- `deps` - Changes to dependencies (e.g., `yarn.lock`, `package-lock.json` or `package.json`)
- `ts` - Changes to Typescript typings
- `nav` - Changes to the App Navigation
- `test` - General and Unit Tests
- `const` - Changes to `constants`, files in `./constants/*`
- `comp` - Changes to `components`, files in `./components/*`
- `mod` - Changes to app `modules`, files in `./modules/*`
- `class` - Changes to app `classes`, files in `./classes/*`
- `misc` & `fix` - Miscellaneous changes and code fixes
- `i18n` - Changes to app translations, files in `./i18n/*` 

For example, if your change affects the ios build folders `./ios`, your commit message can be: `build: rebuilt ios dir files with RN69`.

### Naming Conventions

File names:
- Use `camelCase` for class file names.
- Use `lowercase` for component file names, e.g. `alert.tsx`.
- Use `PascalCase` for screen and constant file names.
- Use `lowercase` or `kebab-case` for module and scripts file names.

Variables, Classes, Interfaces, Enums, and Types:
- Use `camelCase` for variable names and `PascalCase` for class names.
- Use `E[EnumName]` for enum types, where `EnumName` is the enum name in `PascalCase`.
- Use `I[InterfaceName]` for interface types, where `InterfaceName` is the interface name in `PascalCase`.
- Use `T[TypeName]` for type aliases, where `TypeName` is the type name in `PascalCase`.

## Translation

We welcome translations of the repo docs. If you'd like to translate the docs, please open a Pull Request with the translated docs. The PR should be pre-fixed with the language code of the translation (e.g., `ar: translate CONTRIBUTING.md to Arabic`).

### Conventions for Translation Strings

For strings in the common, these are any single words or short phrases that are used in multiple places in the app. These strings should be translated in the `common` namespace. For example, the string `cancel` is used in multiple places in the app, so it should be translated in the `common` namespace. Please, note that these strings should all be in lowercase, and if required to be capitalized, the capitalization should be done post translation.

Nevertheless, strings that are not common should be translated in the relevant namespace. For example, the string `send` is used in the `SendScreen`, so it should be translated in the `wallet` namespace. These strings should begin with a capitalized letter.

As for for strings that are errors and warnings, they should go in the `error` namespace. For example, the string `Invalid mnemonic` should be translated in the `error` namespace. These messages are contained and can be reported by the `Alert` or `Toast` components in `./components/Alert.tsx` and `./components/toast.tsx`, respectively.

> **Note**: remember to add the new language to the `i18n/languages.ts` file, and update the relevant `index.ts` to include the any new namespaces.

- `common` - Common strings
- `error` - Error and warning strings
- `wallet` - Wallet strings
- `onboarding` - Onboarding strings
- `settings` - Settings strings

## Contributing and Review Process

The review process is as follows:

- Open a Pull Request
- Wait for contributors and maintainer(s) to review your Pull Request
- Address any feedback and make changes
- Once the Pull Request is sufficiently reviewed, a maintainer will merge it

### Submitting a Pull Request

Once you've made your changes, you can submit a Pull Request (PR) to the repo. The PR should be pre-fixed with the area or component it affects (e.g., `docs: clarify comment style in CONTRIBUTING.md`). The PR should also include a description of the changes made and any relevant information, including how reviewers can test it out.

The maintainers and the community will review the PR. If there are any issues, the reviewers will comment on the PR and request changes.

If a Pull Request is still a Work In Progress (WIP), pre-fix the PR title with `WIP:`. This will let the maintainers know that the PR is not ready for review yet.

### Reviewing Pull Requests

Contributors and maintainers review Pull Requests by testing, reading through code changes, and suggesting changes to the PR author. These reviews often involve back and forth between the author and reviewer to ensure the code is of high quality and meets the standards of the repo. The language used in reviews should be professional and constructive.

Reviewers signal their approval or objection of a Pull Request (PR) either through an `ACK` or a `NACK`, which stands for "*I agree*" and "*I disagree*", respectively. If a reviewer has a comment but does not block the PR from being merged, they should comment on it with their feedback as a `nit`. All `NACK`s and `nit`s should be accompanied by a reason for the objection or comment.

Contributors in the initial phase of the PR review process issue feedback on a conceptual review level, i.e., whether the changes are necessary, whether the changes are in line with the repo's goals, and whether the changes are in line with the repo's code style. The feedback will include one of two responses:

- `Concept (N)ACK` - (Dis)Agree with the general goal of the PR
- `Approach (N)ACK` - (Dis)Agree with the general approach followed by the PR

A comment containing an `ACK` or `NACK` must include the Branch commit to specify what commit the reviewer is ACKing or NACKing. If the reviewer is ACKing or NACKing the PR as a whole, they should use the PR's commit hash (i.e.,`ACK #13abef7` or `NACK 12adef5`).

Additional reviews are done on a code review and testing level, i.e., whether the code is correct or whether the code introduces bugs or unnecessary complexity. The feedback will include responses generally of the following form:

> Note: `BRANCH_COMMIT` is the top commit of the PR branch.

- `ACK [BRANCH COMMIT]` - Agree with the changes
- `Tested ACK [BRANCH_COMMIT]` or `tACK [BRANCH_COMMIT]` - Tested and agree with the changes
- `Code Review ACK [BRANCH_COMMIT]` or `crACK [BRANCH_COMMIT]` - Code reviewed and agreed with the changes

These review comments should include information about how the reviewer tested the changes and what they tested. If the reviewer is testing the changes on a device, they should include the OS version and, optionally, the device model. If the reviewer tests the changes on an emulator, they should include the emulator model and OS version.

### Merging Pull Requests

The maintainers will merge the Pull Request once undergone sufficient review and all the checks have passed. The maintainers will also merge the Pull Request if there are no objections from the community after a reasonable amount of time.

## Copyright

Please note all contributions to this repository will be licensed under the MIT license highlighted in `./LICENSE`. All other work with a different author must contain its license header with the original author(s) and source.
