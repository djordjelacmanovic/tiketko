import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Card,
  CardActions,
  Button,
  CardHeader,
  IconButton,
  Avatar,
  Badge,
  Box,
} from "@material-ui/core";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import InfoIcon from "@material-ui/icons/Info";
import moment from "moment";
import { Link } from "react-router-dom";
import API from "@aws-amplify/api";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

export const Ticket = ({
  id,
  title,
  details,
  user,
  createdAt,
  status,
  unread,
}) => {
  const classes = useStyles();
  const onMarkCompleteClick = async () => {
    await API.patch("tiketko-api", `/tickets/${id}`, {
      body: {
        status: "CLOSED",
      },
    });
  };
  return (
    <Card className={classes.root} variant="outlined">
      <CardHeader
        avatar={
          unread > 0 ? (
            <Badge badgeContent={unread} color="secondary">
              <Avatar>{user.username.toUpperCase()[0]}</Avatar>
            </Badge>
          ) : (
            <Avatar>{user.username.toUpperCase()[0]}</Avatar>
          )
        }
        action={
          <IconButton
            aria-label="settings"
            component={Link}
            to={`/tickets/${id}`}
          >
            <InfoIcon />
          </IconButton>
        }
        title={`Status: ${titleCase(status.replace("_", " "))}`}
        subheader={`${user.username} - ${moment(createdAt).fromNow()}`}
      />
      <CardContent>
        <Typography variant="h5" component="h2" noWrap>
          {title}
        </Typography>
        <Typography variant="body2" component="p" noWrap>
          {details}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          onClick={onMarkCompleteClick}
          color="primary"
          disabled={status === "CLOSED"}
        >
          Mark As Closed
        </Button>
      </CardActions>
    </Card>
  );
};

const titleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
