const fetch = require("node-fetch");
const { Conflux } = require("js-conflux-sdk");
const path = require("path");
const { readFileSync } = require("fs");
const abi = require("./abis/BalanceChecker.abi.json");
const { bytecode } = require("./bytecodes/BalanceChecker.bytecode.json");

const NETWORK = "TEST";
// const NETWORK = "MAIN"
const RPC_URL = {
  MAIN: "http://wallet-mainnet-jsonrpc.conflux-chain.org:12537",
  TEST: "http://wallet-testnet-jsonrpc.conflux-chain.org:12537",
}[NETWORK];

const DEPLOY_ACCOUNT_ADDRESS = "0x1616f9a260a54e38e8dfd7d1e0c5c4c507a77e19";

process.env.DEPLOY_ACCOUNT_PRIKEY &&
  console.log(
    "no DEPLOY_ACCOUNT_PRIKEY env found, read from default dropbox path"
  );
const DEPLOY_ACCOUNT_PRIKEY =
  process.env.DEPLOY_ACCOUNT_PRIKEY ||
  readFileSync(
    path.resolve(
      process.env.HOME,
      "./Dropbox/office/conflux/cfx-balance-tracker-deploy-account-pk.txt"
    ),
    { encoding: "utf-8" }
  );

const FAUCET_URL = {
  MAIN: `http://wallet.confluxscan.io/faucet/dev/ask?address=${DEPLOY_ACCOUNT_ADDRESS}`,
  TEST: `http://test-faucet.conflux-chain.org:18088/dev/ask?address=${DEPLOY_ACCOUNT_ADDRESS}`,
}[NETWORK];

const cfx = new Conflux({ url: RPC_URL, logger: console });
const account = cfx.Account(DEPLOY_ACCOUNT_PRIKEY);

(async function () {
  console.info("Getting faucet");
  if (!(await fetch(FAUCET_URL)).ok) throw new Error("Can't get faucet");
  console.info(
    "Got faucet, check balance ",
    (await cfx.getBalance(account.address)).toString()
  );
  console.info(
    "Check nonce",
    (await cfx.getNextNonce(account.address)).toString()
  );

  console.info("Deploy contract");
  await cfx
    .Contract({ abi, bytecode })
    .constructor()
    .sendTransaction({ from: account, gasPrice: "0x10000000000" })
    .confirmed()
    .catch((err) => {
      console.log("contract deploy error");
      throw err;
    });
})();
