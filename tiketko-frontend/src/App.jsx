import Auth from "@aws-amplify/auth";
import { makeStyles } from "@material-ui/core/styles";
import { AmplifySignOut, withAuthenticator } from "@aws-amplify/ui-react";
import {
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Typography,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";

import { useState, useEffect } from "react";

Auth.configure({
  region: "eu-central-1",
  userPoolId: "eu-central-1_XXeGS0fB4",
  userPoolWebClientId: "6rs0nf202gn32l4tjki761vk85",
});

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

function App() {
  const classes = useStyles();

  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    Auth.currentSession().then((r) => {
      let { accessToken, idToken, refreshToken } = r;
      let { payload } = accessToken;
      let userInfo = {
        accessToken: accessToken.jwtToken,
        idToken: idToken.jwtToken,
        refreshToken: refreshToken.token,
        user: {
          id: payload.sub,
          username: payload.username,
          group: payload["cognito:groups"][0],
        },
      };
      console.log(userInfo);
      setUserInfo(userInfo);
    });
  }, []);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Tiketko
          </Typography>
          <AmplifySignOut />
        </Toolbar>
      </AppBar>
      {!userInfo ? (
        <CircularProgress />
      ) : (
        <Typography>Hello {userInfo.user.username}</Typography>
      )}
    </>
  );
}

export default withAuthenticator(App, true);
