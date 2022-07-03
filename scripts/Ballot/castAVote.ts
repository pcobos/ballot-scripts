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

  // Conditional to check if the address was passed when running the script (3rd element in the process.argv array)
  if (process.argv.length < 3) throw new Error("Ballot address missing");

  // Storing the ballot address (value comes from the argv array, 3rd element)
  const ballotAddress = process.argv[2];
  console.log(ballotAddress);

  // Conditional to check if the proposal's index was passed when running the script (4th element in the process.argv array)
  if (process.argv.length < 4) throw new Error("Proposal Index missing");

  // Storing the proposal in a variable
  const proposal = process.argv[3];

  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    ballotJson.abi,
    signer
  ) as Ballot;

  // console.log(voterAddress);
  console.log("voterAddress");
  // TODO: Write the script for casting a vote
  // I need the proposal's index for it
  // The message sender's address
  // I will need an if to prevent the person from voting if their weight is zero and if their voted status is true

  const address = wallet.address;

  // Condition to check if the voter has enough weight
  // TODO - Parse the weight so that we can use the < operator on it. Suggest to store the weight in a variable
  // Storing weight (BigNumber) in a variable
  const weightBigNumber = (await ballotContract.voters(address)).weight;

  const weight = Number(ethers.utils.formatEther(weightBigNumber));

  if (weight < 1) throw new Error("Voter does not have enough weight");

  // Calling vote function from Ballot.sol and passing the
  const vote = await ballotContract.vote(proposal);

  // Waiting for transaction to be mined
  await vote.wait();

  // seeking confirmation that the address has voted (by console logging the voter object to make sure that the vote attribute is true)
  const voter = await ballotContract.voters(address);
  console.log(voter, "address", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export default main;
