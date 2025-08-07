module {
  public type User = {
    name : Text;
    email : ?Text;
    completedCourses : [Text];
  };

  public type Certificate = {
    id : Nat;
    courseName : Text;
    dateIssued : Text;
    owner : Principal;
  };
}
