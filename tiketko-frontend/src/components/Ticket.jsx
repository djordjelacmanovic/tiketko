import React from "react";
import { Link } from "react-router-dom";

export const Ticket = ({ id, user, createdAt, title, details, status }) => {
  return (
    <>
      <Link to={`/ticket/${id}`}>
        <h1>{title}</h1>
      </Link>
      <p>{details}</p>
      <p>{status}</p>
      <p>
        Created by {user.username} @ {createdAt}
      </p>
    </>
  );
};
