import { createContext } from "react";

export const MessagingContext = createContext({
  connectionStatus: "Uninstantiated",
  sendJsonMessage: async () => {},
  tickets: {},
  dispatch: () => {},
});
