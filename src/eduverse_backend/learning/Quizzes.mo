import Types "../Types";

module {
  public let quizzes : [Types.CourseQuiz] = [
    // Quiz untuk Course 1: Blockchain Fundamentals & Ethereum
    {
      courseId = 1;
      moduleId = 1;
      title = "Quiz: Introduction to Blockchain Technology";
      questions = [
        {
          questionId = 1;
          question = "Apa karakteristik utama yang membuat blockchain berbeda dari database tradisional?";
          options = [
            "Dapat diubah kapan saja oleh administrator",
            "Tersimpan di satu server pusat", 
            "Desentralisasi dan immutability",
            "Hanya dapat diakses oleh pengguna tertentu"
          ];
          correctAnswer = 2; // index 2 (Desentralisasi dan immutability)
          explanation = "Blockchain berbeda karena sifatnya yang desentralisasi (tidak ada otoritas pusat) dan immutable (sulit diubah setelah data tercatat).";
        },
        {
          questionId = 2;
          question = "Apa fungsi utama dari hash dalam struktur blockchain?";
          options = [
            "Mengenkripsi data transaksi",
            "Menghubungkan blok satu dengan yang lain dan memastikan integritas data",
            "Menentukan jumlah cryptocurrency",
            "Mengatur kecepatan transaksi"
          ];
          correctAnswer = 1;
          explanation = "Hash berfungsi untuk menghubungkan blok-blok dan memastikan integritas data. Setiap blok berisi hash dari blok sebelumnya.";
        },
        {
          questionId = 3;
          question = "Siapa yang memperkenalkan konsep blockchain pertama kali?";
          options = [
            "Vitalik Buterin",
            "Satoshi Nakamoto", 
            "Gavin Wood",
            "Charlie Lee"
          ];
          correctAnswer = 1;
          explanation = "Satoshi Nakamoto memperkenalkan blockchain melalui Bitcoin whitepaper pada tahun 2008 sebagai solusi double-spending problem.";
        },
        {
          questionId = 4;
          question = "Apa yang terjadi dalam proses validasi transaksi blockchain?";
          options = [
            "Bank central memverifikasi semua transaksi",
            "Network nodes bekerjasama memvalidasi dan mencapai konsensus",
            "Pengirim transaksi memvalidasi sendiri",
            "Tidak ada proses validasi"
          ];
          correctAnswer = 1;
          explanation = "Dalam blockchain, network nodes bekerja sama untuk memvalidasi transaksi dan mencapai konsensus sebelum transaksi dikonfirmasi.";
        },
        {
          questionId = 5;
          question = "Apa keuntungan utama transparansi dalam blockchain?";
          options = [
            "Data tidak dapat dilihat siapa pun",
            "Hanya admin yang dapat melihat data",
            "Semua transaksi dapat diverifikasi publik sehingga meningkatkan trust",
            "Data selalu berubah-ubah"
          ];
          correctAnswer = 2;
          explanation = "Transparansi blockchain memungkinkan semua orang untuk memverifikasi transaksi, yang meningkatkan kepercayaan dalam sistem tanpa perlu trust pada pihak ketiga.";
        }
      ];
      passingScore = 60; // 3 dari 5 soal benar
      timeLimit = 300; // 5 menit dalam detik
    },
    
    {
      courseId = 1;
      moduleId = 2;
      title = "Quiz: Understanding Ethereum";
      questions = [
        {
          questionId = 1;
          question = "Apa perbedaan utama antara Ethereum dan Bitcoin?";
          options = [
            "Ethereum hanya untuk transfer uang, Bitcoin untuk smart contracts",
            "Bitcoin untuk transfer nilai, Ethereum adalah platform untuk smart contracts dan dApps",
            "Keduanya memiliki fungsi yang sama persis",
            "Ethereum lebih tua dari Bitcoin"
          ];
          correctAnswer = 1;
          explanation = "Bitcoin fokus pada transfer nilai, sedangkan Ethereum adalah platform yang memungkinkan smart contracts dan aplikasi terdesentralisasi.";
        },
        {
          questionId = 2;
          question = "Apa fungsi Gas dalam network Ethereum?";
          options = [
            "Untuk mengisi bahan bakar kendaraan",
            "Unit biaya untuk membayar komputasi dan eksekusi operasi di network",
            "Nama lain dari Ether",
            "Sistem voting dalam Ethereum"
          ];
          correctAnswer = 1;
          explanation = "Gas adalah unit yang mengukur biaya komputasi. Setiap operasi di Ethereum membutuhkan gas untuk dibayar dalam bentuk Ether.";
        },
        {
          questionId = 3;
          question = "Apa kepanjangan dari EVM?";
          options = [
            "Ethereum Value Machine",
            "Electronic Virtual Money",
            "Ethereum Virtual Machine",
            "Enhanced Verification Method"
          ];
          correctAnswer = 2;
          explanation = "EVM (Ethereum Virtual Machine) adalah runtime environment yang mengeksekusi smart contracts di network Ethereum.";
        },
        {
          questionId = 4;
          question = "Konsensus mechanism apa yang digunakan Ethereum setelah The Merge?";
          options = [
            "Proof of Work",
            "Proof of Stake",
            "Proof of Authority",
            "Delegated Proof of Stake"
          ];
          correctAnswer = 1;
          explanation = "Setelah The Merge pada September 2022, Ethereum beralih dari Proof of Work ke Proof of Stake untuk efisiensi energi.";
        },
        {
          questionId = 5;
          question = "Apa yang dimaksud dengan Turing-complete dalam konteks Ethereum?";
          options = [
            "Ethereum dapat menyelesaikan masalah matematika apapun",
            "Ethereum dapat menjalankan program apapun yang dapat dikomputasi",
            "Ethereum lebih cepat dari komputer biasa", 
            "Ethereum hanya untuk aplikasi sederhana"
          ];
          correctAnswer = 1;
          explanation = "Turing-complete berarti Ethereum dapat menjalankan program atau algoritma apapun yang dapat dikomputasi, membuatnya sangat fleksibel.";
        }
      ];
      passingScore = 60;
      timeLimit = 300;
    },

    // Quiz untuk Course 2: Solidity Smart Contract Development
    {
      courseId = 2;
      moduleId = 1;
      title = "Quiz: Introduction to Smart Contracts";
      questions = [
        {
          questionId = 1;
          question = "Siapa yang pertama kali memperkenalkan konsep smart contracts?";
          options = [
            "Satoshi Nakamoto",
            "Vitalik Buterin",
            "Nick Szabo",
            "Gavin Wood"
          ];
          correctAnswer = 2;
          explanation = "Nick Szabo pertama kali memperkenalkan konsep smart contracts pada tahun 1994, jauh sebelum blockchain menjadi populer.";
        },
        {
          questionId = 2;
          question = "Apa keuntungan utama smart contracts dibanding kontrak tradisional?";
          options = [
            "Lebih mudah diubah",
            "Self-executing dan menghilangkan kebutuhan intermediary",
            "Selalu memerlukan pihak ketiga",
            "Lebih murah untuk dibuat"
          ];
          correctAnswer = 1;
          explanation = "Smart contracts dapat mengeksekusi sendiri ketika kondisi terpenuhi, mengurangi biaya dan waktu dengan menghilangkan perantara.";
        },
        {
          questionId = 3;
          question = "Apa yang dimaksud dengan immutable dalam smart contracts?";
          options = [
            "Contract dapat diubah kapan saja",
            "Contract tidak dapat diubah setelah deploy (kecuali ada upgrade mechanism)",
            "Contract selalu berubah otomatis",
            "Contract hanya bisa diubah oleh admin"
          ];
          correctAnswer = 1;
          explanation = "Immutable berarti smart contract tidak dapat diubah setelah dideploy, kecuali ada mekanisme upgrade yang dirancang khusus.";
        },
        {
          questionId = 4;
          question = "Manakah yang BUKAN merupakan use case smart contracts?";
          options = [
            "Decentralized exchanges (DEX)",
            "Voting systems",
            "Physical warehouse management",
            "Insurance claims automation"
          ];
          correctAnswer = 2;
          explanation = "Smart contracts beroperasi di dunia digital dan tidak dapat langsung mengelola aset fisik seperti warehouse tanpa oracle atau sistem eksternal.";
        },
        {
          questionId = 5;
          question = "Apa yang membuat smart contracts 'trustless'?";
          options = [
            "Semua orang saling tidak percaya",
            "Tidak memerlukan trust pada pihak ketiga karena kode yang mengatur eksekusi",
            "Tidak ada yang dapat dipercaya",
            "Hanya pemilik contract yang dipercaya"
          ];
          correctAnswer = 1;
          explanation = "Trustless berarti tidak perlu mempercayai pihak ketiga karena kode smart contract yang transparan dan immutable yang memastikan eksekusi sesuai aturan.";
        }
      ];
      passingScore = 60;
      timeLimit = 300;
    },

    // Quiz untuk Course 3: Internet Computer Development
    {
      courseId = 3;
      moduleId = 1;
      title = "Quiz: Introduction to Internet Computer";
      questions = [
        {
          questionId = 1;
          question = "Apa keunggulan utama Internet Computer dibanding blockchain lain?";
          options = [
            "Lebih lambat tapi lebih aman",
            "Web-speed finality dan dapat serve web content langsung",
            "Hanya untuk cryptocurrency",
            "Tidak memerlukan internet"
          ];
          correctAnswer = 1;
          explanation = "Internet Computer dapat mencapai finality dalam 1-2 detik dan canisters dapat serve HTML, CSS, JS langsung ke browser.";
        },
        {
          questionId = 2;
          question = "Apa yang dimaksud dengan 'reverse gas model' di Internet Computer?";
          options = [
            "Users membayar gas lebih mahal",
            "Tidak ada biaya gas sama sekali",
            "Developers membayar gas (cycles), bukan users",
            "Gas dibayar dengan cryptocurrency lain"
          ];
          correctAnswer = 2;
          explanation = "Dalam reverse gas model, developers yang membayar cycles untuk komputasi, sehingga users dapat berinteraksi dengan dApps tanpa perlu membayar gas fees.";
        },
        {
          questionId = 3;
          question = "Apa nama smart contracts di Internet Computer?";
          options = [
            "Smart Contracts",
            "Canisters", 
            "Actors",
            "Nodes"
          ];
          correctAnswer = 1;
          explanation = "Smart contracts di Internet Computer disebut 'canisters' yang dapat menyimpan data, menjalankan kode, dan serve web content.";
        },
        {
          questionId = 4;
          question = "Consensus mechanism apa yang digunakan Internet Computer?";
          options = [
            "Proof of Work",
            "Proof of Stake", 
            "Threshold Relay",
            "Proof of Authority"
          ];
          correctAnswer = 2;
          explanation = "Internet Computer menggunakan novel consensus mechanism yang disebut 'Threshold Relay' yang memungkinkan finality yang sangat cepat.";
        },
        {
          questionId = 5;
          question = "Apa fungsi Cycles dalam Internet Computer?";
          options = [
            "Mata uang untuk trading",
            "Unit komputasi untuk membayar resource usage canister",
            "Sistem voting", 
            "Metode enkripsi"
          ];
          correctAnswer = 1;
          explanation = "Cycles adalah unit komputasi yang digunakan untuk membayar penggunaan resource seperti storage, compute, dan bandwidth di Internet Computer.";
        }
      ];
      passingScore = 60;
      timeLimit = 300;
    },

    {
      courseId = 3;
      moduleId = 2;
      title = "Quiz: Motoko Programming Language";
      questions = [
        {
          questionId = 1;
          question = "Apa paradigma pemrograman yang digunakan Motoko?";
          options = [
            "Object-oriented programming",
            "Actor-based programming",
            "Functional programming",
            "Procedural programming"
          ];
          correctAnswer = 1;
          explanation = "Motoko menggunakan actor-based programming dimana setiap canister adalah actor yang berkomunikasi via message passing.";
        },
        {
          questionId = 2;
          question = "Apa perbedaan antara stable dan non-stable variables di Motoko?";
          options = [
            "Stable variables hilang saat upgrade, non-stable variables persist",
            "Stable variables persist across upgrades, non-stable variables direset",
            "Tidak ada perbedaan",
            "Stable variables lebih cepat"
          ];
          correctAnswer = 1;
          explanation = "Stable variables persist across canister upgrades, sedangkan non-stable variables akan direset ke nilai default saat upgrade.";
        },
        {
          questionId = 3;
          question = "Syntax apa yang digunakan untuk error handling di Motoko?";
          options = [
            "try-catch",
            "Result type dengan #ok dan #err",
            "throw-exception",
            "if-else statements"
          ];
          correctAnswer = 1;
          explanation = "Motoko menggunakan Result type yang dapat berisi #ok(value) untuk success atau #err(error) untuk error handling yang type-safe.";
        },
        {
          questionId = 4;
          question = "Apa yang dimaksud dengan pattern matching di Motoko?";
          options = [
            "Mencocokkan string patterns",
            "Teknik untuk destructure dan match values menggunakan switch expressions",
            "Algoritma pencarian",
            "Sistem database matching"
          ];
          correctAnswer = 1;
          explanation = "Pattern matching memungkinkan untuk destructure dan match values dengan berbagai patterns menggunakan switch expressions, sangat powerful untuk handling variants dan options.";
        },
        {
          questionId = 5;
          question = "Bagaimana actors berkomunikasi di Motoko?";
          options = [
            "Direct function calls",
            "Shared memory",
            "Asynchronous message passing",
            "Global variables"
          ];
          correctAnswer = 2;
          explanation = "Actors berkomunikasi melalui asynchronous message passing, dimana setiap message call mengembalikan Future yang dapat di-await.";
        }
      ];
      passingScore = 60;
      timeLimit = 300;
    }

    // Tambahan quiz untuk course lain bisa ditambahkan di sini
  ];

  // Helper functions untuk quiz management
  public func getQuizByModuleId(courseId: Nat, moduleId: Nat) : ?Types.CourseQuiz {
    for (quiz in quizzes.vals()) {
      if (quiz.courseId == courseId and quiz.moduleId == moduleId) {
        return ?quiz;
      };
    };
    null
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
};