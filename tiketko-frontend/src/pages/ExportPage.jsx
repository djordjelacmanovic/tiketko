import API from "@aws-amplify/api";
import Auth from "@aws-amplify/auth";
import React, { useState, useEffect } from "react";
import axios from "axios";

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
    await API.get("tiketko-api", `/data?startDate=${date}`, {
      headers: {
        Accept: getAcceptHeader(format),
      },
    });

    setTimeout(() => setRefresh(true), 1000);
  };

  const onFileSelected = (e) => {
    setFile(e.target.files[0]);
  };
  const importClick = async () => {
    await fileUpload(
      "https://6678h23u28.execute-api.eu-central-1.amazonaws.com/data",
      file,
      getAcceptHeader(format)
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
      {exports.map((e) => makeExportItem(e))}
    </>
  );
};

const fileUpload = async (url, file, accept) => {
  const session = await Auth.currentSession();
  const token = session.getIdToken().getJwtToken();
  return await axios.post(url, file, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
      Accept: accept,
    },
  });
};

function makeExportItem(e) {
  return (
    <p>
      sch: {e.scheduled_at}, fin: {e.finished_at} - {e.data.contentType} -{" "}
      {e.status} -
      {e.result && e.result.url && (
        <a href={e.result.url} target="_blank">
          Download
        </a>
      )}
    </p>
  );
}

function getAcceptHeader(format) {
  switch (format) {
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    case "xls":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
  }
}
