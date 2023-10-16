const core = require("@actions/core");
const github = require("@actions/github");
const io = require("@actions/io");
const art = require("@actions/artifact");
const glob = require("@actions/glob");
const fs = require("fs/promises");

const ROOT = "./target/criterion";
const IDX = `{ROOT}/report/index.html`;

const to_replace = '<a href="../';
const replace_with = '<a href="./';

async function main() {
  const target_directory =
    (await core.getInput("target_directory")) ?? "./docs";

  let [artifacts, _] = await Promise.all([
    fs.readdir(ROOT),
    io.mkdirP(target_directory),
  ]);
  console.log("found artifacts: ", artifacts);
  let moved = [];
  let promises = [];
  for (let art of artifacts) {
    const out = target_directory + "/" + art;
    promises.push(
      io.cp(ROOT + "/" + art, out, {
        recursive: true,
      }),
    );
    moved.push(out);
  }
  await Promise.all(promises);

  let report = target_directory + "/report/index.html";
  let ctnt = await fs.readFile(report).then((buff) => {
    return buff.toString("utf-8").replaceAll(to_replace, replace_with);
  });
  await fs
    .writeFile(report, ctnt)
    .then(async () => {
      await io.cp(report, target_directory + "index.html");
    })
    .then(async () => {
      await io.rmRF(target_directory + "/report");
    });
    await art.create().uploadArtifact("docs", await glob.create(target_directory, {
        matchDirectories: false,
    }));

    core.setOutput("created_dir", target_directory)
}

(async () => {
  await main()
    .catch((error) => {
      core.setFailed(error.message);
    })
    .finally(() => {
      console.log("complete");
    });
})();
