"use client"

import { type Abi } from "viem";
import { BrowserProvider, Contract, type InterfaceAbi } from "ethers";
import { type DepositedInitiatorLog } from "@/components/eventTypes";
import { PoseidonTree, ZERO_VALUES } from "./merkleTree";
import { Barretenberg } from "@aztec/bb.js";

import ztomicAbiJson from "../abi/ztomic.json"
const ztomicAbi = ztomicAbiJson.abi as InterfaceAbi;

export async function getEvents(address : string) {

if(typeof window.ethereum == undefined)
    throw Error("Browser Provider is not available");

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new Contract(address, ztomicAbi, signer);

const depositEvents = await contract.queryFilter("deposited");

const typedEvents = depositEvents as unknown as DepositedInitiatorLog[];

const leaves = typedEvents
        .sort((a, b) => Number(a.args.leafIndex) - Number(b.args.leafIndex))
        .map(event => event.args._commitment);

        console.log("Fetched and sorted leaves", leaves);
        
    
return leaves;

}