import Types "../Types";

module {
  public let materials : [Types.CourseMaterial] = [
    // Course 1: Blockchain Fundamentals & Ethereum
    {
      courseId = 1;
      modules = [
        {
          moduleId = 1;
          title = "Introduction to Blockchain Technology";
          content = "Blockchain is a distributed ledger technology that enables decentralized and transparent data storage. Each block contains the hash of the previous block, a timestamp, and transaction data.\n          **Key Characteristics of Blockchain:**\n          - **Decentralization**: No central authority controls the network\n          - **Transparency**: All transactions can be publicly verified  \n          - **Immutability**: Recorded data is difficult to alter\n          - **Consensus**: Validators agree on the state of the system\n          **How Blockchain Works:**\n          1. A transaction is initiated by a user\n          2. The transaction is broadcasted to the network\n          3. The network validates the transaction\n          4. The transaction is packaged into a block\n          5. The block is added to the chain after consensus\n          Blockchain was first introduced through Bitcoin in 2008 by Satoshi Nakamoto as a solution to the double-spending problem in digital currency.";
          codeExample = "
          // Example of a simple block structure
          public type Block = {
            index: Nat;
            timestamp: Int;
            data: Text;
            previousHash: Text;
            hash: Text;
            nonce: Nat;
          };

          // Function to calculate block hash
          public func calculateHash(block: Block) : Text {
            let input = Nat.toText(block.index) # Int.toText(block.timestamp) # 
                        block.data # block.previousHash # Nat.toText(block.nonce);
            // In real implementation, use SHA-256
            return \"hash_\" # input;
          };";
        },
        {
        moduleId = 2;
        title = "Understanding Ethereum";
        content = "Ethereum is a blockchain platform that enables smart contracts and decentralized applications (dApps). Unlike Bitcoin, which focuses on value transfer, Ethereum is a 'world computer' capable of running programs.\n        **Components of Ethereum:**\n        - **Ethereum Virtual Machine (EVM)**: Runtime environment for smart contracts\n        - **Gas**: Unit of cost for executing operations in the network\n        - **Ether (ETH)**: Native cryptocurrency of Ethereum\n        - **Smart Contracts**: Self-executing contracts with terms written in code\n        **Advantages of Ethereum:**\n        - Turing-complete programming language\n        - Large and active ecosystem\n        - Token standards (ERC-20, ERC-721, ERC-1155)\n        - Layer 2 solutions for scalability\n        Ethereum uses the proof-of-stake consensus mechanism since The Merge in September 2022, making it more energy-efficient compared to proof-of-work.";
        codeExample = "// Example of an Ethereum account structure
          public type EthereumAccount = {
            address: Text;
            balance: Nat;
            nonce: Nat;
            codeHash: Text;
            storageRoot: Text;
          };

          // Example of Ethereum transaction
          public type Transaction = {
            from: Text;
            to: ?Text; // null for contract creation
            value: Nat;
            gasLimit: Nat;
            gasPrice: Nat;
            data: Blob;
            nonce: Nat;
          };";
        },
        {
        moduleId = 3;
        title = "Consensus Mechanisms";
        content = "A consensus mechanism is the protocol used by blockchain networks to reach agreement on the valid state of the ledger. It ensures all nodes have the same version of the ledger.\n\n        **Types of Consensus Mechanisms:**\n\n        **1. Proof of Work (PoW)**\n        - Miners compete to solve cryptographic puzzles\n        - The first to solve gets rewarded\n        - Used by Bitcoin\n        - Energy-intensive but highly secure\n\n        **2. Proof of Stake (PoS)**  \n        - Validators are chosen based on their stake\n        - More energy-efficient than PoW\n        - Used by Ethereum 2.0\n        - Penalties for malicious behavior (slashing)\n\n        **3. Delegated Proof of Stake (DPoS)**\n        - Token holders vote for delegates\n        - Delegates validate transactions on behalf of voters\n        - Faster but less decentralized\n\n        **4. Proof of Authority (PoA)**\n        - Pre-approved identities act as validators\n        - Suitable for private/consortium networks\n        - Very fast but less decentralized";
        codeExample = "// Simplified PoS implementation
          import Map \"mo:base/HashMap\";

          public type Validator = {
            address: Text;
            stake: Nat;
            isActive: Bool;
          };

          public class ProofOfStake() {
            private var validators = Map.HashMap<Text, Validator>(10, Text.equal, Text.hash);
            private var totalStake: Nat = 0;
            
            public func addValidator(address: Text, stake: Nat) {
              validators.put(address, {
                address = address;
                stake = stake;
                isActive = true;
              });
              totalStake += stake;
            };
            
            public func selectValidator(): ?Text {
              // Simplified random selection weighted by stake
              // In real implementation, use verifiable random function
              if (totalStake == 0) return null;
              // Logic to select validator based on stake
              return ?\"validator_address\";
            };
          };";
        }
      ];
    },

    // Course 2: Solidity Smart Contract Development
    {
      courseId = 2;
      modules = [
        {
          moduleId = 1;
          title = "Introduction to Smart Contracts";
          content = "Smart contracts are programs that run on blockchain and automatically execute agreements when certain conditions are met. The concept was first introduced by Nick Szabo in 1994.\n\n          **Characteristics of Smart Contracts:**\n          - **Self-executing**: Automatically executes terms without intermediaries\n          - **Immutable**: Cannot be changed after deployment (unless upgrade mechanisms exist)\n          - **Transparent**: Code can be viewed and verified by anyone\n          - **Trustless**: Does not require trust in third parties\n\n          **Benefits of Smart Contracts:**\n          - Reduce costs by removing middlemen\n          - Fast and automatic execution  \n          - Reduce human error\n          - Transparency and immutability\n\n          **Use Cases:**\n          - Tokens and cryptocurrencies\n          - Decentralized exchanges (DEX)\n          - Insurance claims automation\n          - Supply chain tracking\n          - Voting systems\n          - Escrow services";
          codeExample = "// Example of a simple smart contract in Motoko
          import Principal \"mo:base/Principal\";
          import Map \"mo:base/HashMap\";

          actor SimpleContract {
            private var owner: Principal = Principal.fromText(\"rdmx6-jaaaa-aaaah-qcaiq-cai\");
            private var contractBalance: Nat = 0;
            private var isActive: Bool = true;
            
            // Modifier to check owner
            private func onlyOwner(caller: Principal) : Bool {
              Principal.equal(caller, owner)
            };
            
            // Deposit function
            public func deposit(amount: Nat) : async Text {
              if (not isActive) return \"Contract is not active\";
              contractBalance += amount;
              \"Deposit successful. New balance: \" # Nat.toText(contractBalance)
            };
            
            // Withdraw function (owner only)
            public shared(msg) func withdraw(amount: Nat) : async Text {
              if (not onlyOwner(msg.caller)) return \"Only owner can withdraw\";
              if (amount > contractBalance) return \"Insufficient balance\";
              contractBalance -= amount;
              \"Withdrawal successful. Remaining balance: \" # Nat.toText(contractBalance)
            };
            
            public query func getBalance() : async Nat {
              contractBalance
            };
          };";
        },
        {
          moduleId = 2;
          title = "Solidity Fundamentals";
          content = "Solidity is a programming language designed specifically for writing smart contracts on the Ethereum Virtual Machine (EVM). Its syntax is similar to JavaScript and C++.\n\n          **Key Features of Solidity:**\n          - **Statically typed**: Data types must be declared\n          - **Contract-oriented**: Designed for smart contracts\n          - **Inheritance support**: Contracts can inherit from other contracts\n          - **Libraries**: Reusable code that can be deployed once and reused\n\n          **Data Types in Solidity:**\n          - **Value Types**: bool, int, uint, address, bytes, string\n          - **Reference Types**: arrays, structs, mappings\n          - **Special Variables**: msg.sender, msg.value, block.timestamp\n\n          **Visibility Modifiers:**\n          - **public**: Accessible from anywhere\n          - **private**: Only within the same contract\n          - **internal**: Contract and derived contracts\n          - **external**: Only from outside the contract\n\n          **Function Modifiers:**\n          - **view**: Does not modify state\n          - **pure**: Does not read/modify state\n          - **payable**: Can receive Ether";
          codeExample = "// Example of Solidity contract (for reference)
          /*
          pragma solidity ^0.8.0;

          contract SimpleStorage {
              uint256 private storedData;
              address public owner;
              
              modifier onlyOwner() {
                  require(msg.sender == owner, \"Not the owner\");
                  _;
              }
              
              constructor() {
                  owner = msg.sender;
              }
              
              function set(uint256 x) public onlyOwner {
                  storedData = x;
              }
              
              function get() public view returns (uint256) {
                  return storedData;
              }
          }
          */

          // Equivalent in Motoko
          import Principal \"mo:base/Principal\";

          actor SimpleStorage {
            private stable var storedData: Nat = 0;
            private let owner: Principal = Principal.fromText(\"owner-principal-id\");
            
            private func onlyOwner(caller: Principal) : Bool {
              Principal.equal(caller, owner)
            };
            
            public shared(msg) func set(x: Nat) : async Text {
              if (not onlyOwner(msg.caller)) {
                return \"Not the owner\";
              };
              storedData := x;
              \"Data stored successfully\"
            };
            
            public query func get() : async Nat {
              storedData
            };
            
            public query func getOwner() : async Principal {
              owner
            };
          };";
        }
      ];
    },

    // Course 3: Internet Computer (ICP) Development  
    {
      courseId = 3;
      modules = [
        {
          moduleId = 1;
          title = "Introduction to Internet Computer";
          content = "The Internet Computer (ICP) is a blockchain designed to run web applications at traditional internet speed. Developed by the DFINITY Foundation, ICP allows smart contracts (called \"canisters\") to serve web content directly to browsers.\n\n            **Advantages of Internet Computer:**\n            - **Web-speed**: Finality within 1-2 seconds\n            - **Web-serving**: Canisters can serve HTML, CSS, JS directly\n            - **Unlimited scalability**: Subnet nodes can be added\n            - **Reverse gas model**: Developers pay gas, not users\n            - **Internet identity**: Decentralized authentication system\n\n            **ICP Architecture:**\n            - **Subnets**: Independent blockchains that intercommunicate\n            - **Nodes**: Computers running the ICP protocol\n            - **Canisters**: Smart contracts that can store data and serve web\n            - **Cycles**: Computational units to pay for resource usage\n\n            **Consensus Mechanism:**\n            ICP uses a novel consensus called \"Threshold Relay\" which provides very fast finality with Byzantine fault tolerance.";
          codeExample = "// Example of a simple canister in Motoko
            import Debug \"mo:base/Debug\";
            import Time \"mo:base/Time\";

            actor HelloICP {
              // Stable variable persist across upgrades
              private stable var greeting: Text = \"Hello, Internet Computer!\";
              private stable var visitCount: Nat = 0;
              
              // Query calls are fast (read-only)
              public query func getGreeting() : async Text {
                greeting
              };
              
              // Update calls can modify state
              public func setGreeting(newGreeting: Text) : async Text {
                greeting := newGreeting;
                visitCount += 1;
                \"Greeting updated! Visit count: \" # Nat.toText(visitCount)
              };
              
              public query func getVisitCount() : async Nat {
                visitCount
              };
              
              public query func getCurrentTime() : async Int {
                Time.now()
              };
              
              // Heartbeat function (runs periodically)
              system func heartbeat() : async () {
                Debug.print(\"Canister is alive at: \" # Int.toText(Time.now()));
              };
            };";
        },
        {
          moduleId = 2;
          title = "Motoko Programming Language";
          content = "Motoko is a programming language specifically designed for the Internet Computer. Developed by the DFINITY team, Motoko has syntax familiar to JavaScript/TypeScript developers with modern features.\n\n          **Key Features of Motoko:**\n          - **Actor-based**: Every canister is an actor communicating via messages\n          - **Async/await**: Built-in support for asynchronous programming\n          - **Stable variables**: Data persists across canister upgrades\n          - **Pattern matching**: Powerful pattern matching with switch expressions\n          - **Type safety**: Strong static typing with type inference\n          - **Garbage collected**: Automatic memory management\n\n          **Data Types:**\n          - **Primitive**: Bool, Int, Nat, Text, Char\n          - **Compound**: Arrays, Tuples, Records, Variants\n          - **Special**: Principal, Blob, Error\n\n          **Actor Model:**\n          Each canister is an actor that:\n          - Has private state\n          - Communicates via message passing\n          - Processes messages sequentially\n          - Can call other actors asynchronously";
          codeExample = "// Example of Motoko features
          import Array \"mo:base/Array\";
          import Option \"mo:base/Option\";
          import Result \"mo:base/Result\";

          actor MotokoFeatures {
            // Type definitions
            public type User = {
              id: Nat;
              name: Text;
              email: Text;
            };
            
            public type UserResult = Result.Result<User, Text>;
            
            // Stable storage
            private stable var users: [User] = [];
            private stable var nextId: Nat = 1;
            
            // Pattern matching with switch
            public func processUser(userId: ?Nat) : async Text {
              switch (userId) {
                case null { \"No user ID provided\" };
                case (?id) {
                  if (id > 0) {
                    \"Processing user: \" # Nat.toText(id)
                  } else {
                    \"Invalid user ID\"
                  }
                };
              }
            };
            
            // Higher-order functions
            public query func getUserNames() : async [Text] {
              Array.map<User, Text>(users, func(user) = user.name)
            };
            
            // Result type for error handling
            public func addUser(name: Text, email: Text) : async UserResult {
              if (name == \"\") {
                return #err(\"Name cannot be empty\");
              };
              
              let newUser: User = {
                id = nextId;
                name = name;
                email = email;
              };
              
              users := Array.append(users, [newUser]);
              nextId += 1;
              #ok(newUser)
            };
            
            // Array operations
            public query func findUser(userId: Nat) : async ?User {
              Array.find<User>(users, func(user) = user.id == userId)
            };
          };";
        }
      ];
    },
    {
  courseId = 4;
  modules = [
    {
      moduleId = 1;
      title = "Module 1: Introduction to Web3 Frontend Development";
      content = "
In this module, we will explore the role of frontend development in the context of Web3 applications. A Web3 frontend is responsible for creating the user interface (UI) that allows users to interact with smart contracts deployed on the blockchain. Unlike traditional web apps that talk to centralized servers, Web3 frontends communicate directly with blockchain nodes through libraries like ethers.js.

Key Concepts:
1. **DApps (Decentralized Applications)** – Frontend apps that interact with smart contracts.
2. **Ethers.js** – A lightweight JavaScript library for interacting with the Ethereum blockchain.
3. **React** – A popular frontend library for building dynamic user interfaces.
4. **Wallets (e.g., MetaMask)** – Used to authenticate users and sign blockchain transactions.
5. **Provider and Signer** – Core concepts in ethers.js to read and write data to the blockchain.

By the end of this module, you will understand how Web3 frontends differ from traditional apps and why ethers.js is a preferred tool for building Ethereum-based applications.
";
      codeExample = "
// Installing ethers.js
npm install ethers

// Basic ethers.js usage
import { ethers } from 'ethers';

// Connect to Ethereum mainnet
const provider = new ethers.providers.InfuraProvider('homestead', {
  projectId: 'your-infura-id',
  projectSecret: 'your-infura-secret'
});

// Read latest block
async function getBlock() {
  const block = await provider.getBlockNumber();
  console.log('Current block:', block);
}
getBlock();
";
    },
    {
      moduleId = 2;
      title = "Module 2: Connecting Wallets with MetaMask and ethers.js";
      content = "
In this module, we will learn how to connect a Web3 frontend with a crypto wallet like MetaMask using ethers.js. Wallets are the bridge between users and blockchain applications, enabling users to sign messages and transactions securely.

Steps:
1. **Detect MetaMask** – Check if the browser has the Ethereum provider.
2. **Request Accounts** – Ask the user to connect their wallet.
3. **Create Provider and Signer** – Use ethers.js to access blockchain data and sign transactions.
4. **Handle Account Changes** – Update the app when the user switches accounts or networks.

This flow is critical because without connecting a wallet, your DApp cannot know the user's address or let them interact with smart contracts.
";
      codeExample = "
// Connect MetaMask with ethers.js
import { ethers } from 'ethers';

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected account:', accounts[0]);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      console.log('Signer address:', await signer.getAddress());
      return { provider, signer };
    } catch (error) {
      console.error('User rejected connection:', error);
    }
  } else {
    alert('MetaMask is not installed!');
  }
}
";
    },
    {
      moduleId = 3;
      title = "Module 3: Building a DApp with React + ethers.js";
      content = "
In this module, we will put everything together by building a simple DApp frontend using React and ethers.js. The DApp will allow users to connect their wallet, read data from a smart contract, and write transactions.

Main Features:
1. **React Hooks for Wallet State** – Manage wallet connection state with useState and useEffect.
2. **Reading Contract Data** – Call read-only functions (view/pure) using ethers.js.
3. **Writing Transactions** – Send signed transactions from the user's wallet.
4. **UI Integration** – Build a simple UI with buttons for connecting wallet and interacting with the contract.
";
      codeExample = "
// React component for a simple DApp
import React, { useState } from 'react';
import { ethers } from 'ethers';
import MyContractABI from './MyContract.json';

const CONTRACT_ADDRESS = '0x1234...';

function DApp() {
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState('');

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    }
  }

  async function readMessage() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, MyContractABI, provider);
    const msg = await contract.message();
    setMessage(msg);
  }

  async function updateMessage(newMsg) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, MyContractABI, signer);
    const tx = await contract.updateMessage(newMsg);
    await tx.wait();
    alert('Message updated!');
  }

  return (
    <div>
      <h1>My DApp</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected as {account}</p>
      )}
      <button onClick={readMessage}>Read Message</button>
      <p>Message: {message}</p>
      <button onClick={() => updateMessage('Hello Web3!')}>Update Message</button>
    </div>
  );
}

