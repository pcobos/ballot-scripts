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
  // Conditional to check if the ballot address is passed as an argument (3rd element in argv array)
  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const ballotAddress = process.argv[2];
  // Conditional to check if the delegatee address is passed as an argument (3rd element in argv array)
  if (process.argv.length < 4) throw new Error("Delegated address missing");
  const delegatedAddress = process.argv[3];

  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    ballotJson.abi,
    signer
  ) as Ballot;

  // Storing chairperson in a variable (through Ballot contract's getter)
  const chairpersonAddress = await ballotContract.chairperson();
  // Conditional to check if the message sender is the chairperson
  if (chairpersonAddress !== signer.address)
    throw new Error("Caller is not the chairperson for this contract");

  // Storing voter in a variable (passing the delegatee's address)
  const voter = await ballotContract.voters(delegatedAddress);
  // Conditional to check if the voter can vote
  if (voter.weight.toNumber() < 1)
    throw new Error("This address does not have the right to vote!");

  // Once confirmed that we can delegate the vote to this delegatee, we call the delegate method and pass his address as an argument
  const delegate = await ballotContract.delegate(delegatedAddress);

  // Waiting for the transaction to go through
  await delegate.wait();
  console.log("Delegated!");
  // Getting the voter again to check his new voting weight
  const voterDelegated = await ballotContract.voters(delegatedAddress);
  console.log(
    "The delegated address has a voting weight of",
    voterDelegated.weight.toNumber()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
