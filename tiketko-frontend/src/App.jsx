import Auth from "@aws-amplify/auth";
import API from "@aws-amplify/api";

import { withAuthenticator } from "@aws-amplify/ui-react";
import AppBar from "./components/AppBar";
import { useState, useEffect } from "react";
import { MessagingContextProvider } from "./components/MessagingContextProvider";
import { MainPage } from "./pages/MainPage";
import { AuthContext } from "./context/auth-context";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import { TicketPage } from "./pages/TicketPage";
import { ExportPage } from "./pages/ExportPage";
import { SearchContext } from "./context/search-context";

Auth.configure({
  region: "eu-central-1",
  userPoolId: "eu-central-1_XXeGS0fB4",
  userPoolWebClientId: "6rs0nf202gn32l4tjki761vk85",
});

API.configure({
  endpoints: [
    {
      name: "tiketko-api",
      endpoint: "https://6678h23u28.execute-api.eu-central-1.amazonaws.com",
      region: "eu-central-1",
      custom_header: async () => {
        return {
          Authorization: `Bearer ${(await Auth.currentSession())
            .getAccessToken()
            .getJwtToken()}`,
        };
      },
    },
  ],
});

function App() {
  const [user, setUser] = useState({ user: null });
  const [query, setQuery] = useState(null);
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
      setUser({ user: userInfo.user });
    });
  }, []);
  return (
    <AuthContext.Provider value={user}>
      <MessagingContextProvider>
        <BrowserRouter>
          <SearchContext.Provider value={{ query, setQuery }}>
            <AppBar />
            <Switch>
              <Route exact path="/" component={MainPage} />
              <Route path="/tickets/:id" component={TicketPage} />
              {user.user && user.user.group == "admin" && (
                <Route path="/data" component={ExportPage} />
              )}
            </Switch>
          </SearchContext.Provider>
        </BrowserRouter>
      </MessagingContextProvider>
    </AuthContext.Provider>
  );
}

export default withAuthenticator(App);
