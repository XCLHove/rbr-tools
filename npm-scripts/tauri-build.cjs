const child_process = require("child_process");
const { PROJECT_DIR } = require("./commons/vars.cjs");
const fs = require("fs");
const path = require("path");

const TAURI_SIGNING_PRIVATE_KEY =
  process.env.TAURI_SIGNING_PRIVATE_KEY || getTauriSigningPrivateKey();
const TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "rbr-tools";
const currentVersion = getCurrentVersion();

child_process.execSync("npm run tauri build", {
  stdio: "inherit",
  cwd: PROJECT_DIR,
  env: {
    ...process.env,
    TAURI_SIGNING_PRIVATE_KEY,
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD,
  },
});
createRelease(currentVersion);

function getCurrentVersion() {
  const filePath = path.join(PROJECT_DIR, "package.json");
  const obj = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return obj.version;
}

function getTauriSigningPrivateKey() {
  const filePath = path.join(PROJECT_DIR, ".tauri/rbr-tools.key");
  return fs.readFileSync(filePath, "utf8").trim();
}

function getTauriConfig() {
  const tauriConfigPath = path.join(PROJECT_DIR, "src-tauri/tauri.conf.json");
  return JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));
}

function createRelease(version) {
  const tauriConfig = getTauriConfig();
  const exeFileName = `${tauriConfig.productName}_${version}_x64-setup.exe`;
  const from = `${PROJECT_DIR}/src-tauri/target/release/bundle/nsis/${exeFileName}`;
  const toDir = `${PROJECT_DIR}/release/${version}`;
  if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });
  const to = `${toDir}/${exeFileName}`;
  fs.cpSync(from, to);

  const signature = fs.readFileSync(`${from}.sig`, "utf8");
  const pub_date = getNewRFC3339DateStr();
  const releaseInfoList = [
    {
      name: "github",
      info: {
        version: version,
        notes: ``,
        pub_date: pub_date,
        platforms: {
          "windows-x86_64": {
            signature: signature,
            url: `https://github.com/xclhove/rbr-tools/releases/latest/download/${exeFileName}`,
          },
        },
      },
    },
    {
      name: "gitee",
      info: {
        version: version,
        notes: ``,
        pub_date: pub_date,
        platforms: {
          "windows-x86_64": {
            signature: signature,
            url: `https://gitee.com/xclhove/rbr-tools/releases/download/latest/${exeFileName}`,
          },
        },
      },
    },
  ];
  releaseInfoList.forEach((item) => {
    const filePath = `${toDir}/latest-${item.name}.json`;
    fs.writeFileSync(filePath, JSON.stringify(item.info, null, 2));
  });
}

function getNewRFC3339DateStr() {
  const now = new Date();
  const year = now.getUTCFullYear().toString().padStart(4, "0");
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = now.getUTCDate().toString().padStart(2, "0");
  const hour = now.getUTCHours().toString().padStart(2, "0");
  const minute = now.getUTCMinutes().toString().padStart(2, "0");
  const second = now.getUTCSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}
