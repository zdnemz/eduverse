import Text "mo:base/Text";
import Array "mo:base/Array";

persistent actor Quiz {

  type Question = {
    text: Text;
    options: [Text];
    answer: Text; // e.g., "A"
  };

  private transient var questions : [Question] = [
    {
      text = "Apa output dari: let a = 5; let b = 3; a + b?";
      options = ["A. 8", "B. 53", "C. 35", "D. Error"];
      answer = "A";
    },
    {
      text = "Tipe data bilangan bulat di Motoko adalah...";
      options = ["A. int", "B. nat", "C. Int", "D. Integer"];
      answer = "C";
    }
  ];

  // Only expose question text and options, not the answer
  type PublicQuestion = {
    text: Text;
    options: [Text];
  };

  public query func getQuestion(index : Nat) : async ?PublicQuestion {
    if (index < questions.size()) {
      let q = questions[index];
      return ?{ text = q.text; options = q.options };
    } else {
      return null;
    };
  };

  public query func getTotalQuestions() : async Nat {
    return questions.size();
  };

  public func checkAnswers(userAnswers : [Text]) : async [Bool] {
    return Array.tabulate<Bool>(questions.size(), func (i : Nat) : Bool {
      if (i < userAnswers.size()) {
        Text.equal(userAnswers[i], questions[i].answer)
      } else {
        false
      }
    });
  };
}