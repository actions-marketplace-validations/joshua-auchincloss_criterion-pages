# `criterion.rs` + gh pages

Github action for `criterion.rs` to upload to github pages using [`actions/deploy-pages@v2`]. Compatible with CI cached performance benchmarks (see [example] & [outputs]). Note: performance is **not** guaranteed in hosted CI runners. This action exists simply to make performance monitoring easier. Also see [criterion-compare-action].

## Inputs

| Input | Description                                                                          | Required | Default   | E.g.                   |
| ----- | ------------------------------------------------------------------------------------ | -------- | --------- | ---------------------- |
| root  | Root directory the benchmarks are run from (. or ./.. path to package)               | No       | `./`      | `./crates/my-benchlib` |
| path  | The same path given to [`actions/upload-pages-artifact`] to be used as the build dir | No       | `./bench` | `./abc`                |

## Usage

E.g. [`.github/workflows/docs.yaml`](https://github.com/joshua-auchincloss/hashsets-perf/blob/main/.github/workflows/docs.yaml) ([outputs])

```yaml
name: docs

on:
    push:
        branches:
            - 'main'
    pull_request:
    workflow_dispatch:

permissions:
    contents: read
    pages: write
    id-token: write

env:
    ACTIONS_STEP_DEBUG: true

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
              uses: actions/checkout@v3

            - name: Setup rust toolchain, cache
              uses: moonrepo/setup-rust@v0
              with:
                  channel: stable
                  cache-target: release

            - id: cache-target
              name: Cache CI Benchmarks
              uses: actions/cache@v3
              with:
                  key: ${{ runner.os }}-${{ github.ref }}
                  path: |
                      ./target/criterion

            - name: Run benchmarks
              run: cargo bench

            - name: Setup Pages
              id: pages
              uses: actions/configure-pages@v3

            - name: Process html
              uses: joshua-auchincloss/criterion-pages@v1
              with:
                  path: './bench'

            - name: Setup Pages
              uses: actions/configure-pages@v3

            - name: Upload artifact
              uses: actions/upload-pages-artifact@v2
              with:
                  path: './bench'

    deploy:
        environment:
            name: github-pages
            url: ${{ steps.deployment.outputs.page_url }}
        runs-on: ubuntu-latest
        needs: build
        steps:
            - name: Deploy to GitHub Pages
              id: deployment
              uses: actions/deploy-pages@v2
```

[`actions/deploy-pages@v2`]: https://github.com/actions/deploy-pages/tree/v2/
[example]: https://github.com/joshua-auchincloss/hashsets-perf
[outputs]: https://joshua-auchincloss.github.io/hashsets-perf
[criterion-compare-action]: https://github.com/boa-dev/criterion-compare-action
[`actions/upload-pages-artifact`]: https://github.com/actions/upload-pages-artifact/
