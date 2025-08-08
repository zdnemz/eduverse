import Time "mo:base/Time";

module {

  public type Role = {
    #admin;
    #student;
  };

  public type User = {
    name : Text;
    email : ?Text;
    completedCourses : [Text];
    role : Role;
  };

  public type Certificate = {
    id : Nat;
    courseName : Text;
    dateIssued : Text;
    owner : Principal;
  };

  public type Quiz = {
    id: Text;
    title: Text;
    description: ?Text;
    learningId: Text;
    createdAt: Time.Time;
  };

  public type Question = {
    id: Text;
    quizId: Text;
    text: Text;
    qtype: Text;
    points: Nat;
  };

  public type Option = {
    id: Text;
    questionId: Text;
    text: Text;
    isCorrect: Bool;
  };

  public type UserAnswer = {
    id: Text;
    userId: Principal;
    quizId: Text;
    questionId: Text;
    selectedOptionId: Text;
    answeredAt: Time.Time;
    isCorrect: Bool;
  };

  public type QuizResult = {
    id: Text;
    userId: Principal;
    quizId: Text;
    score: Nat;
    totalQuestions: Nat;
    correctAnswers: Nat;
    finishedAt: Time.Time;
  };
  
}
