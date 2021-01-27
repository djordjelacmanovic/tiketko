import API from "@aws-amplify/api";
import { CircularProgress, Typography } from "@material-ui/core";
import { useContext, useState, useEffect } from "react";
import { Ticket } from "../components/Ticket";
import { AuthContext } from "../context/auth-context";
import { MessagingContext } from "../context/messaging-context";

export const MainPage = () => {
  const { connectionStatus, tickets, dispatch } = useContext(MessagingContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    API.get("tiketko-api", "/tickets").then((data) =>
      dispatch({ type: "LOAD_MESSAGES", data })
    );
  }, [dispatch]);

  let ticketArr = Object.values(tickets);

  return !user ? (
    <CircularProgress />
  ) : (
    <>
      <Typography>
        Hello {user.username}. {connectionStatus}
      </Typography>
      {ticketArr.map((ticket) => (
        <Ticket key={ticket.id} {...ticket} />
      ))}
    </>
  );
};
