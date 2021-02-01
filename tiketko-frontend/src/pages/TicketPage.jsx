import { useState, useEffect, useContext } from "react";
import API from "@aws-amplify/api";
import { useParams, Link } from "react-router-dom";
import { Ticket } from "../components/Ticket";
import {
  CircularProgress,
  TextField,
  ListItem,
  ListItemAvatar,
  ListItemText,
  List,
  Avatar,
  Typography,
  LinearProgress,
} from "@material-ui/core";
import { MessagingContext } from "../context/messaging-context";
import { DispatchContext } from "../context/dispatch-context";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import moment from "moment";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  list: {
    position: "relative",
    overflow: "auto",
    maxHeight: 460,
  },
  cell: {
    padding: theme.spacing(2),
  },
}));

export const TicketPage = () => {
  let { id } = useParams();
  let dispatch = useContext(DispatchContext);
  let { sendMessage, tickets } = useContext(MessagingContext);
  let [ticket, setTicket] = useState(null);
  const classes = useStyles();
  useEffect(() => {
    API.get("tiketko-api", `/tickets/${id}`).then((data) => {
      setTicket(data);
      dispatch({ type: "STORE_TICKET", data });
    });
  }, [id]);

  let [messageText, setMessageText] = useState("");

  const handleKeyUp = ({ key }) => {
    if (key !== "Enter") return;
    sendMessage({
      ticketId: id,
      text: messageText,
    });
    setMessageText("");
  };

  const messages =
    (tickets[id] && tickets[id].messages) || (ticket && ticket.messages);

  dispatch({ type: "MARK_AS_READ", data: { ticketId: id } });

  return (
    <div className={classes.root}>
      <Grid container spacing={3} direction="row" justify="center">
        {ticket ? (
          <>
            <Grid item xs={12} sm={6} className={classes.cell}>
              <Ticket {...ticket} />
            </Grid>
            <Grid item xs={12} sm={5} className={classes.cell}>
              <Typography variant="h5" component="h2">
                Messages
              </Typography>
              <List className={classes.list}>
                {messages.map((m) => (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>{m.user.username[0].toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={m.text}
                      secondary={moment(m.timestamp).fromNow()}
                    />
                  </ListItem>
                ))}
              </List>
              <TextField
                onKeyUp={handleKeyUp}
                onChange={({ target: { value } }) => setMessageText(value)}
                value={messageText}
                fullWidth
                placeholder="Enter your message"
              />
            </Grid>
          </>
        ) : (
          <CircularProgress />
        )}
      </Grid>
    </div>
  );
};
