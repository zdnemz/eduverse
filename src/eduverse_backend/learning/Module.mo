import Time "mo:base/Time";
import Array "mo:base/Array";
import Types "../Types";

module {

  public let courses : [Types.CourseInfo] = [
    {
      id = 1;
      title = "Blockchain Fundamentals & Ethereum";
      duration = "12 weeks";
      instructor = "Dr. Vitalik Chen";
      thumbnail = "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400";
      difficulty = #Intermediate;
      rating = 4.9;
      category = "Blockchain";
      students = 1200;
      totalLessons = 24;
    },
    {
      id = 2;
      title = "Solidity Smart Contract Development";
      duration = "10 weeks";
      instructor = "Alex Ethereum";
      thumbnail = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400";
      difficulty = #Advanced;
      rating = 4.8;
      category = "Smart Contracts";
      students = 950;
      totalLessons = 18;
    },
    {
      id = 3;
      title = "Internet Computer (ICP) Development";
      duration = "14 weeks";
      instructor = "Dominic Williams";
      thumbnail = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400";
      difficulty = #Advanced;
      rating = 4.7;
      category = "Internet Computer";
      students = 780;
      totalLessons = 32;
    },
    {
      id = 4;
      title = "Web3 Frontend with React & ethers.js";
      duration = "8 weeks";
      instructor = "Sarah Web3";
      thumbnail = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400";
      difficulty = #Intermediate;
      rating = 4.6;
      category = "Frontend";
      students = 1100;
      totalLessons = 20;
    },
    {
      id = 5;
      title = "DeFi Protocols & Yield Farming";
      duration = "10 weeks";
      instructor = "Andre DeFi";
      thumbnail = "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400";
      difficulty = #Advanced;
      rating = 4.9;
      category = "DeFi";
      students = 890;
      totalLessons = 22;
    },
    {
      id = 6;
      title = "NFT Marketplace Development";
      duration = "6 weeks";
      instructor = "Maya NFT";
      thumbnail = "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400";
      difficulty = #Intermediate;
      rating = 4.8;
      category = "NFTs";
      students = 1300;
      totalLessons = 16;
    },
    {
      id = 7;
      title = "Rust Programming for Web3";
      duration = "12 weeks";
      instructor = "Gavin Rust";
      thumbnail = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400";
      difficulty = #Advanced;
      rating = 4.7;
      category = "Programming";
      students = 650;
      totalLessons = 28;
    },
    {
      id = 8;
      title = "DAO Governance & Tokenomics";
      duration = "4 weeks";
      instructor = "Token Master";
      thumbnail = "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400";
      difficulty = #Beginner;
      rating = 4.6;
      category = "Governance";
      students = 2100;
      totalLessons = 14;
    },
    {
      id = 9;
      title = "Cryptocurrency Trading & Analysis";
      duration = "8 weeks";
      instructor = "Crypto Analyst Pro";
      thumbnail = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400";
      difficulty = #Beginner;
      rating = 4.5;
      category = "Trading";
      students = 1800;
      totalLessons = 20;
    },
  ];

  // Generate LearningModules dari courses
  public func mapModules() : [Types.LearningModule] {
    Array.map<Types.CourseInfo, Types.LearningModule>(
      courses,
      func(course) {
        {
          id = course.id;
          courseId = course.id;
          title = course.title # " - Module";
          description = "Materi lengkap untuk kursus " # course.title;
          content = "<p>Ini adalah konten materi untuk " # course.title # ".</p>";
          estimatedTime = "Varies";
          createdAt = Time.now();
          updatedAt = Time.now();
        }
      }
    )
  };

  // Generate quizzes dari courses
  public func getQuizzes() : [Types.Quiz] {
    Array.map<Types.CourseInfo, Types.Quiz>(
      courses,
      func(course) {
        {
          id = course.id;
          moduleId = course.id;
          title = course.title # " - Quiz";
          description = ?("Quiz untuk materi " # course.title);
          passingScore = 70;
          timeLimit = ?900; // 15 menit
          createdAt = Time.now();
        }
      }
    )
  };


};
