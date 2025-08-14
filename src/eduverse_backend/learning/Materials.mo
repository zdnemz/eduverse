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
          content = "Blockchain adalah teknologi distributed ledger yang memungkinkan penyimpanan data secara desentralisasi dan transparan. Setiap blok berisi hash dari blok sebelumnya, timestamp, dan data transaksi.
          **Karakteristik Utama Blockchain:**
          - **Desentralisasi**: Tidak ada otoritas pusat yang mengontrol
          - **Transparansi**: Semua transaksi dapat diverifikasi publik  
          - **Immutability**: Data yang sudah tercatat sulit diubah
          - **Konsensus**: Validator setuju pada keadaan sistem
          **Cara Kerja Blockchain:**
          1. Transaksi diinisiasi oleh user
          2. Transaksi disiarkan ke network
          3. Network memvalidasi transaksi
          4. Transaksi dikemas dalam blok
          5. Blok ditambahkan ke chain setelah konsensus
          Blockchain pertama kali diperkenalkan melalui Bitcoin pada tahun 2008 oleh Satoshi Nakamoto sebagai solusi untuk masalah double-spending dalam mata uang digital.";
          codeExample = "
          // Contoh struktur blok sederhana
          public type Block = {
            index: Nat;
            timestamp: Int;
            data: Text;
            previousHash: Text;
            hash: Text;
            nonce: Nat;
          };

          // Fungsi untuk membuat hash blok
          public func calculateHash(block: Block) : Text {
            let input = Nat.toText(block.index) # Int.toText(block.timestamp) # 
                        block.data # block.previousHash # Nat.toText(block.nonce);
            // Dalam implementasi nyata, gunakan SHA-256
            return \"hash_\" # input;
          };";
        },
        {
        moduleId = 2;
        title = "Understanding Ethereum";
        content = "Ethereum adalah platform blockchain yang memungkinkan smart contracts dan aplikasi terdesentralisasi (dApps). Berbeda dengan Bitcoin yang fokus pada transfer nilai, Ethereum adalah 'world computer' yang dapat menjalankan program.
        **Komponen Ethereum:**
        - **Ethereum Virtual Machine (EVM)**: Runtime environment untuk smart contracts
        - **Gas**: Unit biaya untuk eksekusi operasi di network
        - **Ether (ETH)**: Native cryptocurrency Ethereum
        - **Smart Contracts**: Self-executing contracts dengan terms dalam kode
        **Keunggulan Ethereum:**
        - Turing-complete programming language
        - Ecosystem yang besar dan aktif
        - Standard token (ERC-20, ERC-721, ERC-1155)
        - Layer 2 solutions untuk skalabilitas
        Ethereum menggunakan proof-of-stake consensus mechanism sejak The Merge pada September 2022, yang membuatnya lebih energy-efficient dibanding proof-of-work.";
        codeExample = "// Contoh struktur account Ethereum
          public type EthereumAccount = {
            address: Text;
            balance: Nat;
            nonce: Nat;
            codeHash: Text;
            storageRoot: Text;
          };

          // Contoh transaksi Ethereum
          public type Transaction = {
            from: Text;
            to: ?Text; // null untuk contract creation
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
        content = "Consensus mechanism adalah protokol yang digunakan network blockchain untuk mencapai kesepakatan tentang state yang valid. Ini memastikan semua node memiliki versi yang sama dari ledger.

        **Jenis Consensus Mechanisms:**

        **1. Proof of Work (PoW)**
        - Miners berkompetisi memecahkan puzzle kriptografis
        - Yang pertama solve mendapat reward
        - Digunakan oleh Bitcoin
        - Energy-intensive tapi sangat secure

        **2. Proof of Stake (PoS)**  
        - Validators dipilih berdasarkan stake mereka
        - Lebih energy-efficient dari PoW
        - Digunakan oleh Ethereum 2.0
        - Penalty untuk perilaku malicious (slashing)

        **3. Delegated Proof of Stake (DPoS)**
        - Token holders vote untuk delegates
        - Delegates validate transaksi atas nama voters
        - Lebih cepat tapi kurang desentralisasi

        **4. Proof of Authority (PoA)**
        - Pre-approved identities sebagai validators
        - Cocok untuk private/consortium networks
        - Sangat cepat tapi kurang desentralisasi";
        codeExample = "// Contoh implementasi sederhana PoS
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
              // Logic untuk memilih validator berdasarkan stake
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
          content = "Smart contracts adalah program yang berjalan di blockchain dan mengeksekusi agreements secara otomatis ketika kondisi tertentu terpenuhi. Konsep ini pertama kali diperkenalkan oleh Nick Szabo pada tahun 1994.

          **Karakteristik Smart Contracts:**
          - **Self-executing**: Otomatis mengeksekusi terms tanpa intermediary
          - **Immutable**: Tidak dapat diubah setelah deploy (kecuali ada upgrade mechanism)
          - **Transparent**: Kode dapat dilihat dan diverifikasi siapa saja
          - **Trustless**: Tidak memerlukan trust pada pihak ketiga

          **Keuntungan Smart Contracts:**
          - Mengurangi biaya dengan menghilangkan middleman
          - Eksekusi yang cepat dan otomatis  
          - Mengurangi kemungkinan error manusia
          - Transparansi dan immutability

          **Use Cases:**
          - Token dan cryptocurrency
          - Decentralized exchanges (DEX)
          - Insurance claims automation
          - Supply chain tracking
          - Voting systems
          - Escrow services";
          codeExample = "// Contoh smart contract sederhana di Motoko
          import Principal \"mo:base/Principal\";
          import Map \"mo:base/HashMap\";

          actor SimpleContract {
            private var owner: Principal = Principal.fromText(\"rdmx6-jaaaa-aaaah-qcaiq-cai\");
            private var contractBalance: Nat = 0;
            private var isActive: Bool = true;
            
            // Modifier untuk mengecek owner
            private func onlyOwner(caller: Principal) : Bool {
              Principal.equal(caller, owner)
            };
            
            // Function untuk deposit
            public func deposit(amount: Nat) : async Text {
              if (not isActive) return \"Contract is not active\";
              contractBalance += amount;
              \"Deposit successful. New balance: \" # Nat.toText(contractBalance)
            };
            
            // Function untuk withdraw (hanya owner)
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
          content = "Solidity adalah bahasa pemrograman yang dirancang khusus untuk menulis smart contracts di Ethereum Virtual Machine (EVM). Syntax-nya mirip dengan JavaScript dan C++.

          **Fitur Utama Solidity:**
          - **Statically typed**: Tipe data harus dideklarasikan
          - **Contract-oriented**: Dirancang untuk smart contracts
          - **Inheritance support**: Contracts dapat inherit dari contract lain
          - **Libraries**: Kode reusable yang dapat di-deploy sekali dan digunakan berulang

          **Data Types di Solidity:**
          - **Value Types**: bool, int, uint, address, bytes, string
          - **Reference Types**: arrays, structs, mappings
          - **Special Variables**: msg.sender, msg.value, block.timestamp

          **Visibility Modifiers:**
          - **public**: Dapat diakses dari mana saja
          - **private**: Hanya dalam contract yang sama
          - **internal**: Contract dan derived contracts
          - **external**: Hanya dari luar contract

          **Function Modifiers:**
          - **view**: Tidak mengubah state
          - **pure**: Tidak membaca/mengubah state
          - **payable**: Dapat menerima Ether";
          codeExample = "// Contoh contract Solidity (sebagai referensi)
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

          // Equivalent dalam Motoko
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
          content = "Internet Computer (ICP) adalah blockchain yang dirancang untuk menjalankan aplikasi web dengan kecepatan internet tradisional. Dikembangkan oleh DFINITY Foundation, ICP memungkinkan smart contracts (disebut \"canisters\") untuk serve web content langsung ke browsers.

            **Keunggulan Internet Computer:**
            - **Web-speed**: Finality dalam 1-2 detik
            - **Web-serving**: Canisters dapat serve HTML, CSS, JS langsung
            - **Unlimited scalability**: Dapat menambah subnet nodes
            - **Reverse gas model**: Developers membayar gas, bukan users
            - **Internet identity**: Decentralized authentication system

            **Arsitektur ICP:**
            - **Subnets**: Independent blockchains yang berkomunikasi
            - **Nodes**: Komputer yang menjalankan ICP protocol
            - **Canisters**: Smart contracts yang dapat menyimpan data dan serve web
            - **Cycles**: Unit komputasi untuk membayar resource usage

            **Consensus Mechanism:**
            ICP menggunakan novel consensus yang disebut \"Threshold Relay\" yang memungkinkan finality yang sangat cepat dengan Byzantine fault tolerance.";
          codeExample = "// Contoh canister sederhana di Motoko
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
          content = "Motoko adalah bahasa pemrograman yang dirancang khusus untuk Internet Computer. Dikembangkan oleh DFINITY, Motoko memiliki syntax yang familiar bagi developer JavaScript/TypeScript dengan fitur-fitur modern.

          **Fitur Utama Motoko:**
          - **Actor-based**: Setiap canister adalah actor yang berkomunikasi via messages
          - **Async/await**: Built-in support untuk asynchronous programming
          - **Stable variables**: Data persist across canister upgrades
          - **Pattern matching**: Powerful pattern matching dengan switch expressions
          - **Type safety**: Strong static typing dengan type inference
          - **Garbage collected**: Automatic memory management

          **Data Types:**
          - **Primitive**: Bool, Int, Nat, Text, Char
          - **Compound**: Arrays, Tuples, Records, Variants
          - **Special**: Principal, Blob, Error

          **Actor Model:**
          Setiap canister adalah actor yang:
          - Memiliki private state
          - Berkomunikasi via message passing
          - Memproses messages secara sequential
          - Dapat call actors lain asynchronously";
          codeExample = "// Contoh fitur-fitur Motoko
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
            
            // Pattern matching dengan switch
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
            
            // Result type untuk error handling
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
    }
  ];
};