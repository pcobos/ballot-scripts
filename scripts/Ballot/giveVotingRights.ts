import { Contract, ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/Ballot.sol/Ballot.json";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = ethers.providers.getDefaultProvider("ropsten");
  const signer = wallet.connect(provider);
  // Balance in BigNumber
  const balanceBN = await signer.getBalance();
  // Parsing BigNumber balance (from wei to decimal)
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  // Conditional checking if wallet has enough balance
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  // Conditional to check if the ballot address is passed as an argument (3rd element in argv array)
  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const ballotAddress = process.argv[2];
  // Conditional to check if the voter's address is passed as an argument (4th element in argv array)
  if (process.argv.length < 4) throw new Error("Voter address missing");
  const voterAddress = process.argv[3];
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  // Not sure why we are not using the contract factory here, I believe it is because we are importing it from typechain
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    ballotJson.abi,
    signer
  ) as Ballot;

  // ----------------------------------------------------------

  // Getting the chairperson's address via the getter function inside the ballotContract by calling it on its instance
  const chairpersonAddress = await ballotContract.chairperson();

  // Condition to check if the person attempting to give voting rights is the chairman or not (by checking the signing address)
  if (chairpersonAddress !== signer.address)
    throw new Error("Caller is not the chairperson for this contract");
  console.log(`Giving right to vote to ${voterAddress}`);

  // Storing the transaction in a variable. Transaction starts when we call the giveRightToVote external function on the Ballot contract's instance. Passing receiver's address as an argument
  const tx = await ballotContract.giveRightToVote(voterAddress);
  console.log("Awaiting confirmations");

  // Resolving transaction to Transaction Receipt once the transaction has been mined
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
