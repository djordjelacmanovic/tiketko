import API from "@aws-amplify/api";
import {
  LinearProgress,
  Grid,
  GridList,
  GridListTile,
  GridListTileBar,
  IconButton,
  Badge,
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import { useContext, useEffect } from "react";
import { ReadyState } from "react-use-websocket";
import { ConnectionStateContext } from "../components/MessagingContextProvider";
import { NewTicket } from "../components/NewTicket";
import { Ticket } from "../components/Ticket";
import { AuthContext } from "../context/auth-context";
import { DispatchContext } from "../context/dispatch-context";
import { MessagingContext } from "../context/messaging-context";
import { makeStyles } from "@material-ui/core/styles";
import { SearchContext } from "../context/search-context";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  },
  icon: {
    color: "rgba(255, 255, 255, 0.54)",
  },
}));

export const MainPage = () => {
  const dispatch = useContext(DispatchContext);
  const readyState = useContext(ConnectionStateContext);
  const { tickets, unread } = useContext(MessagingContext);
  const { user } = useContext(AuthContext);
  const classes = useStyles();
  const { query } = useContext(SearchContext);

  useEffect(() => {
    API.get("tiketko-api", "/tickets").then((data) =>
      dispatch({ type: "LOAD_TICKETS", data })
    );
  }, [dispatch]);

  let ticketArr = Object.values(tickets)
    .sort(({ createdAt: ca }, { createdAt: cb }) => {
      if (ca < cb) return 1;
      if (ca > cb) return -1;
      return 0;
    })
    .filter(({ title }) => !query || title.includes(query));

  return (
    <div className={classes.root}>
      {readyState != ReadyState.OPEN ? (
        <LinearProgress color="secondary" />
      ) : (
        <>
          {
            <GridList cellHeight={240} cols={3}>
              {ticketArr.map((ticket) => (
                <GridListTile key={ticket.id} cols={1}>
                  <Ticket
                    {...ticket}
                    unread={unread.filter((tid) => tid == ticket.id).length}
                  />
                </GridListTile>
              ))}
            </GridList>
          }
          {user && user.group == "user" && <NewTicket />}
        </>
      )}
    </div>
  );
};