export default DApp;
";
        }
      ];
    },

    // Course 5: DeFi Protocols & Yield Farming
{
  courseId = 5;
  modules = [
    {
      moduleId = 1;
      title = "Introduction to DeFi: Building Blocks and Risk Landscape";
      content = "Decentralized Finance (DeFi) refers to a suite of financial services built on top of public blockchains—primarily Ethereum—that operate without centralized intermediaries. Instead of banks and brokerages, DeFi protocols rely on smart contracts—autonomous programs that hold funds, define rules, and enforce outcomes transparently on-chain.\n\nIn this module, you will map the core building blocks of DeFi and how they interconnect:\n- **AMMs (Automated Market Makers)**: On-chain exchanges (e.g., constant-product x*y=k) where users trade against liquidity pools instead of order books. Prices emerge algorithmically from pool balances, and trades incur slippage depending on trade size vs. pool depth.\n- **Lending/Borrowing**: Overcollateralized money markets (e.g., supply assets to earn interest, use collateral to borrow). Key parameters include utilization, interest rate curves, collateral factors (LTV), and liquidation thresholds.\n- **Stablecoins & Oracles**: Price-stable assets (fiat-backed or crypto-collateralized) and trusted data feeds that inject off-chain prices on-chain—both are critical for lending and margin systems.\n- **Yield Aggregation**: Strategies that route capital to the highest-yield opportunities (staking, lending, LP farming), sometimes auto-compounding rewards.\n\nWe will also examine the **risk landscape**:\n- **Smart contract risk** (bugs, upgrade controls, admin keys), **market risk** (volatility, depegs), **liquidity risk** (thin pools), **oracle risk** (manipulation/outage), and **governance risk** (malicious proposals). Understanding these risks is non-negotiable before allocating capital.\n\nBy the end, you’ll be able to identify the role each primitive plays in a DeFi stack and articulate risks vs. rewards for different protocol categories.";
      codeExample = "// Minimal ERC-20 allowance flow before interacting with DeFi protocols\n// (Example in Solidity-like pseudocode for clarity)\n// 1) User approves protocol/spender to move tokens on their behalf.\n// 2) Protocol pulls tokens via transferFrom.\n\n// IERC20(token).approve(spender, amount);\n// Later: protocol calls IERC20(token).transferFrom(user, address(this), amount);\n\n// Ethers.js snippet to set allowance\n// import { ethers } from \"ethers\";\n// const erc20 = new ethers.Contract(tokenAddress, erc20Abi, signer);\n// const tx = await erc20.approve(spenderAddress, amount);\n// await tx.wait();\n// console.log(\"Approved!\";";
    },
    {
      moduleId = 2;
      title = "Liquidity Pools & AMMs: Pricing, Slippage, and Impermanent Loss";
      content = "AMMs price assets using deterministic curves. The classic **constant-product** AMM (Uniswap v2 model) keeps reserves R_x and R_y such that R_x * R_y = k. A trade that removes one asset must add enough of the other so that k remains constant after fees. The larger the trade relative to pool size, the more the price moves, producing **slippage**.\n\n**Pool Health & Depth**: Deeper pools absorb bigger orders with lower slippage. LPs (liquidity providers) deposit token pairs and earn swap fees proportional to their share of the pool. However, LPs face **impermanent loss (IL)**—the value difference between holding tokens vs. providing them as liquidity—when relative prices change.\n\n**Impermanent Loss Intuition**: If one asset appreciates relative to the other, the AMM rebalances your position into more of the underperforming asset and less of the outperforming one. Fees can offset IL, but not always. Protocol variants (concentrated liquidity, stableswap curves) optimize for different markets.\n\n**Security Considerations**: Watch for sandwich attacks around large trades; use slippage limits; for frontends, show an expected price, minimum received, and price impact. Always disclose fee tiers and the effect of pool depth on execution.\n\nBy the end, you will be able to calculate rough slippage, reason about IL qualitatively, and communicate trade-offs to users and LPs.";
      codeExample = "// Quick JS utilities for slippage and rough impermanent loss estimates\n// (Educational only; ignores fees and exact curve details)\n\n// Estimated output for constant-product swap (no fee)\n// dx of tokenX into pool with reserves Rx, Ry -> get dy of tokenY\n// dy = Ry - (k / (Rx + dx)) where k = Rx * Ry\nfunction swapOutNoFee(Rx, Ry, dx) {\n  const k = Rx * Ry;\n  const newRx = Rx + dx;\n  const newRy = k / newRx;\n  const dy = Ry - newRy;\n  return dy;\n}\n\n// Simple impermanent loss approximation when price changes by ratio p = newPrice/oldPrice\n// IL% ≈ 2*sqrt(p)/(1+p) - 1 (returns negative value; absolute for magnitude)\nfunction impermanentLossPercent(p) {\n  const il = (2 * Math.sqrt(p)) / (1 + p) - 1;\n  return il * 100; // percentage\n}\n\nconsole.log(\"dy:\", swapOutNoFee(100000, 100000, 1000));\nconsole.log(\"IL% at 2x price move:\", impermanentLossPercent(2).toFixed(2));";
    },
    {
      moduleId = 3;
      title = "Yield Farming & Staking: Rewards, Compounding, and Risks";
      content = "Yield farming routes capital into protocols that emit incentives (governance tokens) on top of base yields (swap fees, interest). Typical flows:\n1) Provide liquidity to an AMM pool and receive **LP tokens**.\n2) **Stake LP tokens** in a farming contract to earn rewards.\n3) Optionally auto-compound: harvest rewards, swap a portion to underlying pair, add liquidity, and restake.\n\n**Key Variables**: APR vs. APY (simple vs. compounded returns), reward schedules (emissions per block/second), lock-ups/penalties, and tokenomics (supply, vesting, buybacks). Sustainable yields usually come from real fees or borrowing demand; purely inflationary yields are fragile.\n\n**Major Risks**: Contract exploit risk, IL, reward token price collapse, rugpull governance powers, and oracle manipulations in leveraged strategies. Follow best practices: read audits, limit exposure, diversify, and prefer immutable or time-locked admin controls.\n\nYou will finish this module able to evaluate farming opportunities, factor in IL and reward volatility, and design safer UX flows (approval, stake, harvest, exit).";
      codeExample = "// Simplified staking interface (Solidity-like pseudocode)\n// Users stake LP tokens, earn reward tokens over time.\n\n// interface IERC20 { function transferFrom(address from,address to,uint256) external returns (bool); function transfer(address to,uint256) external returns (bool); function approve(address spender,uint256) external returns (bool); function balanceOf(address) external view returns (uint256); }\n// contract Farm {\n//   IERC20 public lp;\n//   IERC20 public reward;\n//   uint256 public rewardRate; // tokens per second\n//   mapping(address => uint256) public stake;\n//   mapping(address => uint256) public last;\n//   mapping(address => uint256) public accrued;\n//   function deposit(uint256 amount) external { lp.transferFrom(msg.sender, address(this), amount); _accumulate(msg.sender); stake[msg.sender]+=amount; }\n//   function withdraw(uint256 amount) external { _accumulate(msg.sender); stake[msg.sender]-=amount; lp.transfer(msg.sender, amount); }\n//   function harvest() external { _accumulate(msg.sender); uint256 r=accrued[msg.sender]; accrued[msg.sender]=0; reward.transfer(msg.sender, r); }\n//   function _accumulate(address u) internal { uint256 dt=block.timestamp-(last[u]==0?block.timestamp:last[u]); if(dt>0){ accrued[u]+=dt*rewardRate*stake[u]/1e18; last[u]=block.timestamp; } }\n// }\n";
    }
  ];
},

