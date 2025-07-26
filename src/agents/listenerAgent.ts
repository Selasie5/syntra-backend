export const listenerAgent = async (message: string) => {
  if (message.includes("blocked")) {
    return "It seems this task might be blocked. Want me to escalate?";
  }

  return null;
};
