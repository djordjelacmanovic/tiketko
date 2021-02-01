import { MessagingContext } from "../context/messaging-context";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useReducer, useCallback, createContext } from "react";
import Auth from "@aws-amplify/auth";
import { DispatchContext } from "../context/dispatch-context";
const wsUrl = "wss://fv4wpaz9x9.execute-api.eu-central-1.amazonaws.com/dev";

const arrToObj = (arr) =>
  arr.reduce((prev, curr) => ({ ...prev, ...{ [curr.id]: curr } }), {});

const reducer = (state, action) => {
  let { tickets, lastMessage } = state;
  console.log(action);
  let { type, data, newRawMessage } = action;

  switch (type) {
    case "STORE_TICKET":
      if (newRawMessage)
        state = {
          ...state,
          lastMessage: newRawMessage,
          unread: [...state.unread, data.id],
        };
      return { ...state, tickets: { ...tickets, ...{ [data.id]: data } } };
    case "NEW_MESSAGE":
      console.log("lastMessage", lastMessage);
      console.log("newRawMessage", newRawMessage);
      if (lastMessage == newRawMessage) {
        console.log("nop");
        return state;
      }
      let ticket = tickets[data.ticketId];
      if (ticket) {
        let msgs = ticket.messages || [];
        ticket = { ...ticket, messages: [...msgs, data] };
        return {
          ...state,
          lastMessage: newRawMessage,
          tickets: { ...tickets, ...{ [ticket.id]: ticket } },
          unread: [...state.unread, ticket.id],
        };
      } else return state;
    case "MARK_AS_READ":
      if (!state.unread.some((tid) => tid == data.ticketId)) return state;
      return {
        ...state,
        unread: state.unread.filter((tid) => tid != data.ticketId),
      };
    case "LOAD_TICKETS":
      return { ...state, tickets: arrToObj(data) };
    default:
      console.log("default");
      return state;
  }
};

export const MessagingContextProvider = ({ children }) => {
  const getSocketUrl = useCallback(async () => {
    let {
      accessToken: { jwtToken },
    } = await Auth.currentSession();
    return `${wsUrl}?token=${jwtToken}`;
  }, []);

  const {
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
  } = useWebSocket(getSocketUrl, { shouldReconnect: (closeEvent) => true });

  const sendMessage = useCallback((msg) => sendJsonMessage(msg), []);
  const [state, dispatch] = useReducer(reducer, {
    sendMessage,
    readyState,
    tickets: {},
    unread: [],
    lastMessage: lastMessage && lastMessage.data,
  });

  let { lastMessage: lastSeenMessage } = state;

  if (lastJsonMessage && lastSeenMessage != lastMessage.data)
    dispatch({
      ...lastJsonMessage,
      newRawMessage: lastMessage.data,
    });

  return (
    <ConnectionStateContext.Provider value={readyState}>
      <MessagingContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </MessagingContext.Provider>
    </ConnectionStateContext.Provider>
  );
};

export const ConnectionStateContext = createContext(ReadyState.UNINSTANTIATED);