// Course 6: NFT Marketplace Development
{
  courseId = 6;
  modules = [
    {
      moduleId = 1;
      title = "ERC-721/1155 Fundamentals, Metadata, and Creator Royalties";
      content = "Non-Fungible Tokens (NFTs) represent unique digital items on-chain. The most common standards are **ERC-721** (1:1 unique tokens) and **ERC-1155** (multi-token standard supporting both fungible and non-fungible types). Understanding token identifiers, ownership, approvals, and safe transfer rules is essential for marketplaces.\n\n**Metadata**: NFTs reference off-chain JSON metadata via a **tokenURI** (ERC-721) or baseURI with IDs (ERC-1155). The metadata typically includes name, description, image (IPFS/Arweave), and attributes. Good practice: immutable or content-addressed URIs to preserve integrity.\n\n**Royalties**: On-chain royalty hints (e.g., EIP-2981) standardize how marketplaces discover creator royalty info. Enforcement varies by marketplace; your UI should disclose royalties, fees, and total consideration at checkout.\n\nSecurity notes: Implement safe transfer checks, guard against reentrancy in marketplace flows, and validate that token contracts conform to the expected standard behaviors.";
      codeExample = "// Minimal ERC-721 (OpenZeppelin-style API shown for familiarity)\n// pragma solidity ^0.8.0;\n// import \"@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol\";\n// contract MyNFT is ERC721URIStorage {\n//   uint256 public nextId;\n//   constructor() ERC721(\"MyNFT\",\"MNFT\") {}\n//   function mint(address to, string memory uri) external {\n//     uint256 id = ++nextId;\n//     _mint(to, id);\n//     _setTokenURI(id, uri);\n//   }\n// }\n";
    },
    {
      moduleId = 2;
      title = "Minting Pipelines: Storage, Pinning, and On-Chain Transactions";
      content = "An NFT mint pipeline typically includes: (1) generating media and metadata; (2) pinning to decentralized storage (IPFS/Arweave); (3) minting a token that references the immutable content hash; (4) verifying the result in a block explorer.\n\n**Storage Strategy**: Prefer content-addressed URIs (ipfs://CID). Consider gateways only for display. For dynamic NFTs, store a base URI that your backend can update—clearly communicate upgradeability.\n\n**Frontend Flow**: Connect wallet, collect metadata from a form, upload to IPFS (via a pinning service SDK), then call the NFT contract’s mint function. Display progress (uploading, pending tx, confirmations) and surface errors clearly with retry guidance.\n\nBy mastering this pipeline, you can build reliable mint experiences with strong integrity guarantees for media and metadata.";
      codeExample = "// Ethers.js mint call after uploading metadata to IPFS\n// import { ethers } from \"ethers\";\n// const nft = new ethers.Contract(nftAddress, nftAbi, signer);\n// const metadataUri = \"ipfs://bafy.../metadata.json\";\n// const tx = await nft.mint(await signer.getAddress(), metadataUri);\n// console.log(\"tx:\", tx.hash);\n// await tx.wait();\n// console.log(\"Mint confirmed\");";
    },
    {
      moduleId = 3;
      title = "Marketplace Design: Listings, Bids, Escrow, and Security";
      content = "A marketplace coordinates **listings** (asks), **offers** (bids), and settlement while ensuring the NFT and payment tokens change hands atomically. Common designs:\n- **Escrow Listings**: Seller transfers the NFT to the marketplace contract; buyer pays the price, contract transfers NFT + funds with fees/royalties.\n- **Permit/Approval Listings**: Seller keeps NFT, marketplace has approval to transfer upon sale; improves UX but requires careful checks at purchase time.\n\n**Security & UX**:\n- Prevent **reentrancy** around transfers and payouts; verify ownership & approvals at execution; validate order expiry and nonces to prevent replay.\n- Display total consideration (price + fee + royalty). For bids, show min out after fees.\n- Consider pausable controls and upgrade safety.\n\nWe’ll build a minimal listing flow and discuss how to add royalties and protocol fees safely.";
      codeExample = "// Simplified escrow-style buy (Solidity-like pseudocode; omit royalty logic for brevity)\n// contract SimpleMarket {\n//   struct Listing { address seller; address token; uint256 id; uint256 price; bool active; }\n//   mapping(uint256 => Listing) public listings; uint256 public next;\n//   function list(address token, uint256 id, uint256 price) external {\n//     // require ownership then escrow NFT into contract\n//     IERC721(token).transferFrom(msg.sender, address(this), id);\n//     listings[++next] = Listing(msg.sender, token, id, price, true);\n//   }\n//   function buy(uint256 lid) external payable {\n//     Listing storage L = listings[lid]; require(L.active, \"inactive\"); require(msg.value == L.price, \"price\");\n//     L.active = false; // effects first\n//     payable(L.seller).transfer(msg.value); // payout (fees/royalties omitted)\n//     IERC721(L.token).transferFrom(address(this), msg.sender, L.id); // interaction last\n//   }\n// }\n";
    }
  ];
},

