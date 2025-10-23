import { Contract, BrowserProvider } from "ethers";
import { abi as ztomicAbi } from "../abi/ztomic.json";
import BurnMintERC20Abi from "../abi/BurnMintERC20.json"

const ztomic_USDCtoUSDT_sepolia = "0xc045c82615123D371347dDfD9E529e84302BA6fd";
const ztomic_USDTtoUSDC_sepolia = "0x09F1d92108AEc66ccFe889A039b0e05245cEB0f4";

const ztomic_USDCtoUSDT_hedera = "0x38378c353F71Fb1C80adBF604Db0F752373f141E";
const ztomic_USDTtoUSDC_hedera = "0x9aB490fB355FFA9ea3194fb58CEa7A8D7a663f52";

const USDC_hedera = "0x6e08a948f54f82ac8b3484348b80d2da2e9e20c1"
const USDT_hedera = "0x5cd8099f3fee66ba4980b792d100e7a5eab3bfaf"

const USDC_sepolia = "0x78E20f32df266595B7544Ee206e61A516A3a2271"
const USDT_sepolia = "0x0af700A3026adFddC10f7Aa8Ba2419e8503592f7"

const contractZtomicSepolia_USDCtoUSDT = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(ztomic_USDCtoUSDT_sepolia, ztomicAbi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractZtomicSepolia_USDTtoUSDC = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(ztomic_USDTtoUSDC_sepolia, ztomicAbi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractZtomicHedera_USDCtoUSDT = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(ztomic_USDCtoUSDT_hedera, ztomicAbi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractZtomicHedera_USDTtoUSDC = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(ztomic_USDTtoUSDC_hedera, ztomicAbi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractUSDC_Hedera = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(USDC_hedera, BurnMintERC20Abi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractUSDT_Hedera = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(USDT_hedera, BurnMintERC20Abi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractUSDC_Sepolia = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(USDC_sepolia, BurnMintERC20Abi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}

const contractUSDT_Sepolia = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new Contract(USDT_sepolia, BurnMintERC20Abi, signer);
    }
    catch (error) {
        throw new Error("Failed to create contract instance: " + (error as Error).message);
    }
}