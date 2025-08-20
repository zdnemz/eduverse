import Types "../Types";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

module {
  public let quizzes : [Types.CourseQuiz] = [
    // Quiz untuk Course 1: Blockchain Fundamentals & Ethereum (7 soal)
    {
      courseId = 1;
      title = "Quiz: Blockchain Fundamentals & Ethereum";
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
          correctAnswer = 2;
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
          questionId = 5;
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
          questionId = 6;
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
          questionId = 7;
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
      passingScore = 60; // 5 dari 7 soal benar
      timeLimit = 420; // 7 menit
    },
    
    // Quiz untuk Course 2: Solidity Smart Contract Development (7 soal)
    {
      courseId = 2;
      title = "Quiz: Solidity Smart Contract Development";
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
          question = "Keyword apa yang digunakan untuk mendeklarasikan state variable yang dapat diubah dari luar contract?";
          options = [
            "private",
            "internal",
            "public",
            "external"
          ];
          correctAnswer = 2;
          explanation = "Keyword 'public' membuat state variable dapat diakses dari luar contract dan otomatis membuat getter function.";
        },
        {
          questionId = 4;
          question = "Apa yang dimaksud dengan 'payable' function di Solidity?";
          options = [
            "Function yang membayar gas fee",
            "Function yang dapat menerima Ether",
            "Function yang hanya bisa dipanggil owner",
            "Function yang tidak memerlukan gas"
          ];
          correctAnswer = 1;
          explanation = "Function dengan modifier 'payable' dapat menerima Ether ketika dipanggil. Tanpa modifier ini, function akan reject Ether.";
        },
        {
          questionId = 5;
          question = "Manakah data type yang tepat untuk menyimpan alamat Ethereum di Solidity?";
          options = [
            "string",
            "bytes32",
            "address",
            "uint256"
          ];
          correctAnswer = 2;
          explanation = "Data type 'address' didesain khusus untuk menyimpan alamat Ethereum (20 bytes) dan memiliki built-in methods seperti .balance dan .transfer().";
        },
        {
          questionId = 6;
          question = "Apa fungsi modifier 'view' pada function Solidity?";
          options = [
            "Function dapat mengubah state",
            "Function tidak dapat mengubah state tapi bisa membaca",
            "Function tidak dapat membaca atau mengubah state",
            "Function hanya bisa dipanggil sekali"
          ];
          correctAnswer = 1;
          explanation = "Modifier 'view' menandakan bahwa function tidak mengubah state variables, hanya membaca data dari blockchain.";
        },
        {
          questionId = 7;
          question = "Event di Solidity digunakan untuk apa?";
          options = [
            "Menyimpan data permanent di blockchain",
            "Logging dan komunikasi dengan aplikasi external",
            "Menjalankan function otomatis",
            "Menghemat gas fee"
          ];
          correctAnswer = 1;
          explanation = "Event digunakan untuk logging aktivitas di blockchain dan memungkinkan aplikasi external untuk mendeteksi perubahan di smart contract.";
        }
      ];
      passingScore = 60;
      timeLimit = 420;
    },

    // Quiz untuk Course 3: Internet Computer Development (7 soal)
    {
      courseId = 3;
      title = "Quiz: Internet Computer Development";
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
          questionId = 5;
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
          questionId = 6;
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
          questionId = 7;
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
      timeLimit = 420;
    }

    // Quiz untuk course lainnya bisa ditambahkan di sini dengan format yang sama
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