import { MessagingContext } from "../context/messaging-context";
import useWebSocket from "react-use-websocket";
import { useReducer, useState, useCallback } from "react";
import Auth from "@aws-amplify/auth";
import { readyStateToString } from "../lib/util";

const arrToObj = (arr) =>
  arr.reduce((prev, curr) => ({ ...prev, ...{ [curr.id]: curr } }), {});

const reducer = (state, action) => {
  console.log(action);
  let { type, data } = action;
  switch (type) {
    case "STORE_TICKET":
      return { ...state, ...{ [data.id]: data } };
    case "NEW_MESSAGE":
      let ticket = state[data.ticket_id];
      if (ticket) {
        let msgs = ticket.messages || [];
        let { timestamp: lastTs } = msgs[msgs.length - 1];
        if (lastTs == data.timestamp) return state;
        ticket.messages = [...msgs, data];
        return { ...state, ...{ [data.ticket_id]: ticket } };
      } else return state;
    case "LOAD_MESSAGES":
      return arrToObj(data);
    default:
      console.log("default");
      return state;
  }
};
const wsUrl = "wss://fv4wpaz9x9.execute-api.eu-central-1.amazonaws.com/dev";

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
  const [state, dispatch] = useReducer(reducer, {});
  const [lastSeenMessage, setLastSeenMessage] = useState(null);

  console.log(lastJsonMessage);

  const connectionStatus = readyStateToString(readyState);
  console.log(connectionStatus);

  if (lastJsonMessage && lastMessage != lastSeenMessage) {
    setLastSeenMessage(lastMessage);
    dispatch(lastJsonMessage);
  }

  return (
    <MessagingContext.Provider
      value={{ sendJsonMessage, connectionStatus, tickets: state, dispatch }}
    >
      {children}
    </MessagingContext.Provider>
  );
};
