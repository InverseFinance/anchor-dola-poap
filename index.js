import { createArrayCsvWriter } from 'csv-writer';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

// Initialize environment variables
dotenv.config();
const oldestBlock = Number(process.env.OLDEST_BLOCK);

// Helper functions
async function exportCSV(filename, records) {
    const csvWriter = createArrayCsvWriter({
        header: ['ADDRESS'],
        path: filename
    });
    await csvWriter.writeRecords(records.map(v => [v]))
}
function setUnion(sets) {
    const _union = new Set(sets[0]);

    // Start at index 1, because `_union` is already initialized with the set at
    // index 0.
    for (let i = 1; i < sets.length; i++) {
        for (let element of sets[i]) {
            _union.add(element);
        }
    }

    return _union;
}
async function filterBlockDates(events, deadline) {
    // The `filter` method on arrays is not asynchronous. To get around this
    // we do a two-step filter process by first running `map` to determine which
    // values should be filtered out. Then we run the filter synchronously with
    // those intermediate results.
    const asyncFilter = async (array, predicate) => {
        const results = await Promise.all(array.map(predicate));

        return array.filter((_value, index) => results[index]);
    }

    return await asyncFilter(events, async (e) => (await e.getBlock()).timestamp <= deadline);
}


// We're only interested in the events related to Dola / Anchor usage.
const anchorEthABI = ['event Mint(address minter, uint256 mintAmount, uint256 mintTokens)'];
const stakingABI = ['event Staked(address indexed user, uint256 amount)'];
const stabilizerABI = ['event Buy(address indexed user, uint purchased, uint spent)'];
const uniswapABI = ['event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'];

// Initialize contracts
const provider = new ethers.providers.AlchemyProvider(process.env.NETWORK, process.env.ALCHEMY_KEY)
const anchorEth = new ethers.Contract(process.env.ANCHOR_ETH_ADDRESS, anchorEthABI, provider);
const rewardsDolaEth = new ethers.Contract(process.env.DOLA_ETH_STAKING_ADDRESS, stakingABI, provider);
const rewardsDolaCrv = new ethers.Contract(process.env.DOLA_CRV_STAKING_ADDRESS, stakingABI, provider);
const stabilizer = new ethers.Contract(process.env.STABILIZER_ADDRESS, stabilizerABI, provider);
const uniswap = new ethers.Contract(process.env.UNISWAP_POOL_ADDRESS, uniswapABI, provider);

// Get all events
const suppliedEthFilter = anchorEth.filters.Mint();
const stakedDolaEthFilter = rewardsDolaEth.filters.Staked();
const stakedDolaCrvFilter = rewardsDolaCrv.filters.Staked();
const boughtDolaFilter = stabilizer.filters.Buy();
const swapFilter = uniswap.filters.Swap();

const ethSupplies = await anchorEth.queryFilter(suppliedEthFilter, oldestBlock, 'latest');
const dolaEthStakes = await rewardsDolaEth.queryFilter(stakedDolaEthFilter, oldestBlock, 'latest');
const dolaCrvStakes = await rewardsDolaCrv.queryFilter(stakedDolaCrvFilter, oldestBlock, 'latest');
const dolaBuys = await stabilizer.queryFilter(boughtDolaFilter, oldestBlock, "latest");
const dolaSwaps = await uniswap.queryFilter(swapFilter, oldestBlock, 'latest');

// Get sets of unique addresses per event type
const ethSuppliers  = new Set(ethSupplies.map(event => event.args.minter));
const dolaBuyers = new Set(dolaBuys.map(event => event.args.user));
const dolaSwappers = new Set(dolaSwaps.map(event => event.args.sender));

// Staking rewards have an end date. We filter out staking events that occurred after that date
const validDolaCrvStakeEvents = await filterBlockDates(dolaCrvStakes, Number(process.env.DOLA_CRV_STAKING_DEADLINE));
const validDolaEthStakeEvents = await filterBlockDates(dolaEthStakes, Number(process.env.DOLA_ETH_STAKING_DEADLINE));
const dolaCrvStakers = new Set(validDolaCrvStakeEvents.map(event => event.args.user));
const dolaEthStakers = new Set(validDolaEthStakeEvents.map(event => event.args.user));

// Combine sets and thus filter out duplicates
const elligibleAddresses = setUnion([ethSuppliers, dolaEthStakers, dolaCrvStakers, dolaBuyers, dolaSwappers]);
await exportCSV('rewards.csv', [...elligibleAddresses]);
