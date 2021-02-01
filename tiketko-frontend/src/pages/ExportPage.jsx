import API from "@aws-amplify/api";
import Auth from "@aws-amplify/auth";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  ListItemSecondaryAction,
  Link,
} from "@material-ui/core";
import DownloadIcon from "@material-ui/icons/CloudDownload";
import moment from "moment";

export const ExportPage = () => {
  let [exports, setExports] = useState([]);
  let [refresh, setRefresh] = useState(true);

  useEffect(() => {
    if (!refresh) return;
    API.get("tiketko-api", "/jobs")
      .then((result) => result.filter(({ type }) => type == "data_export"))
      .then(setExports)
      .then(() => setRefresh(false));
  }, [refresh]);

  let [format, setFormat] = useState("json");
  let [file, setFile] = useState(null);
  let [date, setDate] = useState(
    new Date(new Date() - 1000 * 60 * 60 * 24).toISOString().substr(0, 10)
  );

  const onSelectFormat = (ev) => setFormat(ev.target.value);

  const exportClick = async () => {
    let { jobId } = await API.get(
      "tiketko-api",
      `/data?startDate=${date}&format=${format}`
    );
    setRefresh(true);
    pollUntilDone(jobId, () => setRefresh(true));
  };

  const onFileSelected = (e) => {
    setFile(e.target.files[0]);
  };
  const importClick = async () => {
    await fileUpload(
      "https://6678h23u28.execute-api.eu-central-1.amazonaws.com/data",
      file
    );
  };
  const onDateChange = (e) => setDate(e.target.value);

  return (
    <>
      <h1>Exports</h1>
      <label for="startDate">Start date:</label>

      <input
        type="date"
        id="startDate"
        name="trip-start"
        onChange={onDateChange}
        value={date}
        required
      />

      <select onChange={onSelectFormat}>
        <option value="json" selected={format == "json"}>
          json
        </option>
        <option value="xml" selected={format == "xml"}>
          xml
        </option>
        <option value="pdf" selected={format == "pdf"}>
          pdf
        </option>
        <option value="xls" selected={format == "xls"}>
          xls
        </option>
      </select>
      <button onClick={exportClick}>Export</button>
      <label for="importFile">Select file to import: </label>
      <input
        type="file"
        id="importFile"
        onChange={onFileSelected}
        accept="application/vnd.ms-excel"
      />
      <button onClick={importClick}>Import</button>
      <List>{exports.map((e) => makeExportItem(e))}</List>
    </>
  );
};

const fileUpload = async (url, file) => {
  const session = await Auth.currentSession();
  const token = session.getIdToken().getJwtToken();
  return await axios.post(url, file, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};

function makeExportItem(e) {
  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar>{e.data.format}</Avatar>
      </ListItemAvatar>
      <ListItemText primary={primaryText(e)} secondary={secondaryText(e)} />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          disabled={!e.result || !e.result.url}
          component={Link}
          href={e.result && e.result.url}
          target="_blank"
        >
          <DownloadIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

function primaryText(job) {
  return `Export tickets created since ${job.data.query.startDate}`;
}

function secondaryText(job) {
  return (
    `scheduled: ${moment(job.scheduled_at).fromNow()}` +
    (job.finished_at ? `, finished: ${moment(job.finished_at).fromNow()}` : "")
  );
}

async function pollUntilDone(jobId, refreshCb) {
  let { status } = await API.get("tiketko-api", `/jobs/${jobId}`);
  if (status != "pending") return refreshCb();
  setTimeout(() => pollUntilDone(jobId, refreshCb), 500);
}
