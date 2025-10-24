"use client";

import { Contract, BrowserProvider, type Signer, type ContractRunner } from "ethers";
// Import the JSON artifacts as default and extract .abi to avoid named-export warnings
import ztomicJson from "../abi/ztomic.json";
import BurnMintERC20Json from "../abi/BurnMintERC20.json";
const ztomicAbi = (ztomicJson as any).abi ?? ztomicJson;
const BurnMintERC20Abi = (BurnMintERC20Json as any).abi ?? BurnMintERC20Json;

// Contract Addresses
const ztomic_USDCtoUSDT_sepolia = "0x63DFD07e625736bd20C62BD882e5D3475d8E0297";
const ztomic_USDTtoUSDC_sepolia = "0x09F1d92108AEc66ccFe889A039b0e05245cEB0f4";
const ztomic_USDCtoUSDT_hedera = "0x38378c353F71Fb1C80adBF604Db0F752373f141E";
const ztomic_USDTtoUSDC_hedera = "0x9aB490fB355FFA9ea3194fb58CEa7A6D7a663f52";

// Token Addresses
const USDC_hedera = "0x6e08a948f54f82ac8b3484348b80d2da2e9e20c1";
const USDT_hedera = "0x5cd8099f3fee66ba4980b792d100e7a5eab3bfaf";
const USDC_sepolia = "0x78E20f32df266595B7544Ee206e61A516A3a2271";
const USDT_sepolia = "0x0af700A3026adFddC10f7Aa8Ba2419e8503592f7";

/**
 * A generic factory function to create any contract instance.
 * This avoids repeating the provider/signer logic in every function.
 */
const createContractInstance = async (address: string, abi: any): Promise<Contract> => {
    try {
        // Guard: this function is client-only and requires window.ethereum
        if (typeof window === "undefined") {
            throw new Error("window is not available (server-side). Create contract instances only on the client.");
        }
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found. Please install MetaMask.");
        }
        const provider = new BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        return new Contract(address, abi, signer);
    } catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
};

// === EXPORTED ZTOMIC CONTRACTS ===

export const contractZtomicSepolia_USDCtoUSDT = () => 
    createContractInstance(ztomic_USDCtoUSDT_sepolia, ztomicAbi);

export const contractZtomicSepolia_USDTtoUSDC = () => 
    createContractInstance(ztomic_USDTtoUSDC_sepolia, ztomicAbi);

export const contractZtomicHedera_USDCtoUSDT = () => 
    createContractInstance(ztomic_USDCtoUSDT_hedera, ztomicAbi);

export const contractZtomicHedera_USDTtoUSDC = () => 
    createContractInstance(ztomic_USDTtoUSDC_hedera, ztomicAbi);

// === EXPORTED TOKEN CONTRACTS ===

export const contractUSDC_Hedera = () => 
    createContractInstance(USDC_hedera, BurnMintERC20Abi);

export const contractUSDT_Hedera = () => 
    createContractInstance(USDT_hedera, BurnMintERC20Abi);

export const contractUSDC_Sepolia = () => 
    createContractInstance(USDC_sepolia, BurnMintERC20Abi);

export const contractUSDT_Sepolia = () => 
    createContractInstance(USDT_sepolia, BurnMintERC20Abi);