// Course 7: Rust Programming for Web3
{
  courseId = 7;
  modules = [
    {
      moduleId = 1;
      title = "Rust Essentials for Blockchain: Ownership, Borrowing, and Safety";
      content = "Rust’s memory model—**ownership**, **borrowing**, and **lifetimes**—prevents entire classes of bugs at compile time (use-after-free, data races). This is uniquely valuable for blockchain programs where correctness and performance are paramount. You’ll learn:\n- **Ownership**: Each value has a single owner; moving transfers ownership; dropping frees resources.\n- **Borrowing**: References (&T, &mut T) let you read or mutate without transferring ownership while the borrow checker enforces aliasing rules.\n- **Error Handling**: Result<T,E> and the ? operator encourage explicit, recoverable errors instead of panics.\n\nWe’ll also cover crate management with Cargo, testing patterns, and no_std considerations for constrained environments.\n\nBy the end, you’ll be comfortable reading idiomatic Rust and understanding why it’s favored for high-performance on-chain programs.";
      codeExample = "// Ownership & borrowing example\nfn main() {\n    let s = String::from(\"hello\");\n    takes_ownership(s); // s moved; cannot use s afterwards\n    let x = 5;\n    makes_copy(x); // i32 is Copy; x still usable\n\n    let mut t = String::from(\"hi\");\n    borrow_mut(&mut t);\n    println!(\"{}\", t);\n}\n\nfn takes_ownership(a: String) { println!(\"{}\", a); }\nfn makes_copy(b: i32) { println!(\"{}\", b); }\nfn borrow_mut(c: &mut String) { c.push_str(\" rust!\"); }";
    },
    {
      moduleId = 2;
      title = "Solana Accounts, PDAs, and Anchor Basics";
      content = "On Solana, programs are stateless code; **accounts** hold data. You’ll learn how to model program state with accounts, derive **PDAs (Program Derived Addresses)** for deterministic program-owned accounts, and use **Anchor** to reduce boilerplate.\n\n**Anchor Concepts**: `#[program]` defines entrypoints; `#[derive(Accounts)]` validates account relationships at runtime; `#[account]` types define serialized data with space constraints. Security involves checking signers, ownership, rent exemption, and seeds for PDA derivations.\n\nWe’ll sketch a simple \"hello\" program that initializes and updates an account value, highlighting CPI (cross-program invocation) considerations and client invocation via IDL.";
      codeExample = "// Anchor skeleton\n// use anchor_lang::prelude::*;\n// declare_id!(\"11111111111111111111111111111111\");\n// #[program]\n// pub mod hello_anchor {\n//   use super::*;\n//   pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n//     ctx.accounts.data.msg = \"hello\".to_string();\n//     Ok(())\n//   }\n// }\n// #[derive(Accounts)]\n// pub struct Initialize<'info> { #[account(init, payer = user, space = 8 + 32)] pub data: Account<'info, Data>, #[account(mut)] pub user: Signer<'info>, pub system_program: Program<'info, System>, }\n// #[account]\n// pub struct Data { pub msg: String }";
    },
    {
      moduleId = 3;
      title = "Local Testing and Devnet Deployment Workflow";
      content = "A productive loop is essential: write program → test locally → deploy to **devnet** → integrate with a client. Steps:\n1) **Local**: Use `anchor test` for unit/integration tests; mock signers; assert account state.\n2) **Devnet**: Configure Solana CLI, create a keypair, airdrop SOL, and `anchor deploy`. Keep program IDs consistent between client and on-chain.\n3) **Client**: Use @project-serum/anchor or web3.js to invoke instructions; verify logs in explorers.\n\nBest practices: pin toolchain versions, review compute unit usage, and add IDL checks in CI. Handle account size upgrades via new accounts + migration, not in-place overwrites.";
      codeExample = "// Common commands (bash)\n// solana-keygen new --outfile ~/.config/solana/devnet.json\n// solana config set --url https://api.devnet.solana.com\n// solana airdrop 2\n// anchor build\n// anchor deploy\n// anchor test";
    }
  ];
},
// Course 8: DAO Governance & Tokenomics
{
  courseId = 8;
  modules = [
    {
      moduleId = 1;
      title = "DAO Fundamentals: Structures, Voting Models, and Treasuries";
      content = "A Decentralized Autonomous Organization (DAO) coordinates resources via on-chain rules and token-holder decisions. Core elements:\n- **Governance Token**: Represents voting power; may be transferable or non-transferable (soulbound) in some models.\n- **Proposals & Voting**: Token-weighted voting, quadratic voting, delegated voting, or council-based multisigs; each has trade-offs between plutocracy and agility.\n- **Treasury**: On-chain funds governed by proposals; often with spending guards, streaming payments, and emergency pauses.\n\nOperational concerns include proposal thresholds, quorum, execution delays (timelocks), delegated voting UX, and off-chain signaling (Snapshot) synced with on-chain execution. We’ll compare architectures and discuss progressive decentralization timelines.";
      codeExample = "// Minimal ERC-20 governance token (pseudocode)\n// pragma solidity ^0.8.0;\n// import \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n// contract GovToken is ERC20 { constructor() ERC20(\"Gov\",\"GOV\") { _mint(msg.sender, 1_000_000e18); } }\n// // Delegate voting power patterns often extend ERC20Votes with checkpoints.";
    },
    {
      moduleId = 2;
      title = "Proposals, Quorum, and Execution: A Minimal Governance Flow";
      content = "A governance system generally follows: **proposal → voting → queue → execution**. Parameters:\n- **Proposal Threshold**: Minimum voting power to create a proposal.\n- **Quorum**: Minimum participation for validity.\n- **Voting Period**: Duration to vote (block/time-based).\n- **Execution Delay**: Timelock between passing and execution.\n\nSecurity: prevent double-execution, ensure proposal integrity (hash of calldata/targets), guard against malicious upgrades, and use emergency stops. Frontends should surface state clearly (active, succeeded, queued, executed, canceled) and show vote breakdowns with delegates.";
      codeExample = "// Extremely simplified proposal + vote (Solidity-like pseudocode)\n// contract MiniGov {\n//   struct Proposal { address target; bytes data; uint256 end; uint256 forVotes; uint256 againstVotes; bool executed; }\n//   mapping(uint256=>Proposal) public props; uint256 public next; mapping(address=>uint256) public votingPower;\n//   function propose(address t, bytes calldata d, uint256 period) external returns (uint256 id){ require(votingPower[msg.sender]>0, \"no power\"); id=++next; props[id]=Proposal(t,d,block.timestamp+period,0,0,false); }\n//   function vote(uint256 id, bool support, uint256 weight) external { require(block.timestamp<props[id].end, \"ended\"); require(votingPower[msg.sender]>=weight, \"insufficient\"); if(support){props[id].forVotes+=weight;}else{props[id].againstVotes+=weight;} }\n//   function execute(uint256 id) external { Proposal storage p=props[id]; require(!p.executed && block.timestamp>=p.end && p.forVotes>p.againstVotes, \"fail\"); p.executed=true; (bool ok,) = p.target.call(p.data); require(ok, \"exec\"); }\n// }\n";
    },
    {
      moduleId = 3;
      title = "Tokenomics Design: Emissions, Vesting, and Incentive Alignment";
      content = "Tokenomics aligns contributors, users, and the treasury over time. Key levers:\n- **Supply & Emissions**: Fixed vs. inflationary; halvenings/decay schedules; emissions tied to protocol usage (e.g., fee rebates, staking rewards).\n- **Distribution**: Community, core team, investors, ecosystem funds; communicate cliffs and vesting to avoid supply shocks.\n- **Utility**: Governance, fee discounts, staking for security, or access.\n\n**Vesting & Locks**: Linear vesting streams with cliffs reduce dump incentives; staking or lock-ups can amplify governance weight (vote-escrowed models). Design with transparency: publish schedules and dashboards.\n\nYou’ll learn to translate economic goals into concrete parameters and simulate their impact on circulating supply and incentives.";
      codeExample = "// Linear vesting (pseudocode)\n// struct Grant { uint256 total; uint64 start; uint64 cliff; uint64 end; uint256 claimed; }\n// function vested(Grant memory g, uint64 t) pure returns(uint256){ if(t<g.cliff) return 0; if(t>=g.end) return g.total; uint256 dur=g.end-g.start; uint256 elapsed=t-g.start; return g.total*elapsed/dur; }\n// function claim() external { uint256 v=vested(grant[msg.sender], uint64(block.timestamp)); uint256 releasable=v-grant[msg.sender].claimed; grant[msg.sender].claimed=v; token.transfer(msg.sender, releasable); }\n";
    }
  ];
},

