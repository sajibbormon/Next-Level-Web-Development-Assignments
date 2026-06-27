export interface IIssue {
 title: string;
 description: string;
 type: "bug" | "feature_request";
 status?: "open" | "in_progress" | "resolved" ;

}

export interface IUser {
  id: number;
  name: string;
  role: string;
}