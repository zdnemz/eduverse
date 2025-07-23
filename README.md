# **EduVerse**

### *Decentralized EduTech with NFT Certificates on ICP*

![EduVerse Banner](https://dummyimage.com/1200x200/002658/ffffff\&text=EduVerse+-+Decentralized+EduTech)

## 📌 **Overview**

**EduVerse** is a decentralized EduTech platform that rewards users for learning. Every completed course and quiz is recorded on the **Internet Computer (ICP)** blockchain, and users can **claim verifiable NFT certificates** stored directly in their wallet.

## 🚀 **Key Features**

✅ **Decentralized Learning Record** – Certificates are NFTs stored on ICP blockchain.
✅ **Internet Identity Login** – Secure, passwordless authentication via **Internet Identity (II)**.
✅ **Interactive Learning & Quiz** – Complete quizzes to unlock certificates.
✅ **Verifiable Credential** – Certificates are **tamper-proof** and tied to the learner's **Principal ID**.
✅ *(Optional Future)* Tokenized reward system to motivate learners.

## 🏗 **System Architecture**

```
User (Internet Identity)
   │ Login
   ▼
Frontend React (Learning & Quiz)
   │ Claim Certificate (if pass)
   ▼
Canister Motoko
   │ Mint NFT Certificate
   ▼
ICP Blockchain
   │ NFT stored in user Principal
   ▼
Frontend Dashboard
   └─ Display user-owned certificates
```

## 📂 **Project Structure**

```
EduVerse/
├── src/
│   ├── eduverse_backend/   # Motoko canister (NFT certificate logic)
│   └── edu_versefrontend/  # React frontend (learning, quiz, dashboard)
├── README.md
└── dfx.json                # ICP project configuration
```

## 🔧 **Tech Stack**

* **Frontend:** React + TailwindCSS
* **Backend:** Motoko (Canister)
* **Blockchain:** Internet Computer Protocol (ICP)
* **Authentication:** Internet Identity (II)
* **NFT Standard:** DIP721

## 🛠 **Installation & Setup**

### 1. **Clone the Repository**

```bash
git clone https://github.com/zdnemz/EduVerse.git
cd EduVerse
```

### 2. **Install DFX & Dependencies**

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
npm install
```

### 3. **Start Local Development**

```bash
dfx start --clean --background
dfx deploy
npm start
```

## 📝 **Basic Flow for Users**

1. **Login** via Internet Identity → system generates **Principal ID**.
2. **Learn & Take Quiz** → complete the course.
3. **Claim NFT Certificate** → after passing, the certificate is minted and stored on ICP.
4. **View Dashboard** → see all owned NFT certificates in your wallet.

## 📌 **Roadmap**

* [x] Basic Internet Identity Login
* [ ] Quiz & Certificate Claim
* [ ] Simple NFT Minting (DIP721-like)
* [ ] Token reward integration (DIP20)
* [ ] Leaderboard & Gamification
* [ ] Integration with external EduTech platforms

## 📄 **License**

MIT License – Free to use and modify for educational purposes.

## 🎤 **Pitch Statement**

*"EduVerse brings a new way of learning where every skill you gain is **yours forever** – recorded on blockchain as a **verifiable NFT certificate**. No more fake credentials, no more lost certificates."*
