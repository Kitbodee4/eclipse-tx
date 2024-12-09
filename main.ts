require('dotenv').config();
import { ComputeBudgetProgram, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { WhirlpoolContext, ORCA_WHIRLPOOL_PROGRAM_ID, buildWhirlpoolClient, swapQuoteByInputToken, PriceMath, IGNORE_CACHE } from "@orca-so/whirlpools-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";
import { DecimalUtil, Percentage } from "@orca-so/common-sdk";
import Decimal from "decimal.js";
import path from 'path';
import fs from 'fs';
import base58 from "bs58";

// Setting up wallet path
const walletPath = path.resolve(
  (process.env.HOME || process.env.USERPROFILE || '') + '/.config/solana/id.json'
);

if (!fs.existsSync(walletPath)) {
  console.error(`\u274C Wallet file not found: ${walletPath}`);
  process.exit(1);
}

process.env.ANCHOR_WALLET = walletPath;
process.env.ANCHOR_PROVIDER_URL = "https://eclipse.helius-rpc.com";

// Set up amount range from environment
const minAmount = parseFloat(process.env.MIN_AMOUNT ?? "0.000001");
const maxAmount = parseFloat(process.env.MAX_AMOUNT ?? "0.01");

const randomAmount = Math.random() * (maxAmount - minAmount) + minAmount;

// Initialize the provider
const provider = AnchorProvider.env();
console.log(`\u1F517 Connection endpoint: ${provider.connection.rpcEndpoint}`);
console.log(`\uD83D\uDCB0 Wallet: ${provider.wallet.publicKey.toBase58()}`);

async function main() {
  console.log(`\uD83D\uDD0D Fetching Whirlpool context...`);
  const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
  const fetcher = ctx.fetcher;
  const client = buildWhirlpoolClient(ctx);

  console.log(`\u1F4C2 Getting pool data...`);
  const whirlpoolPubkey = new PublicKey("BqinHKam4jX8NUYbj2LsMnBYbqFnPvggiyx4PBHPkhSo");
  const whirlpool = await client.getPool(whirlpoolPubkey);

  console.log(`\u2194\uFE0F Getting swap quote...`);
  const tokenA = whirlpool.getTokenAInfo();
  const tokenB = whirlpool.getTokenBInfo();

  const inputToken = Math.random() < 0.5 ? tokenA : tokenB;
  const amountIn = new Decimal(randomAmount.toFixed(8));
  const outputToken = inputToken === tokenA ? tokenB : tokenA;

  const quote = await swapQuoteByInputToken(
    whirlpool,
    inputToken.mint,
    DecimalUtil.toBN(amountIn, inputToken.decimals),
    Percentage.fromFraction(10, 1000),
    ctx.program.programId,
    fetcher,
    IGNORE_CACHE,
  );

  console.log(`\u1F4C2 Swap Quote:`);
  console.log(`? aToB: ${quote.aToB}`);
  console.log(`\uD83D\uDCB5 Estimated Amount In: ${DecimalUtil.fromBN(quote.estimatedAmountIn, inputToken.decimals).toString()}`);
  console.log(`\uD83D\uDCB0 Estimated Amount Out: ${DecimalUtil.fromBN(quote.estimatedAmountOut, outputToken.decimals).toString()}`);
  const rate = DecimalUtil.fromBN(quote.estimatedAmountIn, inputToken.decimals).div(DecimalUtil.fromBN(quote.estimatedAmountOut, outputToken.decimals));
  console.log(`\uD83D\uDCC8 Swap Rate: ${rate.toString()}`);

  const tx = await whirlpool.swap(quote);

  // Transaction Fee Logic...
  const estimatedComputeUnits = 100_000;
  const additionalFeeInLamports = 1_000;

  const setComputeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: Math.floor((additionalFeeInLamports * 1_000_000) / estimatedComputeUnits),
  });
  const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: estimatedComputeUnits,
  });

  tx.prependInstruction({
    instructions: [setComputeUnitLimitIx, setComputeUnitPriceIx],
    cleanupInstructions: [],
    signers: [],
  });

  // manual build
  const built = await tx.build({ maxSupportedTransactionVersion: 0 });

  const blockhash = await provider.connection.getLatestBlockhashAndContext("confirmed");
  const blockHeight = await provider.connection.getBlockHeight({ commitment: "confirmed", minContextSlot: await blockhash.context.slot });

  // Transaction expiration logic
  const transactionTTL = blockHeight + 151;

  const notSigned = built.transaction as VersionedTransaction;
  notSigned.message.recentBlockhash = blockhash.value.blockhash;

  if (built.signers.length > 0) notSigned.sign(built.signers);
  const signed = await provider.wallet.signTransaction(notSigned);
  const signature = base58.encode(signed.signatures[0]);

  // Send and confirm transaction with retries
  const waitToConfirm = () => new Promise((resolve) => setTimeout(resolve, 5000));
  const waitToRetry = () => new Promise((resolve) => setTimeout(resolve, 2000));

  const numTry = 10;
  let landed = false;
  for (let i = 0; i < numTry; i++) {
    // Check transaction TTL
    const blockHeight = await provider.connection.getBlockHeight("confirmed");
    if (blockHeight >= transactionTTL)  {
      console.log("transaction has expired");
      break;
    }
    //console.log("transaction is still valid,", transactionTTL - blockHeight, "blocks left (at most)");

    // Send transaction without retrying on RPC server
    await provider.connection.sendRawTransaction(signed.serialize(), { skipPreflight: true, maxRetries: 0 });
    //console.log("Sent, signature:", signature);

    await waitToConfirm();

    // Check signature status
    const sigStatus = await provider.connection.getSignatureStatus(signature);
    //console.log("sigStatus", sigStatus.value?.confirmationStatus, sigStatus.context.slot);
    if (sigStatus.value?.confirmationStatus === "confirmed") {
      landed = true;
      break;
    }

    await waitToRetry();
  }
  
  console.log(`\u2705 Transaction ${landed ? 'confirmed' : 'failed'}`, "https://eclipsescan.xyz/tx/" + signature);
}

async function runMultipleTimes(times: number) {
  const minSleepTime = parseFloat(process.env.MIN_SLEEP_TIME ?? "1");
  const maxSleepTime = parseFloat(process.env.MAX_SLEEP_TIME ?? "10");

  for (let i = 0; i < times; i++) {
    console.log(`\uD83D\uDE80 Running iteration ${i + 1}...`);
    await main();
    console.log(`\u2705 Iteration ${i + 1} complete.`);

    const randomSleepTime = Math.random() * (maxSleepTime - minSleepTime) + minSleepTime;
    console.log(`? Sleeping for ${randomSleepTime.toFixed(2)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, randomSleepTime * 1000));
  }
}

const times = parseInt(process.env.TIMES ?? "50");
runMultipleTimes(times);
