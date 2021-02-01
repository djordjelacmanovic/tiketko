import { createContext } from "react";
import { ReadyState } from "react-use-websocket";

export const MessagingContext = createContext({
  sendMessage: async () => {},
  tickets: {},
  unread: [],
  dispatch: () => {},
});
