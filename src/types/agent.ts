export interface AgentEvent {
  source:string,
  payload:string,
  type:string
}


export interface AgentResponse{
action: string,
target?:string,
message?:string,
escalate?:boolean
}
