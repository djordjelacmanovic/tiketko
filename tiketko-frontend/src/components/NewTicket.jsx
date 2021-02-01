import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import API from "@aws-amplify/api";

export const NewTicket = () => {
  const [open, setOpen] = React.useState(false);
  const [formState, setFormState] = React.useState({ title: "", details: "" });
  const fabStyle = {
    margin: 0,
    top: "auto",
    right: 20,
    bottom: 20,
    left: "auto",
    position: "fixed",
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChangeTitle = ({ target: { value } }) =>
    setFormState({ ...formState, title: value });

  const handleChangeDetails = ({ target: { value } }) =>
    setFormState({ ...formState, details: value });

  const handleSubmit = async () => {
    API.post("tiketko-api", "/tickets", { body: formState });
    setFormState({ title: "", details: "" });
    setOpen(false);
  };

  return (
    <div>
      <Fab
        onClick={handleClickOpen}
        style={fabStyle}
        color="primary"
        aria-label="add"
      >
        <AddIcon />
      </Fab>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Open a ticket</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            placeholder="Enter the subject of your ticket"
            margin="dense"
            id="title"
            label="Title"
            type="text"
            value={formState.title}
            onChange={handleChangeTitle}
            fullWidth
          />
          <TextField
            autoFocus
            margin="dense"
            id="details"
            label="Description"
            type="text"
            placeholder="Describe your issue in detail"
            fullWidth
            multiline
            value={formState.details}
            onChange={handleChangeDetails}
            rows={20}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
