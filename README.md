# Anchor - Dola Address finder
The script contained within this repository finds addresses that have interacted
with Inverse Finance's Anchor system as well as Dola: its synthetic asset. 

A user will be counted as having interacted with Anchor if any of the following
conditions have been met:
 - user has supplied ETH into Anchor;
 - user has participated in the DOLA-ETH rewards pool*;
 - user has participated in the DOLA-3CRV rewards pool*;
 - user has minted DOLA via the stabilizer; or
 - user has swapped ETH for DOLA on Uniswap.

Note bene: participation in the rewards pools only counts if it occurred before
the rewards period finished.

This list of addesses is outputted as a CSV file.

## Requirements
The following list of versions is what the software has been tested with:
| Software | Version            |
| -------- | ------------------ |
| NodeJS   | v14.15.5 or higher |
| Yarn     | v1.22.10 or higher |

In addition you will need an [Alchemy](https://www.alchemyapi.io/) API key.

## Installing
To get a copy of this application running locally, run the following commands:
```bash
git clone https://github.com/JackieXu/anchor-dola-poap
cd anchor-dola-poap
yarn install
```

## Usage
1. Copy `.env.example` to `.env` by running the following: `cp .env.example .env`
2. Fill in the required fields in `.env`. See [Mainnet configuration](#mainnet-configuration) for mainnet values. 
3. Run `node index.js` to start gathering addresses.
4. Open `rewards.csv` to view the gathered addresses.

### Mainnet configuration
```bash
NETWORK=homestead
ANCHOR_DOLA_ADDRESS=0x7fcb7dac61ee35b3d4a51117a7c58d53f0a8a670
ANCHOR_ETH_ADDRESS=0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8
DOLA_ETH_STAKING_ADDRESS=0x5c1245F9dB3f8f7Fe1208cB82325eA88fC11Fe89
DOLA_CRV_STAKING_ADDRESS=0xA88948217f21175337226d94f1A47b7A01EEd197
UNISWAP_POOL_ADDRESS=0xecfbe9b182f6477a93065c1c11271232147838e5
STABILIZER_ADDRESS=0x7ec0d931affba01b77711c2cd07c76b970795cdd
OLDEST_BLOCK=11915920
DOLA_CRV_STAKING_DEADLINE=1619712661
DOLA_ETH_STAKING_DEADLINE=1616095381
```