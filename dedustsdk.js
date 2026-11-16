import { Factory, MAINNET_FACTORY_ADDR } from '@dedust/sdk';
import { Address, TonClient4 } from "@ton/ton";

const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
