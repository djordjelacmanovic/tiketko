import { useState, useEffect, useContext } from "react";
import API from "@aws-amplify/api";
import { useParams, Link } from "react-router-dom";
import { Ticket } from "../components/Ticket";
import { CircularProgress, TextField } from "@material-ui/core";
import { MessagingContext } from "../context/messaging-context";

export const TicketPage = () => {
  let { id } = useParams();
  let { sendJsonMessage, tickets, dispatch } = useContext(MessagingContext);
  let [ticket, setTicket] = useState(null);

  useEffect(() => {
    API.get("tiketko-api", `/tickets/${id}`).then((data) => {
      setTicket(data);
      dispatch({ type: "STORE_TICKET", data });
    });
  }, []);

  let [messageText, setMessageText] = useState("");

  const handleKeyUp = ({ key }) => {
    if (key !== "Enter") return;
    sendJsonMessage({
      ticketId: id,
      text: messageText,
    });
    setMessageText("");
  };

  const messages =
    (tickets[id] && tickets[id].messages) || (ticket && ticket.messages);

  return (
    <>
      {ticket ? (
        <>
          <Ticket {...ticket} />
          <TextField
            onKeyUp={handleKeyUp}
            onChange={({ target: { value } }) => setMessageText(value)}
            value={messageText}
            placeholder="Enter your message"
          />
          {messages.map(({ text }) => (
            <p>{text}</p>
          ))}
          <Link to="/">Back</Link>
        </>
      ) : (
        <CircularProgress />
      )}
    </>
  );
};
