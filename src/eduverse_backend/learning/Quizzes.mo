import Types "../Types";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

module {
  public let quizzes : [Types.CourseQuiz] = [
    // Quiz for Course 1: Blockchain Fundamentals & Ethereum (7 questions)
    {
      courseId = 1;
      title = "Quiz: Blockchain Fundamentals & Ethereum";
      questions = [
        {
          questionId = 1;
          question = "What are the main characteristics that make blockchain different from traditional databases?";
          options = [
            "Can be modified anytime by administrators",
            "Stored on a single central server", 
            "Decentralization and immutability",
            "Accessible only to specific users"
          ];
          correctAnswer = 2;
          explanation = "Blockchain is different due to its decentralized nature (no central authority) and immutability (hard to change once recorded).";
        },
        {
          questionId = 2;
          question = "What is the main function of a hash in the blockchain structure?";
          options = [
            "Encrypting transaction data",
            "Linking blocks together and ensuring data integrity",
            "Determining the amount of cryptocurrency",
            "Controlling transaction speed"
          ];
          correctAnswer = 1;
          explanation = "A hash links blocks together and ensures data integrity. Each block contains the hash of the previous block.";
        },
        {
          questionId = 3;
          question = "Who first introduced the concept of blockchain?";
          options = [
            "Vitalik Buterin",
            "Satoshi Nakamoto", 
            "Gavin Wood",
            "Charlie Lee"
          ];
          correctAnswer = 1;
          explanation = "Satoshi Nakamoto introduced blockchain through the Bitcoin whitepaper in 2008 as a solution to the double-spending problem.";
        },
        {
          questionId = 4;
          question = "What is the main difference between Ethereum and Bitcoin?";
          options = [
            "Ethereum is only for money transfers, Bitcoin is for smart contracts",
            "Bitcoin is for value transfer, Ethereum is a platform for smart contracts and dApps",
            "Both have exactly the same functions",
            "Ethereum is older than Bitcoin"
          ];
          correctAnswer = 1;
          explanation = "Bitcoin focuses on value transfer, while Ethereum is a platform that enables smart contracts and decentralized applications.";
        },
        {
          questionId = 5;
          question = "What is the function of Gas in the Ethereum network?";
          options = [
            "To fuel vehicles",
            "Unit of cost to pay for computation and execution of operations in the network",
            "Another name for Ether",
            "Voting system in Ethereum"
          ];
          correctAnswer = 1;
          explanation = "Gas is the unit that measures computational cost. Every operation in Ethereum requires gas paid in Ether.";
        },
        {
          questionId = 6;
          question = "Which consensus mechanism does Ethereum use after The Merge?";
          options = [
            "Proof of Work",
            "Proof of Stake",
            "Proof of Authority",
            "Delegated Proof of Stake"
          ];
          correctAnswer = 1;
          explanation = "After The Merge in September 2022, Ethereum switched from Proof of Work to Proof of Stake for energy efficiency.";
        },
        {
          questionId = 7;
          question = "What is the main benefit of transparency in blockchain?";
          options = [
            "Data cannot be seen by anyone",
            "Only admins can see the data",
            "All transactions can be publicly verified, increasing trust",
            "Data keeps changing"
          ];
          correctAnswer = 2;
          explanation = "Blockchain transparency allows everyone to verify transactions, increasing trust in the system without third parties.";
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
    
    // Quiz for Course 2: Solidity Smart Contract Development
    {
      courseId = 2;
      title = "Quiz: Solidity Smart Contract Development";
      questions = [
        {
          questionId = 1;
          question = "Who first introduced the concept of smart contracts?";
          options = [
            "Satoshi Nakamoto",
            "Vitalik Buterin",
            "Nick Szabo",
            "Gavin Wood"
          ];
          correctAnswer = 2;
          explanation = "Nick Szabo first introduced the concept of smart contracts in 1994, long before blockchain became popular.";
        },
        {
          questionId = 2;
          question = "What is the main advantage of smart contracts compared to traditional contracts?";
          options = [
            "Easier to modify",
            "Self-executing and eliminates the need for intermediaries",
            "Always requires third parties",
            "Cheaper to create"
          ];
          correctAnswer = 1;
          explanation = "Smart contracts can execute automatically when conditions are met, reducing costs and time by removing intermediaries.";
        },
        {
          questionId = 3;
          question = "Which keyword is used to declare a state variable that can be accessed from outside the contract?";
          options = [
            "private",
            "internal",
            "public",
            "external"
          ];
          correctAnswer = 2;
          explanation = "The 'public' keyword makes state variables accessible externally and automatically generates a getter function.";
        },
        {
          questionId = 4;
          question = "What does a 'payable' function in Solidity mean?";
          options = [
            "A function that pays gas fees",
            "A function that can receive Ether",
            "A function only callable by the owner",
            "A function that requires no gas"
          ];
          correctAnswer = 1;
          explanation = "A function with the 'payable' modifier can receive Ether. Without it, the function rejects Ether.";
        },
        {
          questionId = 5;
          question = "Which data type is used to store Ethereum addresses in Solidity?";
          options = [
            "string",
            "bytes32",
            "address",
            "uint256"
          ];
          correctAnswer = 2;
          explanation = "The 'address' type is specifically designed to store Ethereum addresses (20 bytes) and has built-in methods like .balance and .transfer().";
        },
        {
          questionId = 6;
          question = "What does the 'view' modifier do in Solidity functions?";
          options = [
            "The function can modify state",
            "The function cannot modify state but can read it",
            "The function cannot read or modify state",
            "The function can only be called once"
          ];
          correctAnswer = 1;
          explanation = "The 'view' modifier means the function does not change state variables, it only reads blockchain data.";
        },
        {
          questionId = 7;
          question = "What are events used for in Solidity?";
          options = [
            "Permanently storing data on-chain",
            "Logging and communicating with external applications",
            "Automatically executing functions",
            "Saving gas fees"
          ];
          correctAnswer = 1;
          explanation = "Events are used for logging activity on the blockchain and allow external applications to detect changes in a smart contract.";
        }
      ];
      passingScore = 60;
      timeLimit = 420;
    },

    // Quiz for Course 3: Internet Computer Development (7 questions)
    {
      courseId = 3;
      title = "Quiz: Internet Computer Development";
      questions = [
        {
          questionId = 1;
          question = "What is the main advantage of the Internet Computer compared to other blockchains?";
          options = [
            "Slower but more secure",
            "Web-speed finality and ability to serve web content directly",
            "Only for cryptocurrency",
            "Does not require internet"
          ];
          correctAnswer = 1;
          explanation = "Internet Computer achieves finality in 1-2 seconds and canisters can serve HTML, CSS, and JS directly to browsers.";
        },
        {
          questionId = 2;
          question = "What does the 'reverse gas model' mean in the Internet Computer?";
          options = [
            "Users pay higher gas fees",
            "No gas fees at all",
            "Developers pay for gas (cycles), not users",
            "Gas is paid with another cryptocurrency"
          ];
          correctAnswer = 2;
          explanation = "In the reverse gas model, developers pay cycles for computation, allowing users to interact with dApps without gas fees.";
        },
        {
          questionId = 3;
          question = "What are smart contracts on the Internet Computer called?";
          options = [
            "Smart Contracts",
            "Canisters", 
            "Actors",
            "Nodes"
          ];
          correctAnswer = 1;
          explanation = "Smart contracts on the Internet Computer are called 'canisters' which can store data, run code, and serve web content.";
        },
        {
          questionId = 4;
          question = "What programming paradigm does Motoko use?";
          options = [
            "Object-oriented programming",
            "Actor-based programming",
            "Functional programming",
            "Procedural programming"
          ];
          correctAnswer = 1;
          explanation = "Motoko uses actor-based programming where each canister is an actor that communicates via message passing.";
        },
        {
          questionId = 5;
          question = "What is the difference between stable and non-stable variables in Motoko?";
          options = [
            "Stable variables are lost on upgrade, non-stable variables persist",
            "Stable variables persist across upgrades, non-stable variables reset",
            "No difference",
            "Stable variables are faster"
          ];
          correctAnswer = 1;
          explanation = "Stable variables persist across canister upgrades, while non-stable variables reset to default values on upgrade.";
        },
        {
          questionId = 6;
          question = "What syntax is used for error handling in Motoko?";
          options = [
            "try-catch",
            "Result type with #ok and #err",
            "throw-exception",
            "if-else statements"
          ];
          correctAnswer = 1;
          explanation = "Motoko uses the Result type which can contain #ok(value) for success or #err(error) for type-safe error handling.";
        },
        {
          questionId = 7;
          question = "What are Cycles used for in the Internet Computer?";
          options = [
            "Currency for trading",
            "Computation unit to pay for canister resource usage",
            "Voting system", 
            "Encryption method"
          ];
          correctAnswer = 1;
          explanation = "Cycles are the computation units used to pay for resources like storage, compute, and bandwidth in the Internet Computer.";
        }
      ];
      passingScore = 60;
      timeLimit = 420;
    },
    // Quiz for Course 4: Web3 Frontend with React & ethers.js
    {
      courseId = 4;
      title = "Quiz: Web3 Frontend with React & ethers.js";
      questions = [
        {
          questionId = 1;
          question = "What makes a Web3 frontend different from a traditional frontend application?";
          options = [
            "It connects directly to blockchain via libraries like ethers.js",
            "It only uses centralized databases",
            "It cannot interact with smart contracts",
            "It does not need user authentication"
          ];
          correctAnswer = 0;
          explanation = "Unlike traditional apps, Web3 frontends interact directly with blockchain nodes and smart contracts using libraries such as ethers.js.";
        },
        {
          questionId = 2;
          question = "What is the role of a 'provider' in ethers.js?";
          options = [
            "To sign transactions on behalf of users",
            "To store private keys securely",
            "To connect to the Ethereum network and read blockchain data",
            "To create new Ethereum wallets"
          ];
          correctAnswer = 2;
          explanation = "A provider allows the frontend to read data from the blockchain, such as account balances or block numbers.";
        },
        {
          questionId = 3;
          question = "What happens if a function in ethers.js is called with a signer instead of a provider?";
          options = [
            "It can only read blockchain data",
            "It can send transactions that modify blockchain state",
            "It will throw an error",
            "It can only generate hashes"
          ];
          correctAnswer = 1;
          explanation = "When connected with a signer, ethers.js can send transactions that write to the blockchain, such as updating contract state.";
        },
        {
          questionId = 4;
          question = "How can a Web3 app detect if MetaMask is installed in the user's browser?";
          options = [
            "Check if window.ethereum is defined",
            "Call the provider.getNetwork() function",
            "Import the MetaMask API",
            "Connect to Infura directly"
          ];
          correctAnswer = 0;
          explanation = "MetaMask injects an object called `window.ethereum` into the browser, which can be detected by Web3 apps.";
        },
        {
          questionId = 5;
          question = "What React hook is typically used to store the connected wallet address in a Web3 DApp?";
          options = [
            "useReducer",
            "useEffect",
            "useRef",
            "useState"
          ];
          correctAnswer = 3;
          explanation = "The `useState` hook is commonly used to manage dynamic values like the connected account address.";
        },
        {
          questionId = 6;
          question = "Why is it important to handle account and network changes in a DApp frontend?";
          options = [
            "Because MetaMask may reject the contract",
            "Because users can switch accounts or networks at any time",
            "Because it reduces gas fees",
            "Because React requires it"
          ];
          correctAnswer = 1;
          explanation = "DApps must listen for account or network changes because users can switch wallets or networks, and the UI must stay synchronized.";
        },
        {
          questionId = 7;
          question = "What is the primary advantage of integrating ethers.js with React components in a DApp?";
          options = [
            "Automatic gas fee calculation",
            "Seamless UI updates when blockchain data changes",
            "Offline blockchain interaction",
            "Access to private keys directly in React"
          ];
          correctAnswer = 1;
          explanation = "React reactivity allows the UI to automatically update when blockchain data changes, making the DApp more user-friendly.";
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
        // Quiz for Course 5: DeFi Protocols & Yield Farming
    {
      courseId = 5;
      title = "Quiz: DeFi Protocols & Yield Farming";
      questions = [
        {
          questionId = 1;
          question = "What is the main purpose of a Liquidity Pool (LP) in DeFi?";
          options = [
            "To provide liquidity for Automated Market Makers (AMMs) to function",
            "To store stablecoins for lending",
            "To reduce Ethereum gas fees",
            "To manage DAO governance"
          ];
          correctAnswer = 0;
          explanation = "Liquidity pools allow users to deposit tokens, which provide liquidity for AMMs to facilitate decentralized trading."
        },
        {
          questionId = 2;
          question = "What role does an Automated Market Maker (AMM) play in a decentralized exchange?";
          options = [
            "It directly connects buyers and sellers",
            "It sets token prices using mathematical formulas",
            "It provides fiat on-ramp services",
            "It secures user private keys"
          ];
          correctAnswer = 1;
          explanation = "AMMs calculate token prices using algorithms (like constant product formula) instead of traditional order books."
        },
        {
          questionId = 3;
          question = "What does Impermanent Loss refer to in liquidity provision?";
          options = [
            "Tokens permanently lost due to hacks",
            "Losses caused by changes in token prices compared to holding them",
            "Failure to claim staking rewards",
            "Gas fees that exceed rewards"
          ];
          correctAnswer = 1;
          explanation = "Impermanent loss occurs when the value of tokens in a liquidity pool diverges from simply holding the tokens."
        },
        {
          questionId = 4;
          question = "What is Yield Farming in DeFi?";
          options = [
            "Renting GPU power for mining",
            "Providing liquidity or staking tokens to earn rewards",
            "Trading with leverage on DEXs",
            "Buying NFTs and reselling them"
          ];
          correctAnswer = 1;
          explanation = "Yield farming involves staking or lending crypto in DeFi protocols to earn rewards, often in the form of additional tokens."
        },
        {
          questionId = 5;
          question = "What is one of the biggest risks associated with Yield Farming?";
          options = [
            "Smart contract vulnerabilities",
            "Guaranteed loss of tokens",
            "Excessive electricity costs",
            "No rewards being distributed"
          ];
          correctAnswer = 0;
          explanation = "Yield farming carries risks such as smart contract bugs, which could result in loss of funds."
        },
        {
          questionId = 6;
          question = "How do liquidity providers earn rewards in an AMM like Uniswap?";
          options = [
            "By receiving a portion of the trading fees",
            "By mining new tokens directly",
            "By claiming airdrops every week",
            "By connecting their wallet to an oracle"
          ];
          correctAnswer = 0;
          explanation = "Liquidity providers earn a share of trading fees proportional to their contribution to the liquidity pool."
        },
        {
          questionId = 7;
          question = "Why are DeFi protocols often considered more transparent than traditional finance systems?";
          options = [
            "Because smart contracts are open-source and transactions are recorded on-chain",
            "Because they are regulated by central banks",
            "Because all user identities are verified with KYC",
            "Because they hide transaction details from the public"
          ];
          correctAnswer = 0;
          explanation = "DeFi protocols rely on blockchain technology, making code and transactions transparent and auditable by anyone."
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
    // Quiz for Course 6: NFT Marketplace Development
    {
      courseId = 6;
      title = "Quiz: NFT Marketplace Development";
      questions = [
        {
          questionId = 1;
          question = "What does NFT stand for?";
          options = [
            "Non-Fixed Token",
            "Non-Fungible Token",
            "Network File Transfer",
            "New Financial Tool"
          ];
          correctAnswer = 1;
          explanation = "NFT stands for Non-Fungible Token, which represents unique digital assets on the blockchain."
        },
        {
          questionId = 2;
          question = "What is the purpose of minting an NFT?";
          options = [
            "To destroy a token",
            "To convert a digital file into a unique blockchain asset",
            "To exchange tokens on a DEX",
            "To reduce transaction fees"
          ];
          correctAnswer = 1;
          explanation = "Minting is the process of registering a digital file on the blockchain as a unique, verifiable NFT."
        },
        {
          questionId = 3;
          question = "Which Ethereum standard is most commonly used for NFTs?";
          options = [
            "ERC-20",
            "ERC-721",
            "ERC-777",
            "ERC-4626"
          ];
          correctAnswer = 1;
          explanation = "ERC-721 is the standard for creating unique, non-fungible tokens on Ethereum."
        },
        {
          questionId = 4;
          question = "What functionality does an NFT marketplace smart contract provide?";
          options = [
            "Lending and borrowing tokens",
            "Storing private keys for users",
            "Listing, buying, and selling NFTs",
            "Running consensus algorithms"
          ];
          correctAnswer = 2;
          explanation = "NFT marketplace contracts enable listing NFTs, handling bids, and transferring ownership between buyers and sellers."
        },
        {
          questionId = 5;
          question = "Which Ethereum standard allows batch transfers of NFTs and fungible tokens together?";
          options = [
            "ERC-721",
            "ERC-1155",
            "ERC-20",
            "ERC-998"
          ];
          correctAnswer = 1;
          explanation = "ERC-1155 supports batch transfers and can represent both fungible and non-fungible tokens."
        },
        {
          questionId = 6;
          question = "What is metadata in the context of NFTs?";
          options = [
            "The unique identifier of an Ethereum wallet",
            "Descriptive data that defines the NFT, like image URL or attributes",
            "Gas fees required to mint an NFT",
            "The block number in which the NFT was created"
          ];
          correctAnswer = 1;
          explanation = "Metadata provides descriptive information such as artwork, traits, or media linked to the NFT."
        },
        {
          questionId = 7;
          question = "Why is decentralization important for NFT marketplaces?";
          options = [
            "It reduces transaction speed",
            "It removes single points of failure and ensures trustless trading",
            "It hides ownership history",
            "It eliminates gas fees entirely"
          ];
          correctAnswer = 1;
          explanation = "Decentralized marketplaces ensure that no single party controls transactions, making trading more transparent and secure."
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
    // Quiz for Course 7: Rust Programming for Web3
    {
      courseId = 7;
      title = "Quiz: Rust Programming for Web3";
      questions = [
        {
          questionId = 1;
          question = "What feature of Rust ensures memory safety without a garbage collector?";
          options = [
            "Manual memory management",
            "Ownership system",
            "Global variables",
            "Automatic reference counting only"
          ];
          correctAnswer = 1;
          explanation = "Rust’s ownership system with rules around borrowing and lifetimes ensures memory safety without needing a garbage collector.";
        },
        {
          questionId = 2;
          question = "What is Cargo in the Rust ecosystem?";
          options = [
            "The garbage collector for Rust",
            "The Rust package manager and build system",
            "A blockchain client",
            "An IDE for Rust"
          ];
          correctAnswer = 1;
          explanation = "Cargo is Rust’s package manager and build system, used to manage dependencies, compile projects, and run tests.";
        },
        {
          questionId = 3;
          question = "Which keyword in Rust is used to define an immutable variable?";
          options = [
            "var",
            "let",
            "const",
            "mut"
          ];
          correctAnswer = 1;
          explanation = "By default, `let` creates an immutable variable. To make it mutable, you add the `mut` keyword.";
        },
        {
          questionId = 4;
          question = "Why is Rust often used for Web3 and blockchain development?";
          options = [
            "Because it is the easiest language to learn",
            "Because it has strong performance and memory safety",
            "Because it is only used for frontends",
            "Because it requires no compilation"
          ];
          correctAnswer = 1;
          explanation = "Rust is chosen for blockchain projects like Solana and ICP because of its high performance and memory safety guarantees.";
        },
        {
          questionId = 5;
          question = "What does the `Result<T, E>` type in Rust represent?";
          options = [
            "A successful value or an error",
            "A pointer to a variable",
            "A smart contract object",
            "An infinite loop handler"
          ];
          correctAnswer = 0;
          explanation = "`Result<T, E>` is Rust’s way to handle success (`Ok(T)`) or failure (`Err(E)`) without exceptions.";
        },
        {
          questionId = 6;
          question = "Which blockchain ecosystem commonly uses Rust for smart contracts?";
          options = [
            "Solana",
            "Ethereum",
            "Bitcoin",
            "Ripple"
          ];
          correctAnswer = 0;
          explanation = "Solana’s high-performance blockchain uses Rust as a primary language for building smart contracts.";
        },
        {
          questionId = 7;
          question = "What is the purpose of 'borrowing' in Rust?";
          options = [
            "To avoid copying data and still ensure memory safety",
            "To create global variables",
            "To allow garbage collection",
            "To write assembly code in Rust"
          ];
          correctAnswer = 0;
          explanation = "Borrowing in Rust allows functions to access data without taking ownership, preventing unnecessary copies.";
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
    // Quiz for Course 8: DAO Governance & Tokenomics (randomized correctAnswer)
    {
      courseId = 8;
      title = "Quiz: DAO Governance & Tokenomics";
      questions = [
        {
          questionId = 1;
          question = "What is a DAO?";
          options = [
            "Decentralized Autonomous Organization",
            "Digital Asset Ownership",
            "Distributed Algorithm Operation",
            "Decentralized Application Output"
          ];
          correctAnswer = 0;
          explanation = "A DAO is a Decentralized Autonomous Organization governed by smart contracts and community voting."
        },
        {
          questionId = 2;
          question = "What is the primary purpose of governance tokens in a DAO?";
          options = [
            "To pay gas fees",
            "To vote on proposals and influence decisions",
            "To mint NFTs",
            "To stake for yield farming"
          ];
          correctAnswer = 3;
          explanation = "Governance tokens allow holders to vote on DAO proposals and influence the organization's rules or fund allocation."
        },
        {
          questionId = 3;
          question = "Which voting mechanism is commonly used in DAOs?";
          options = [
            "Weighted voting based on token holdings",
            "First-come-first-serve voting",
            "Random selection voting",
            "Centralized executive voting"
          ];
          correctAnswer = 2;
          explanation = "Most DAOs implement weighted voting, where more tokens mean more voting power."
        },
        {
          questionId = 4;
          question = "What does tokenomics refer to?";
          options = [
            "The economic model and incentives of a token",
            "The coding standard of a token",
            "The governance structure only",
            "The market exchange platform"
          ];
          correctAnswer = 0;
          explanation = "Tokenomics covers supply, distribution, incentives, and overall economic model of a token."
        },
        {
          questionId = 5;
          question = "Which of these is a common DAO governance model?";
          options = [
            "On-chain proposal and voting",
            "Manual board meetings",
            "Proof-of-stake only",
            "Federated consensus"
          ];
          correctAnswer = 1;
          explanation = "On-chain proposal and voting allows token holders to propose and vote on DAO decisions transparently."
        },
        {
          questionId = 6;
          question = "Why is decentralization important in DAOs?";
          options = [
            "It prevents single points of failure and ensures community control",
            "It increases gas fees",
            "It centralizes decision-making",
            "It removes all voting mechanisms"
          ];
          correctAnswer = 0;
          explanation = "Decentralization ensures no single entity can control the DAO, preserving transparency and trust."
        },
        {
          questionId = 7;
          question = "What risk is specific to DAO governance?";
          options = [
            "Smart contract bugs leading to loss of funds",
            "High CPU usage in user devices",
            "Offline database corruption",
            "Manual spreadsheet errors"
          ];
          correctAnswer = 2;
          explanation = "DAO decisions rely on smart contracts; bugs can be exploited and result in financial loss."
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
    // Quiz for Course 9: Cryptocurrency Trading & Analysis (randomized correctAnswer)
    {
      courseId = 9;
      title = "Quiz: Cryptocurrency Trading & Analysis";
      questions = [
        {
          questionId = 1;
          question = "What is technical analysis (TA) in crypto trading?";
          options = [
            "Analyzing blockchain code quality",
            "Studying past price and volume patterns to predict future movements",
            "Auditing token smart contracts",
            "Evaluating wallet security"
          ];
          correctAnswer = 1;
          explanation = "Technical analysis involves examining historical price and volume data to make trading decisions."
        },
        {
          questionId = 2;
          question = "Which of the following is a common technical indicator?";
          options = [
            "Moving Average (MA)",
            "Token supply audit",
            "Hash rate check",
            "Smart contract ABI"
          ];
          correctAnswer = 0;
          explanation = "Moving averages are widely used to identify trends and potential entry or exit points in trading."
        },
        {
          questionId = 3;
          question = "What does fundamental analysis (FA) focus on?";
          options = [
            "Price patterns and chart formations",
            "Analyzing the intrinsic value of the crypto asset, team, project, and market",
            "Reading candlestick colors only",
            "Measuring gas fees"
          ];
          correctAnswer = 3;
          explanation = "Fundamental analysis evaluates the real value and potential of a crypto project beyond price movements."
        },
        {
          questionId = 4;
          question = "Which of the following is an example of a cryptocurrency trading strategy?";
          options = [
            "Buy and hold (HODL)",
            "Forking the blockchain",
            "Minting new tokens",
            "Creating a DAO"
          ];
          correctAnswer = 0;
          explanation = "HODL or buy-and-hold is a common strategy where investors keep crypto for long-term gains."
        },
        {
          questionId = 5;
          question = "Why is risk management crucial in crypto trading?";
          options = [
            "Because crypto markets are volatile and losses can be significant",
            "Because it ensures smart contract audits",
            "Because it reduces network congestion",
            "Because it guarantees profits"
          ];
          correctAnswer = 1;
          explanation = "Due to high volatility, risk management helps traders limit losses and protect capital."
        },
        {
          questionId = 6;
          question = "What is the difference between fundamental and technical analysis?";
          options = [
            "FA looks at intrinsic value; TA looks at price/volume patterns",
            "FA is faster; TA takes weeks",
            "FA uses only candlestick charts; TA uses only on-chain data",
            "FA guarantees profits; TA is speculative"
          ];
          correctAnswer = 0;
          explanation = "Fundamental analysis studies underlying value, while technical analysis studies historical market data to predict trends."
        },
        {
          questionId = 7;
          question = "What does the Relative Strength Index (RSI) indicate?";
          options = [
            "The amount of circulating supply",
            "Overbought or oversold market conditions",
            "The blockchain hash rate",
            "Token inflation rate"
          ];
          correctAnswer = 1;
          explanation = "RSI is a momentum oscillator used to indicate overbought or oversold conditions in an asset."
        }
      ];
      passingScore = 60;
      timeLimit = 420; // 7 minutes
    },
  ];

  // Helper functions untuk quiz management
  public func getQuizByCourseId(courseId: Nat) : ?Types.CourseQuiz {
    for (quiz in quizzes.vals()) {
      if (quiz.courseId == courseId) {
        return ?quiz;
      };
    };
    null
  };

  // Get all available quizzes
  public func getAllQuizzes() : [Types.CourseQuiz] {
    quizzes
  };

  // Get quiz preview (without correct answers)
  public func getQuizPreview(courseId: Nat) : ?Types.QuizPreview {
    switch (getQuizByCourseId(courseId)) {
      case null { null };
      case (?quiz) {
        let previewQuestions = Array.map<Types.QuizQuestion, Types.QuizQuestionPreview>(
          quiz.questions,
          func(q) = {
            questionId = q.questionId;
            question = q.question;
            options = q.options;
          }
        );
        
        ?{
          courseId = quiz.courseId;
          title = quiz.title;
          questions = previewQuestions;
          passingScore = quiz.passingScore;
          timeLimit = quiz.timeLimit;
          totalQuestions = quiz.questions.size();
        }
      };
    }
  };

  // Validate quiz answers format
  public func validateAnswers(answers: [Types.UserAnswer], quizQuestions: [Types.QuizQuestion]) : Result.Result<Bool, Text> {
    if (answers.size() != quizQuestions.size()) {
      return #err("Number of answers doesn't match number of questions");
    };

    for (answer in answers.vals()) {
      let questionExists = Array.find<Types.QuizQuestion>(
        quizQuestions, 
        func(q) = q.questionId == answer.questionId
      );
      
      switch (questionExists) {
        case null { return #err("Invalid question ID: " # Nat.toText(answer.questionId)) };
        case (?question) {
          if (answer.selectedAnswer >= question.options.size()) {
            return #err("Invalid answer option for question: " # Nat.toText(answer.questionId));
          };
        };
      };
    };

    #ok(true)
  };

  public func calculateScore(answers: [Nat], correctAnswers: [Nat]) : Nat {
    var score: Nat = 0;
    var i: Nat = 0;
    
    while (i < answers.size() and i < correctAnswers.size()) {
      if (answers[i] == correctAnswers[i]) {
        score += 1;
      };
      i += 1;
    };
    
    if (correctAnswers.size() > 0) {
      (score * 100) / correctAnswers.size()
    } else {
      0
    }
  };

  public func hasPassedQuiz(score: Nat, passingScore: Nat) : Bool {
    score >= passingScore
  };

  // Enhanced score calculation with detailed feedback
  public func calculateDetailedScore(answers: [Nat], correctAnswers: [Nat]) : Types.DetailedQuizScore {
    var correctCount: Nat = 0;
    var incorrectAnswers: [Nat] = [];
    var i: Nat = 0;
    
    while (i < answers.size() and i < correctAnswers.size()) {
      if (answers[i] == correctAnswers[i]) {
        correctCount += 1;
      } else {
        incorrectAnswers := Array.append(incorrectAnswers, [i]);
      };
      i += 1;
    };
    
    let totalQuestions = correctAnswers.size();
    let percentage = if (totalQuestions > 0) {
      (correctCount * 100) / totalQuestions
    } else { 0 };

    {
      totalQuestions = totalQuestions;
      correctAnswers = correctCount;
      incorrectAnswers = incorrectAnswers;
      scorePercentage = percentage;
      passed = percentage >= 60; // Default passing score
    }
  };

  // Get quiz statistics
  public func getQuizStatistics(courseId: Nat) : ?{totalQuestions: Nat; timeLimit: Nat; passingScore: Nat} {
    switch (getQuizByCourseId(courseId)) {
      case null { null };
      case (?quiz) {
        ?{
          totalQuestions = quiz.questions.size();
          timeLimit = quiz.timeLimit;
          passingScore = quiz.passingScore;
        }
      };
    }
  };
};