// Course 9: Cryptocurrency Trading & Analysis
{
  courseId = 9;
  modules = [
    {
      moduleId = 1;
      title = "Market Microstructure, Order Types, and Exchange Mechanics";
      content = "Crypto markets operate 24/7 across spot and derivatives venues. Understanding **order types** (market, limit, stop, stop-limit), **maker/taker fees**, funding rates (perps), and liquidation mechanics is essential.\n\n**Slippage & Liquidity**: Market orders cross the spread and may slip in illiquid books; large orders should be sliced or executed via limit orders. Track depth and spreads; for perps, monitor funding as a carry cost.\n\n**Position Sizing**: Professional risk management starts with fixed fractional risk per trade (e.g., 1%). Define invalidation (stop), compute position size backward from entry/stop distance, and never move stops wider after entry.\n\nYou will learn to translate a thesis into a structured order plan with clear invalidation, targets, and risk controls.";
      codeExample = "// Position sizing helper (JS)\n// risk% of equity per trade given entry, stop, and equity.\nfunction positionSize(equity, riskPct, entry, stop) {\n  const riskAmount = equity * riskPct;\n  const perUnitRisk = Math.abs(entry - stop);\n  return perUnitRisk === 0 ? 0 : Math.floor(riskAmount / perUnitRisk);\n}\nconsole.log(positionSize(10000, 0.01, 25000, 24500)); // units/contracts";
    },
    {
      moduleId = 2;
      title = "Technical Analysis: Trends, Momentum, and Market Structure";
      content = "Technical analysis helps frame **trend**, **momentum**, and **structure**. Focus on:\n- **Market Structure**: HH/HL (uptrend) vs. LH/LL (downtrend), break of structure (BOS), and key swing points.\n- **Momentum**: Moving averages (EMA/SMA), RSI, MACD to gauge strength/weakness; confluence beats single-indicator reliance.\n- **Levels**: Support/resistance, supply/demand zones; always plan entries with invalidation near levels to minimize risk.\n\nAvoid curve fitting; test ideas across assets/timeframes. Document setups with screenshots and post-trade notes to improve your edge over time.";
      codeExample = "// Simple EMA & RSI calculators (JS; educational only)\nfunction ema(values, period){ const k = 2/(period+1); let e = values[0]; for(let i=1;i<values.length;i++){ e = values[i]*k + e*(1-k);} return e; }\nfunction rsi(values, period){ let gains=0, losses=0; for(let i=1;i<=period;i++){ const d=values[i]-values[i-1]; if(d>0) gains+=d; else losses-=d; } let rs=gains/(losses||1); for(let i=period+1;i<values.length;i++){ const d=values[i]-values[i-1]; const g=d>0?d:0, l=d<0?-d:0; gains=(gains*(period-1)+g)/period; losses=(losses*(period-1)+l)/period; rs=gains/(losses||1);} return 100 - (100/(1+rs)); }\nconsole.log(\"EMA(20):\", ema([1,2,3,4,5,6,7,8,9,10], 5));";
    },
    {
      moduleId = 3;
      title = "Risk Management, Journaling, and Strategy Execution";
      content = "Consistent trading hinges on **process**. Core pillars:\n- **Risk Rules**: Max risk per trade/day, daily loss limits, and time-out rules to prevent tilt.\n- **Playbook**: Define 2–3 high-probability setups (e.g., trend pullback, range breakout, failed breakout) with precise entry/stop/target criteria.\n- **Journaling**: Log thesis, screenshots, execution quality, emotions, and post-trade review. Tag mistakes (late entry, chasing, moving stops) and track metrics (win rate, avg R, expectancy).\n\n**Beware Leverage**: Treat leverage as a tool to adjust notional, not to increase risk. Your risk should be defined by distance to invalidation and fixed fractional rules, not by margin availability.\n\nBy the end, you’ll have a risk framework and journaling structure you can implement immediately.";
      codeExample = "// Minimal trade plan template (YAML-like)\n// setup: trend_pullback\n// thesis: price above 200EMA, pullback to prior resistance -> support\n// entry: 25200\n// stop: 24880 (invalidates HH/HL structure)\n// target: 25900 (RR ~ 2.5:1)\n// risk: 1% of equity\n// notes: wait for momentum reclaim on 5m before entry\n";
        }
      ];
    }
  ];
};