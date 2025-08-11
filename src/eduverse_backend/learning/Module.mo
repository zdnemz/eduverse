import Types "../Types";

module {

  // Complete Course Contents for 9 Web3 Courses
  public let courseContents : [Types.CourseContent] = [
    
    // Course 1: Blockchain Fundamentals & Ethereum
    {
      courseId = 1;
      modules = [
        {
          id = 1;
          title = "Blockchain Basics";
          description = "Core blockchain concepts";
          estimatedTime = "2 hours";
          prerequisites = [];
          isLocked = false;
          lessons = [
            {
              id = 1;
              title = "What is Blockchain?";
              content = {
                summary = "Distributed ledger technology basics";
                keyPoints = ["Decentralized network", "Immutable records", "Consensus"];
                detailedContent = "Blockchain is a distributed ledger that records transactions across multiple computers. Each block contains transaction data, timestamp, and cryptographic hash.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=hYip_Vuv8J0";
              duration = "15 minutes";
              lessonType = #Video;
              resources = ["https://bitcoin.org/bitcoin.pdf"];
              isCompleted = false;
            },
            {
              id = 2;
              title = "Ethereum Introduction";
              content = {
                summary = "Ethereum as programmable blockchain";
                keyPoints = ["Smart contracts", "EVM", "Gas fees"];
                detailedContent = "Ethereum enables smart contracts - self-executing contracts with terms written in code. Gas fees pay for computation.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=IsXvoYeJxKA";
              duration = "20 minutes";
              lessonType = #CodeLab;
              resources = ["https://ethereum.org/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 1;
              question = "What makes blockchain secure?";
              options = ["Central authority", "Cryptographic hashing", "Fast speed", "Low cost"];
              correctAnswerIndex = 1;
              explanation = "Cryptographic hashing ensures data integrity and security.";
              difficulty = #Beginner;
              timeLimit = ?60;
            },
            {
              id = 2;
              question = "What is a key feature of blockchain?";
              options = ["Centralized control", "Immutable records", "High energy usage", "Complex setup"];
              correctAnswerIndex = 1;
              explanation = "Blockchain records cannot be altered once confirmed, ensuring data integrity.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 3;
              question = "What does EVM stand for?";
              options = ["Ethereum Virtual Machine", "Electronic Voting Method", "Enhanced Value Model", "Encrypted Verification Mode"];
              correctAnswerIndex = 0;
              explanation = "EVM is the runtime environment for smart contracts on Ethereum.";
              difficulty = #Beginner;
              timeLimit = ?60;
            },
            {
              id = 4;
              question = "What are gas fees used for?";
              options = ["Buying cryptocurrency", "Paying for computation", "Mining rewards", "Network maintenance"];
              correctAnswerIndex = 1;
              explanation = "Gas fees compensate miners/validators for processing transactions.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            },
            {
              id = 5;
              question = "What consensus mechanism did Ethereum switch to?";
              options = ["Proof of Work", "Proof of Stake", "Proof of Authority", "Delegated Proof of Stake"];
              correctAnswerIndex = 1;
              explanation = "Ethereum transitioned from PoW to PoS in 2022 for energy efficiency.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            }
          ];
        }
      ];
    },

    // Course 2: Solidity Smart Contract Development
    {
      courseId = 2;
      modules = [
        {
          id = 2;
          title = "Solidity Programming";
          description = "Smart contract development";
          estimatedTime = "3 hours";
          prerequisites = ["Blockchain Basics"];
          isLocked = false;
          lessons = [
            {
              id = 3;
              title = "Solidity Syntax";
              content = {
                summary = "Basic Solidity programming";
                keyPoints = ["Variables", "Functions", "Modifiers"];
                detailedContent = "Solidity is a contract-oriented language. Variables store data, functions define behavior, modifiers control access.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=fNMfMxGxeag";
              duration = "25 minutes";
              lessonType = #CodeLab;
              resources = ["https://docs.soliditylang.org/"];
              isCompleted = false;
            },
            {
              id = 4;
              title = "Contract Security";
              content = {
                summary = "Common security patterns";
                keyPoints = ["Reentrancy", "Access control", "Input validation"];
                detailedContent = "Security is critical in smart contracts. Use require statements, avoid reentrancy attacks, implement proper access control.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=4Mm3BCyHtDY";
              duration = "30 minutes";
              lessonType = #CodeLab;
              resources = ["https://consensys.github.io/smart-contract-best-practices/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 6;
              question = "What is msg.sender in Solidity?";
              options = ["Contract address", "Function caller", "Block miner", "Gas price"];
              correctAnswerIndex = 1;
              explanation = "msg.sender is the address that called the current function.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            },
            {
              id = 7;
              question = "What is a modifier in Solidity?";
              options = ["A variable type", "A function decorator", "A data structure", "A compiler setting"];
              correctAnswerIndex = 1;
              explanation = "Modifiers are used to change function behavior, often for access control.";
              difficulty = #Beginner;
              timeLimit = ?60;
            },
            {
              id = 8;
              question = "What is reentrancy attack?";
              options = ["Network spam", "Recursive function calls", "Gas optimization", "Variable overflow"];
              correctAnswerIndex = 1;
              explanation = "Reentrancy occurs when external calls allow malicious recursive execution.";
              difficulty = #Advanced;
              timeLimit = ?90;
            },
            {
              id = 9;
              question = "What does 'require' statement do?";
              options = ["Import libraries", "Validate conditions", "Deploy contracts", "Calculate gas"];
              correctAnswerIndex = 1;
              explanation = "Require validates conditions and reverts if false, used for input validation.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            },
            {
              id = 10;
              question = "What is mapping in Solidity?";
              options = ["Array type", "Key-value storage", "Function type", "Event type"];
              correctAnswerIndex = 1;
              explanation = "Mapping is a hash table that stores key-value pairs efficiently.";
              difficulty = #Beginner;
              timeLimit = ?60;
            }
          ];
        }
      ];
    },

    // Course 3: Internet Computer (ICP) Development
    {
      courseId = 3;
      modules = [
        {
          id = 3;
          title = "ICP Development";
          description = "Building on Internet Computer";
          estimatedTime = "4 hours";
          prerequisites = ["Blockchain Basics"];
          isLocked = false;
          lessons = [
            {
              id = 5;
              title = "Motoko Basics";
              content = {
                summary = "Programming in Motoko";
                keyPoints = ["Actor model", "Canister", "Cycles"];
                detailedContent = "Motoko is ICP's native language. Actors are autonomous objects, canisters are smart contracts, cycles pay for computation.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=XQ_5N3nZtko";
              duration = "35 minutes";
              lessonType = #CodeLab;
              resources = ["https://internetcomputer.org/docs/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 11;
              question = "What are cycles in ICP?";
              options = ["Time periods", "Computation fuel", "User accounts", "Network nodes"];
              correctAnswerIndex = 1;
              explanation = "Cycles are used to pay for computational resources on ICP.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 12;
              question = "What is a canister in ICP?";
              options = ["Storage container", "Smart contract", "Network protocol", "User interface"];
              correctAnswerIndex = 1;
              explanation = "Canisters are ICP's equivalent to smart contracts, containing code and state.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 13;
              question = "What programming language is native to ICP?";
              options = ["Rust", "Solidity", "Motoko", "JavaScript"];
              correctAnswerIndex = 2;
              explanation = "Motoko is designed specifically for ICP development by DFINITY.";
              difficulty = #Beginner;
              timeLimit = ?30;
            },
            {
              id = 14;
              question = "What is the actor model in Motoko?";
              options = ["Database design", "Concurrency model", "UI framework", "Testing method"];
              correctAnswerIndex = 1;
              explanation = "Actor model handles concurrent computation through isolated actors.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 15;
              question = "How does ICP achieve scalability?";
              options = ["Layer 2 solutions", "Subnet architecture", "Proof of Work", "Off-chain computation"];
              correctAnswerIndex = 1;
              explanation = "ICP uses subnet blockchain architecture for horizontal scaling.";
              difficulty = #Advanced;
              timeLimit = ?75;
            }
          ];
        }
      ];
    },

    // Course 4: Web3 Frontend with React & ethers.js
    {
      courseId = 4;
      modules = [
        {
          id = 4;
          title = "Web3 Frontend";
          description = "Building dApp frontends";
          estimatedTime = "3 hours";
          prerequisites = ["Solidity Programming"];
          isLocked = false;
          lessons = [
            {
              id = 6;
              title = "React + Web3";
              content = {
                summary = "Connecting React to blockchain";
                keyPoints = ["ethers.js", "Wallet connection", "Contract interaction"];
                detailedContent = "Use ethers.js to connect React apps to Ethereum. Connect wallets, read contract data, send transactions.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=a0osIaAOFSE";
              duration = "40 minutes";
              lessonType = #CodeLab;
              resources = ["https://docs.ethers.io/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 16;
              question = "What is ethers.js used for?";
              options = ["Styling", "Blockchain interaction", "Routing", "State management"];
              correctAnswerIndex = 1;
              explanation = "ethers.js is a library for interacting with Ethereum blockchain.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            },
            {
              id = 17;
              question = "What is a Web3 provider?";
              options = ["Internet service", "Blockchain connection", "Cloud storage", "UI library"];
              correctAnswerIndex = 1;
              explanation = "Provider connects your dApp to blockchain networks like Ethereum.";
              difficulty = #Beginner;
              timeLimit = ?60;
            },
            {
              id = 18;
              question = "What is MetaMask?";
              options = ["Testing framework", "Browser wallet", "Smart contract", "Mining software"];
              correctAnswerIndex = 1;
              explanation = "MetaMask is a popular browser extension wallet for Ethereum.";
              difficulty = #Beginner;
              timeLimit = ?30;
            },
            {
              id = 19;
              question = "What is ABI in Web3 development?";
              options = ["API protocol", "Contract interface", "Wallet format", "Network standard"];
              correctAnswerIndex = 1;
              explanation = "ABI defines how to interact with smart contract functions.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 20;
              question = "How do you handle async operations in React with Web3?";
              options = ["Callbacks only", "Promises and async/await", "Synchronous calls", "Event listeners only"];
              correctAnswerIndex = 1;
              explanation = "Blockchain interactions are asynchronous and use promises/async-await.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            }
          ];
        }
      ];
    },

    // Course 5: DeFi Protocols & Yield Farming
    {
      courseId = 5;
      modules = [
        {
          id = 5;
          title = "DeFi Fundamentals";
          description = "Decentralized finance basics";
          estimatedTime = "3 hours";
          prerequisites = ["Solidity Programming"];
          isLocked = false;
          lessons = [
            {
              id = 7;
              title = "DeFi Protocols";
              content = {
                summary = "Understanding DeFi ecosystem";
                keyPoints = ["AMM", "Liquidity pools", "Yield farming"];
                detailedContent = "DeFi uses automated market makers (AMMs) for trading. Users provide liquidity to earn fees. Yield farming maximizes returns.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=ClnnLI1SClA";
              duration = "30 minutes";
              lessonType = #Video;
              resources = ["https://uniswap.org/whitepaper.pdf"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 21;
              question = "What is an AMM?";
              options = ["Automated Market Maker", "Advanced Money Manager", "Asset Management Module", "Anonymous Messaging Method"];
              correctAnswerIndex = 0;
              explanation = "AMM enables decentralized trading using liquidity pools.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 22;
              question = "What is impermanent loss?";
              options = ["Permanent token loss", "Temporary price difference loss", "Staking penalty", "Transaction fee"];
              correctAnswerIndex = 1;
              explanation = "Impermanent loss occurs when token prices change after providing liquidity.";
              difficulty = #Advanced;
              timeLimit = ?90;
            },
            {
              id = 23;
              question = "What is yield farming?";
              options = ["Agricultural technology", "Maximizing DeFi returns", "Mining cryptocurrency", "Trading strategies"];
              correctAnswerIndex = 1;
              explanation = "Yield farming involves moving funds across protocols for maximum returns.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 24;
              question = "What is a liquidity pool?";
              options = ["Water reservoir", "Token pair reserve", "Mining pool", "Staking pool"];
              correctAnswerIndex = 1;
              explanation = "Liquidity pools contain token pairs that enable decentralized trading.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 25;
              question = "What is slippage in trading?";
              options = ["Price movement during trade", "Trading fee", "Network congestion", "Wallet error"];
              correctAnswerIndex = 0;
              explanation = "Slippage is the price difference between expected and actual trade execution.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            }
          ];
        }
      ];
    },

    // Course 6: NFT Marketplace Development
    {
      courseId = 6;
      modules = [
        {
          id = 6;
          title = "NFT Development";
          description = "Creating NFT marketplace";
          estimatedTime = "4 hours";
          prerequisites = ["Solidity Programming", "Web3 Frontend"];
          isLocked = false;
          lessons = [
            {
              id = 8;
              title = "ERC-721 Standard";
              content = {
                summary = "NFT token standard";
                keyPoints = ["Unique tokens", "Metadata", "Ownership"];
                detailedContent = "ERC-721 defines non-fungible tokens. Each token is unique with distinct metadata and clear ownership.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=9yuHz6g1P50";
              duration = "35 minutes";
              lessonType = #CodeLab;
              resources = ["https://eips.ethereum.org/EIPS/eip-721"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 26;
              question = "What makes NFTs unique?";
              options = ["Price", "Token ID", "Color", "Size"];
              correctAnswerIndex = 1;
              explanation = "Each NFT has a unique token ID that distinguishes it from others.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            },
            {
              id = 27;
              question = "What is ERC-721?";
              options = ["Fungible token standard", "Non-fungible token standard", "Stablecoin standard", "DeFi protocol"];
              correctAnswerIndex = 1;
              explanation = "ERC-721 is the standard for creating unique, non-fungible tokens.";
              difficulty = #Beginner;
              timeLimit = ?30;
            },
            {
              id = 28;
              question = "What is IPFS commonly used for in NFTs?";
              options = ["Token minting", "Metadata storage", "Price calculation", "Wallet connection"];
              correctAnswerIndex = 1;
              explanation = "IPFS stores NFT metadata and images in a decentralized manner.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 29;
              question = "What is a marketplace royalty?";
              options = ["Trading fee", "Creator commission", "Gas cost", "Staking reward"];
              correctAnswerIndex = 1;
              explanation = "Royalties ensure original creators earn from secondary sales.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 30;
              question = "What is the difference between ERC-721 and ERC-1155?";
              options = ["No difference", "ERC-1155 supports multiple token types", "ERC-721 is newer", "ERC-1155 is only for games"];
              correctAnswerIndex = 1;
              explanation = "ERC-1155 can handle both fungible and non-fungible tokens in one contract.";
              difficulty = #Advanced;
              timeLimit = ?75;
            }
          ];
        }
      ];
    },

    // Course 7: Rust Programming for Web3
    {
      courseId = 7;
      modules = [
        {
          id = 7;
          title = "Rust for Web3";
          description = "Rust programming fundamentals";
          estimatedTime = "5 hours";
          prerequisites = [];
          isLocked = false;
          lessons = [
            {
              id = 9;
              title = "Rust Basics";
              content = {
                summary = "Core Rust concepts";
                keyPoints = ["Ownership", "Memory safety", "Performance"];
                detailedContent = "Rust ensures memory safety without garbage collection. Ownership system prevents common bugs like null pointers.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=zF34dRivLOw";
              duration = "45 minutes";
              lessonType = #CodeLab;
              resources = ["https://doc.rust-lang.org/book/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 31;
              question = "What is Rust's ownership system for?";
              options = ["Speed", "Memory safety", "Syntax", "Compilation"];
              correctAnswerIndex = 1;
              explanation = "Ownership prevents memory bugs like use-after-free and double-free.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 32;
              question = "What happens when a variable goes out of scope in Rust?";
              options = ["Nothing", "Automatic cleanup", "Memory leak", "Compilation error"];
              correctAnswerIndex = 1;
              explanation = "Rust automatically calls the drop function to clean up resources.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 33;
              question = "What is borrowing in Rust?";
              options = ["Taking ownership", "Temporary access", "Memory allocation", "Error handling"];
              correctAnswerIndex = 1;
              explanation = "Borrowing allows temporary access to data without taking ownership.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 34;
              question = "What is a trait in Rust?";
              options = ["Variable type", "Shared behavior", "Memory layout", "Error type"];
              correctAnswerIndex = 1;
              explanation = "Traits define shared behavior that types can implement.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 35;
              question = "Why is Rust popular for blockchain development?";
              options = ["Easy syntax", "Memory safety and performance", "Large community", "Built-in blockchain features"];
              correctAnswerIndex = 1;
              explanation = "Rust's memory safety and zero-cost abstractions make it ideal for blockchain.";
              difficulty = #Beginner;
              timeLimit = ?45;
            }
          ];
        }
      ];
    },

    // Course 8: DAO Governance & Tokenomics
    {
      courseId = 8;
      modules = [
        {
          id = 8;
          title = "DAO Fundamentals";
          description = "Decentralized governance";
          estimatedTime = "3 hours";
          prerequisites = ["Solidity Programming"];
          isLocked = false;
          lessons = [
            {
              id = 10;
              title = "DAO Structure";
              content = {
                summary = "Understanding DAOs";
                keyPoints = ["Governance tokens", "Proposals", "Voting"];
                detailedContent = "DAOs use governance tokens for decision-making. Token holders submit proposals and vote on important decisions.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=KHm0uUPqmVE";
              duration = "30 minutes";
              lessonType = #Video;
              resources = ["https://ethereum.org/dao/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 36;
              question = "What are governance tokens used for?";
              options = ["Trading", "Voting rights", "Staking", "Mining"];
              correctAnswerIndex = 1;
              explanation = "Governance tokens give holders the right to vote on DAO proposals.";
              difficulty = #Intermediate;
              timeLimit = ?45;
            },
            {
              id = 37;
              question = "What is a DAO proposal?";
              options = ["Business plan", "Suggested change or action", "Smart contract", "Token distribution"];
              correctAnswerIndex = 1;
              explanation = "Proposals are suggestions for changes that DAO members vote on.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 38;
              question = "What is quadratic voting?";
              options = ["Voting four times", "Cost increases quadratically", "Square-shaped ballots", "Mathematical algorithm"];
              correctAnswerIndex = 1;
              explanation = "Quadratic voting makes additional votes increasingly expensive to prevent plutocracy.";
              difficulty = #Advanced;
              timeLimit = ?90;
            },
            {
              id = 39;
              question = "What is tokenomics?";
              options = ["Token trading", "Economic design of tokens", "Token creation", "Token storage"];
              correctAnswerIndex = 1;
              explanation = "Tokenomics refers to the economic model and incentives of a token system.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 40;
              question = "What is a multisig wallet in DAO context?";
              options = ["Multiple signatures required", "Multiple tokens", "Multiple users", "Multiple networks"];
              correctAnswerIndex = 0;
              explanation = "Multisig wallets require multiple signatures to execute transactions, adding security.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            }
          ];
        }
      ];
    },

    // Course 9: Cryptocurrency Trading & Analysis
    {
      courseId = 9;
      modules = [
        {
          id = 9;
          title = "Crypto Trading";
          description = "Trading and technical analysis";
          estimatedTime = "4 hours";
          prerequisites = ["Blockchain Basics"];
          isLocked = false;
          lessons = [
            {
              id = 11;
              title = "Technical Analysis";
              content = {
                summary = "Chart reading and indicators";
                keyPoints = ["Candlesticks", "Support/resistance", "Moving averages"];
                detailedContent = "Technical analysis uses price charts and indicators to predict market movements. Key concepts include trend lines and volume.";
                codeExamples = null;
              };
              videoUrl = ?"https://www.youtube.com/watch?v=dOTn50RXROw";
              duration = "40 minutes";
              lessonType = #CodeLab;
              resources = ["https://www.tradingview.com/"];
              isCompleted = false;
            }
          ];
          quiz = [
            {
              id = 41;
              question = "What do candlesticks show?";
              options = ["Volume only", "Price movement", "Market cap", "Trading fees"];
              correctAnswerIndex = 1;
              explanation = "Candlesticks display open, high, low, and close prices for a time period.";
              difficulty = #Beginner;
              timeLimit = ?45;
            },
            {
              id = 42;
              question = "What is a bull market?";
              options = ["Falling prices", "Rising prices", "Stable prices", "High volatility"];
              correctAnswerIndex = 1;
              explanation = "Bull market refers to sustained period of rising asset prices.";
              difficulty = #Beginner;
              timeLimit = ?30;
            },
            {
              id = 43;
              question = "What is support level?";
              options = ["Price ceiling", "Price floor", "Trading volume", "Market cap"];
              correctAnswerIndex = 1;
              explanation = "Support is a price level where buying pressure typically prevents further decline.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 44;
              question = "What is DCA strategy?";
              options = ["Daily Cash Analysis", "Dollar Cost Averaging", "Decentralized Coin Allocation", "Data Collection Algorithm"];
              correctAnswerIndex = 1;
              explanation = "DCA involves buying fixed amounts regularly regardless of price to reduce volatility impact.";
              difficulty = #Intermediate;
              timeLimit = ?60;
            },
            {
              id = 45;
              question = "What is HODL?";
              options = ["Trading strategy", "Hold On for Dear Life", "Technical indicator", "Exchange platform"];
              correctAnswerIndex = 1;
              explanation = "HODL means holding cryptocurrency long-term despite market volatility.";
              difficulty = #Beginner;
              timeLimit = ?30;
            }
          ];
        }
      ];
    }
  ];
}