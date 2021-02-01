import { createContext } from "react";

export const SearchContext = createContext({
  query: null,
  setQuery: (query) => {},
});
