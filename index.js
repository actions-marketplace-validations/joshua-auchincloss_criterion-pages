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
  const path = (await core.getInput("path")) ?? "./docs";

  let [artifacts, _] = await Promise.all([fs.readdir(ROOT), io.mkdirP(path)]);
  console.log("found artifacts: ", artifacts);
  let moved = [];
  let promises = [];
  for (let art of artifacts) {
    const out = path + "/" + art;
    promises.push(
      io.cp(ROOT + "/" + art, out, {
        recursive: true,
      }),
    );
    moved.push(out);
  }
  await Promise.all(promises);

  let report = path + "/report/index.html";
  let ctnt = await fs.readFile(report).then((buff) => {
    return buff.toString("utf-8").replaceAll(to_replace, replace_with);
  });
  await fs
    .writeFile(report, ctnt)
    .then(async () => {
      await io.cp(report, path + "index.html");
    })
    .then(async () => {
      await io.rmRF(path + "/report");
    });

  core.setOutput("created_dir", path);
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
