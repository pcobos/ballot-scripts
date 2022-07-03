import { ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/Ballot.sol/Ballot.json";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  console.log(bytes32Array);
  return bytes32Array;
}

async function main() {
  // Variable for initializing a wallet, ternary operator to check if there is a private key
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  // Getting a provider to abstrac a connection to the Ethereum blockchain
  const provider = ethers.providers.getDefaultProvider("ropsten");
  // Calling connect method on the wallet and passing the provider as an argument. Not sure if this method is coming from ethers.js or if it is a hardhat helper.
  const signer = wallet.connect(provider);
  // Getting the wallet's balance (In wei I believe)
  const balanceBigNumber = await signer.getBalance();
  // Formating balance(wei) into a decimal string representing the amount of ether
  const balance = Number(ethers.utils.formatEther(balanceBigNumber));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  console.log("Deploying Ballot contract");
  console.log("Proposals: ");
  // Array containing the arguments (proposals) passed to the process when run it in the command line. The first two arguments are something which I am not sure of
  const proposals = process.argv.slice(2);
  if (proposals.length < 2) throw new Error("Not enough proposals provided");
  // Iterating over the proposals and printing them
  proposals.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });

  // Creating a new instance of a ContractFactory passing interface (abi), the bytecode and the signer address as arguments
  const ballotFactory = new ethers.ContractFactory(
    ballotJson.abi,
    ballotJson.bytecode,
    signer
  );

  // Deploying the contract passing the proposals array (in bytes 32) as arguments
  const ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32(proposals)
  );
  console.log("Awaiting confirmations");

  // Not sure what this line is necessary for. Looks like it is just a confirmation that it has been deployed
  await ballotContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${ballotContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
