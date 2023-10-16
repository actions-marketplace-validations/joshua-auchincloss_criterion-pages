const core = require('@actions/core')
const github = require('@actions/github')
const io = require('@actions/io')
const art = require('@actions/artifact')
const glob = require('@actions/glob')
const fs = require('fs/promises')
const pathlib = require('path')

const ROOT = './target/criterion'
const IDX = `{ROOT}/report/index.html`

const to_replace = '<a href="../'
const replace_with = '<a href="./'

async function main() {
    const root = pathlib.join(await core.getInput('root'), ROOT)
    const path = await core.getInput('path')

    let [artifacts, _] = await Promise.all([fs.readdir(root), io.mkdirP(path)])

    console.log('found artifacts: ', artifacts)

    let moved = []
    let promises = []
    for (let art of artifacts) {
        const src = pathlib.join(root, art)
        const tgt = pathlib.join(path, art)
        promises.push(
            io.cp(src, tgt, {
                recursive: true,
            })
        )
        moved.push(tgt)
    }

    await Promise.all(promises)

    let report = path + '/report/index.html'
    let ctnt = await fs.readFile(report).then((buff) => {
        return buff.toString('utf-8').replaceAll(to_replace, replace_with)
    })

    await fs.writeFile(report, ctnt)
    await io.cp(report, path + '/index.html')
    await io.rmRF(path + '/report')

    console.log('created artifacts: ', await (await glob.create(path)).glob())

    await fs.chmod(path, 0o755)

    core.setOutput('created_dir', path)
}

;(async () => {
    await main()
        .catch((error) => {
            core.setFailed(error.message)
        })
        .finally(() => {
            console.log('complete')
        })
})()
