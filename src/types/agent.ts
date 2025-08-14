// export interface AgentEvent {
//   source:string,
//   payload:string,
//   type:string
// }


export interface AgentResponse{
action: string,
target?:string,
message?:string,
escalate?:boolean
}


export interface AgentEvent {
  source: "slack" | "notion" | "jira";
  type: "message" | "task_created" | "status_updated" | "comment_added";
  payload: {
    user?: string;
    text?: string;
    taskId?: string;
    status?: string;
    [key: string]: any;
  };
}


export interface IngestedEvent{
   source: string,
    type: string,
    content: string,
    user: string,
    timestamp: string,
}
